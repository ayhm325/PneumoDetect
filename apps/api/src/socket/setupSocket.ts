import type { Server as HttpServer } from "http";
import { Server, type Socket } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import Redis from "ioredis";
import jwt from "jsonwebtoken";
import { prisma } from "../db/prisma.js";
import { getJwtSecret } from "../legacy-lib/auth/jwtSecret.js";
import { getJwtVerifyOptions } from "../legacy-lib/auth/jwtClaims.js";
import { isTokenRevoked } from "../legacy-lib/auth/revocation.server.js";
import { env } from "../config/env.js";

interface SocketUser {
  id: string;
  role?: string;
  email?: string;
}

interface AuthedSocket extends Socket {
  user?: SocketUser;
  rate?: { timestamps: number[] };
}

function parseCookieString(cookie = ""): Record<string, string> {
  return cookie
    .split(";")
    .map((c) => c.trim())
    .reduce<Record<string, string>>((acc, cur) => {
      const idx = cur.indexOf("=");
      if (idx > -1) {
        acc[cur.slice(0, idx)] = decodeURIComponent(cur.slice(idx + 1));
      }
      return acc;
    }, {});
}

export function setupSocket(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: env.corsOrigins,
      credentials: true,
    },
  });

  const onlineByChat = new Map<string, Set<string>>();
  const onlineUserCounts = new Map<string, number>();
  const onlineUsers = new Set<string>();

  let redis: Redis | null = null;
  if (env.redisUrl) {
    try {
      redis = new Redis(env.redisUrl);
      const sub = redis.duplicate();
      redis.connect().catch(() => {});
      sub.connect().catch(() => {});
      io.adapter(createAdapter(redis, sub));
      console.log("Socket.IO using Redis adapter");
    } catch (e) {
      console.warn("Failed to initialize Redis adapter", (e as Error)?.message || e);
      redis = null;
    }
  }

  async function emitGlobalPresenceSnapshotToSocket(socket: AuthedSocket) {
    try {
      let ids: string[] = [];
      if (redis) {
        ids = await redis.smembers("presence:users:online").catch(() => []);
      } else {
        ids = Array.from(onlineUsers);
      }
      for (const id of ids) {
        if (!id || String(id) === String(socket.user?.id)) continue;
        socket.emit("presence", { userId: String(id), online: true, scope: "global" });
      }
    } catch {
      // ignore
    }
  }

  async function markUserOnline(socket: AuthedSocket) {
    const uid = socket.user?.id ? String(socket.user.id) : null;
    if (!uid) return;
    await emitGlobalPresenceSnapshotToSocket(socket);
    const prev = onlineUserCounts.get(uid) || 0;
    const nextCount = prev + 1;
    onlineUserCounts.set(uid, nextCount);
    if (nextCount === 1) {
      onlineUsers.add(uid);
      if (redis) await redis.sadd("presence:users:online", uid).catch(() => {});
      io.emit("presence", { userId: uid, online: true, scope: "global" });
    }
  }

  async function markUserOffline(socket: AuthedSocket) {
    const uid = socket.user?.id ? String(socket.user.id) : null;
    if (!uid) return;
    const prev = onlineUserCounts.get(uid) || 0;
    const nextCount = Math.max(0, prev - 1);
    if (nextCount === 0) {
      onlineUserCounts.delete(uid);
      onlineUsers.delete(uid);
      if (redis) await redis.srem("presence:users:online", uid).catch(() => {});
      io.emit("presence", { userId: uid, online: false, scope: "global" });
    } else {
      onlineUserCounts.set(uid, nextCount);
    }
  }

  async function verifyUserChatAccess(userId: string | undefined, role: string | undefined, chatId: string) {
    if (!chatId || !userId) return false;
    try {
      const chat = await prisma.chat.findUnique({ where: { id: chatId } });
      if (!chat) return false;
      if (role === "admin") return true;
      if (role === "doctor") return chat.doctorId === userId;
      if (role === "patient") {
        const patient = await prisma.patient.findUnique({ where: { userId } });
        return Boolean(patient && patient.id === chat.patientId);
      }
      return false;
    } catch {
      return false;
    }
  }

  io.use(async (socket: AuthedSocket, next) => {
    try {
      let token = socket.handshake.auth?.token as string | undefined;
      if (!token) {
        const cookieHeader = socket.handshake.headers?.cookie;
        const cookies = parseCookieString(cookieHeader || "");
        token = cookies.token;
      }
      if (!token) return next(new Error("unauthenticated"));

      try {
        const revoked = await isTokenRevoked(token);
        if (revoked) return next(new Error("token_revoked"));
      } catch {
        return next(new Error("revocation_check_unavailable"));
      }

      const decoded = jwt.verify(token, getJwtSecret(), getJwtVerifyOptions()) as jwt.JwtPayload;
      socket.user = {
        id: String(decoded.id),
        role: typeof decoded.role === "string" ? decoded.role : undefined,
        email: typeof decoded.email === "string" ? decoded.email : undefined,
      };
      return next();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg === "token_revoked" || msg === "revocation_check_unavailable") {
        return next(err as Error);
      }
      return next(new Error("invalid_token"));
    }
  });

  io.on("connection", (socket: AuthedSocket) => {
    if (socket.user?.id) socket.join(`user:${socket.user.id}`);
    markUserOnline(socket).catch(() => {});

    socket.on("whoami", () => {
      socket.emit("me", {
        id: socket.user?.id,
        role: socket.user?.role,
        email: socket.user?.email,
      });
    });

    socket.on("join", async (chatId: string, ack?: (res: unknown) => void) => {
      if (!chatId) return ack?.({ error: "invalid_payload" });
      const isAuthorized = await verifyUserChatAccess(socket.user?.id, socket.user?.role, chatId);
      if (!isAuthorized) return ack?.({ error: "forbidden" });

      const roomKey = `chat:${chatId}`;
      if (socket.rooms.has(roomKey)) return ack?.({ ok: true });
      socket.join(roomKey);

      const onlineIds = redis
        ? await redis.smembers(`${roomKey}:online`).catch(() => [] as string[])
        : Array.from(onlineByChat.get(String(chatId)) || []);

      for (const id of onlineIds) {
        if (!id || String(id) === String(socket.user?.id)) continue;
        socket.emit("presence", { userId: id, online: true });
      }

      if (redis && socket.user?.id) await redis.sadd(`${roomKey}:online`, socket.user.id).catch(() => {});
      const set = onlineByChat.get(String(chatId)) || new Set<string>();
      if (socket.user?.id) set.add(String(socket.user.id));
      onlineByChat.set(String(chatId), set);

      socket.to(roomKey).emit("presence", { userId: socket.user?.id, online: true });
      ack?.({ ok: true });
    });

    socket.on("leave", (chatId: string) => {
      if (!chatId) return;
      const roomKey = `chat:${chatId}`;
      if (!socket.rooms.has(roomKey)) return;
      socket.leave(roomKey);

      if (redis && socket.user?.id) redis.srem(`${roomKey}:online`, socket.user.id).catch(() => {});
      const set = onlineByChat.get(String(chatId));
      if (set && socket.user?.id) {
        set.delete(String(socket.user.id));
        if (set.size === 0) onlineByChat.delete(String(chatId));
      }
      socket.to(roomKey).emit("presence", { userId: socket.user?.id, online: false });
    });

    socket.on("typing", async ({ chatId, typing }: { chatId?: string; typing?: boolean } = {}) => {
      if (!chatId) return;
      const roomKey = `chat:${chatId}`;
      if (!socket.rooms.has(roomKey)) {
        const isAuthorized = await verifyUserChatAccess(socket.user?.id, socket.user?.role, chatId);
        if (!isAuthorized) return;
      }
      socket.to(roomKey).emit("typing", { userId: socket.user?.id, typing });
    });

    const RATE_WINDOW_MS = 10 * 1000;
    const RATE_MAX = 10;
    if (!socket.rate) socket.rate = { timestamps: [] };

    socket.on("message", async (payload: Record<string, unknown>, ack?: (res: unknown) => void) => {
      try {
        const now = Date.now();
        socket.rate!.timestamps = socket.rate!.timestamps.filter((ts) => now - ts < RATE_WINDOW_MS);
        if (socket.rate!.timestamps.length >= RATE_MAX) return ack?.({ error: "rate_limited" });
        socket.rate!.timestamps.push(now);

        const chatId = typeof payload?.chatId === "string" ? payload.chatId : "";
        const text = typeof payload?.text === "string" ? payload.text : "";
        const clientKey = typeof payload?.clientKey === "string" ? payload.clientKey : undefined;
        const fileUrl = typeof payload?.fileUrl === "string" ? payload.fileUrl : undefined;
        const mimeType = typeof payload?.mimeType === "string" ? payload.mimeType : undefined;
        const fileName = typeof payload?.fileName === "string" ? payload.fileName : undefined;

        if (!chatId || (!text.trim() && !fileUrl)) return ack?.({ error: "invalid_payload" });

        const chat = await prisma.chat.findUnique({ where: { id: chatId } });
        if (!chat) return ack?.({ error: "chat_not_found" });

        const user = socket.user!;
        if (user.role === "doctor" && chat.doctorId !== user.id) return ack?.({ error: "forbidden" });
        if (user.role === "patient") {
          const patient = await prisma.patient.findUnique({ where: { userId: user.id } });
          if (!patient || patient.id !== chat.patientId) return ack?.({ error: "forbidden" });
        }

        const sender = user.role === "doctor" ? "doctor" : "patient";

        if (clientKey) {
          const existing = await prisma.message.findFirst({ where: { chatId, clientKey } });
          if (existing) {
            io.to(`chat:${chatId}`).emit("message", { ...existing, time: existing.createdAt, __scope: "chat" });
            return ack?.({ ok: true, message: existing, existing: true });
          }
        }

        const message = await prisma.message.create({
          data: {
            chatId,
            sender,
            text: text || null,
            clientKey,
            fileUrl: fileUrl || null,
            mimeType: mimeType || null,
            fileName: fileName || null,
          },
        });

        const payloadOut = { ...message, time: message.createdAt };
        io.to(`chat:${chatId}`).emit("message", { ...payloadOut, __scope: "chat" });
        await prisma.chat.update({ where: { id: chatId }, data: { updatedAt: new Date() } });
        ack?.({ ok: true, message: payloadOut });
      } catch (err) {
        console.error("socket message error", err);
        ack?.({ error: "server_error" });
      }
    });

    socket.on("delivered_ack", async ({ messageIds }: { messageIds?: string[] } = {}, ack?: (res: unknown) => void) => {
      if (!Array.isArray(messageIds) || messageIds.length === 0) return ack?.({ ok: false });
      const user = socket.user;
      if (!user?.id) return ack?.({ error: "unauthenticated" });

      for (const id of messageIds) {
        const msg = await prisma.message.findUnique({ where: { id }, include: { chat: true } });
        if (!msg || msg.status !== "sent" || !msg.chat) continue;
        const isAuthorized = await verifyUserChatAccess(user.id, user.role, msg.chatId);
        if (!isAuthorized) continue;
        const userSenderType = user.role === "doctor" ? "doctor" : "patient";
        if (msg.sender === userSenderType) continue;

        await prisma.message.update({ where: { id }, data: { status: "delivered" } });
        io.to(`chat:${msg.chatId}`).emit("message_update", { id, status: "delivered" });
      }
      ack?.({ ok: true });
    });

    socket.on("read_ack", async ({ messageIds }: { messageIds?: string[] } = {}, ack?: (res: unknown) => void) => {
      if (!Array.isArray(messageIds) || messageIds.length === 0) return ack?.({ ok: false });
      const user = socket.user;
      if (!user?.id) return ack?.({ error: "unauthenticated" });

      for (const id of messageIds) {
        const msg = await prisma.message.findUnique({ where: { id }, include: { chat: true } });
        if (!msg || msg.status === "read" || !msg.chat) continue;
        const isAuthorized = await verifyUserChatAccess(user.id, user.role, msg.chatId);
        if (!isAuthorized) continue;
        const userSenderType = user.role === "doctor" ? "doctor" : "patient";
        if (msg.sender === userSenderType) continue;

        await prisma.message.update({ where: { id }, data: { status: "read" } });
        io.to(`chat:${msg.chatId}`).emit("message_update", { id, status: "read" });
        io.to(`chat:${msg.chatId}`).emit("message_read", { messageId: id, userId: user.id, timestamp: new Date() });
      }
      ack?.({ ok: true });
    });

    socket.on("disconnect", () => {
      markUserOffline(socket).catch(() => {});
      const rooms = Array.from(socket.rooms || []);
      rooms.forEach((r) => {
        if (!r.startsWith("chat:")) return;
        const chatId = r.split(":")[1];
        if (redis && socket.user?.id) redis.srem(`chat:${chatId}:online`, socket.user.id).catch(() => {});
        const set = onlineByChat.get(String(chatId));
        if (set && socket.user?.id) {
          set.delete(String(socket.user.id));
          if (set.size === 0) onlineByChat.delete(String(chatId));
        }
        socket.to(r).emit("presence", { userId: socket.user?.id, online: false });
      });
    });
  });

  return io;
}
