#!/usr/bin/env node
/**
 * Socket.io server for dev — chat rooms & message persistence.
 */

import http from "http";
import express from "express";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import Redis from "ioredis";
import jwt from "jsonwebtoken";
import prisma from "../lib/prismaClient.js";
import { getJwtSecret } from "../lib/auth/jwtSecret.js";
import { getJwtVerifyOptions } from "../lib/auth/jwtClaims.js";

const PORT = process.env.SOCKET_PORT ? Number(process.env.SOCKET_PORT) : 4000;
const SECRET = getJwtSecret();
const DEBUG_SOCKET = process.env.DEBUG_SOCKET === "1";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: true, credentials: true },
});

export { io };

const onlineByChat = new Map();
const onlineUserCounts = new Map();
const onlineUsers = new Set();

let redis = null;
if (process.env.REDIS_URL) {
  try {
    redis = new Redis(process.env.REDIS_URL);
    const sub = redis.duplicate();
    redis.connect().catch(() => {});
    sub.connect().catch(() => {});
    io.adapter(createAdapter(redis, sub));
    console.log("Socket.IO using Redis adapter");
  } catch (e) {
    console.warn("Failed to initialize Redis adapter", e.message || e);
    redis = null;
  }
}

function parseCookieString(cookie = "") {
  return cookie
    .split(";")
    .map((c) => c.trim())
    .reduce((acc, cur) => {
      const idx = cur.indexOf("=");
      if (idx > -1)
        acc[cur.slice(0, idx)] = decodeURIComponent(cur.slice(idx + 1));
      return acc;
    }, {});
}

async function emitGlobalPresenceSnapshotToSocket(socket) {
  try {
    const selfId = String(socket.user?.id);
    let ids = [];
    if (redis) ids = await redis.smembers("online:users").catch(() => []);
    else ids = Array.from(onlineUsers);

    for (const id of ids) {
      if (!id || id === selfId) continue;
      socket.emit("presence", { userId: id, online: true });
    }
  } catch (e) {
    console.warn("global presence snapshot error", e?.message || e);
  }
}

async function markUserOnline(socket) {
  const userId = socket.user?.id;
  if (!userId) return;
  const id = String(userId);

  if (redis) {
    try {
      const key = `online:user:${id}:sockets`;
      await redis.sadd(key, socket.id);
      const count = await redis.scard(key).catch(() => 0);
      if (count === 1) {
        await redis.sadd("online:users", id).catch(() => {});
        io.emit("presence", { userId: id, online: true });
      }
    } catch (e) {
      console.warn("markUserOnline redis error", e?.message || e);
    }
  } else {
    const prev = onlineUserCounts.get(id) || 0;
    const next = prev + 1;
    onlineUserCounts.set(id, next);
    if (prev === 0) {
      onlineUsers.add(id);
      io.emit("presence", { userId: id, online: true });
    }
  }
  await emitGlobalPresenceSnapshotToSocket(socket);
}

async function markUserOffline(socket) {
  const userId = socket.user?.id;
  if (!userId) return;
  const id = String(userId);

  if (redis) {
    try {
      const key = `online:user:${id}:sockets`;
      await redis.srem(key, socket.id).catch(() => {});
      const count = await redis.scard(key).catch(() => 0);
      if (count === 0) {
        await redis.srem("online:users", id).catch(() => {});
        io.emit("presence", { userId: id, online: false });
      }
    } catch (e) {
      console.warn("markUserOffline redis error", e?.message || e);
    }
  } else {
    const prev = onlineUserCounts.get(id) || 0;
    const next = Math.max(prev - 1, 0);
    if (next === 0) {
      onlineUserCounts.delete(id);
      onlineUsers.delete(id);
      io.emit("presence", { userId: id, online: false });
    } else onlineUserCounts.set(id, next);
  }
}

import { isTokenRevoked } from "../lib/auth/revocation.server.js";

io.use(async (socket, next) => {
  try {
    let token = socket.handshake.auth?.token;
    const cookieHeader = socket.handshake.headers?.cookie;

    if (!token) {
      const cookies = parseCookieString(cookieHeader || "");
      token = cookies.token;
    }
    if (!token) return next(new Error("unauthenticated"));

    try {
      const revoked = await isTokenRevoked(token);
      if (revoked) return next(new Error("token_revoked"));
    } catch (e) {
      console.warn("socket auth: revocation check failed", e?.message || e);
      return next(new Error("revocation_check_unavailable"));
    }

    const user = jwt.verify(token, SECRET, getJwtVerifyOptions());
    socket.user = { id: user.id, role: user.role, email: user.email };
    return next();
  } catch (err) {
    if (err.message === "token_revoked" || err.message === "revocation_check_unavailable") {
      return next(err);
    }
    return next(new Error("invalid_token"));
  }
});

io.on("connection", (socket) => {
  console.log("socket connected", socket.id, "user", socket.user?.id);

  if (socket.user?.id) socket.join(`user:${socket.user.id}`);
  markUserOnline(socket).catch(() => {});

  socket.on("whoami", () => {
    socket.emit("me", {
      id: socket.user?.id,
      role: socket.user?.role,
      email: socket.user?.email,
    });
  });

  async function verifyUserChatAccess(userId, role, chatId) {
    if (!chatId || !userId) return false;
    try {
      const chat = await prisma.chat.findUnique({ where: { id: chatId } });
      if (!chat) return false;
      if (role === "admin") return true;
      if (role === "doctor") {
        return chat.doctorId === userId;
      }
      if (role === "patient") {
        const patient = await prisma.patient.findUnique({ where: { userId } });
        return Boolean(patient && patient.id === chat.patientId);
      }
      return false;
    } catch (e) {
      console.warn("verifyUserChatAccess error", e?.message || e);
      return false;
    }
  }

  socket.on("join", async (chatId, ack) => {
    if (!chatId) return ack?.({ error: "invalid_payload" });
    const isAuthorized = await verifyUserChatAccess(socket.user?.id, socket.user?.role, chatId);
    if (!isAuthorized) {
      return ack?.({ error: "forbidden" });
    }

    const roomKey = `chat:${chatId}`;
    if (socket.rooms.has(roomKey)) return ack?.({ ok: true });
    socket.join(roomKey);

    let onlineIds = [];
    if (redis)
      onlineIds = await redis.smembers(`${roomKey}:online`).catch(() => []);
    else {
      const set = onlineByChat.get(String(chatId));
      onlineIds = set ? Array.from(set) : [];
    }
    for (const id of onlineIds) {
      if (!id || String(id) === String(socket.user.id)) continue;
      socket.emit("presence", { userId: id, online: true });
    }

    if (redis) await redis.sadd(`${roomKey}:online`, socket.user.id);
    const set = onlineByChat.get(String(chatId)) || new Set();
    set.add(String(socket.user.id));
    onlineByChat.set(String(chatId), set);

    socket.to(roomKey).emit("presence", { userId: socket.user.id, online: true });
    ack?.({ ok: true });
  });

  socket.on("leave", (chatId) => {
    if (!chatId) return;
    const roomKey = `chat:${chatId}`;
    if (!socket.rooms.has(roomKey)) return;
    socket.leave(roomKey);

    if (redis) redis.srem(`${roomKey}:online`, socket.user.id).catch(() => {});
    const set = onlineByChat.get(String(chatId));
    if (set) {
      set.delete(String(socket.user.id));
      if (set.size === 0) onlineByChat.delete(String(chatId));
    }
    socket.to(roomKey).emit("presence", { userId: socket.user.id, online: false });
  });

  socket.on("typing", async ({ chatId, typing }) => {
    if (!chatId) return;
    const roomKey = `chat:${chatId}`;
    if (!socket.rooms.has(roomKey)) {
      const isAuthorized = await verifyUserChatAccess(socket.user?.id, socket.user?.role, chatId);
      if (!isAuthorized) return;
    }
    socket.to(`chat:${chatId}`).emit("typing", { userId: socket.user.id, typing });
  });

  const RATE_WINDOW_MS = 10 * 1000;
  const RATE_MAX = 10;
  if (!socket.rate) socket.rate = { timestamps: [] };

  socket.on("message", async (payload, ack) => {
    try {
      const now = Date.now();
      socket.rate.timestamps = socket.rate.timestamps.filter((ts) => now - ts < RATE_WINDOW_MS);
      if (socket.rate.timestamps.length >= RATE_MAX) return ack?.({ error: "rate_limited" });
      socket.rate.timestamps.push(now);

      const { chatId, text, clientKey, fileUrl, mimeType, fileName } = payload || {};
      if (!chatId || (!(text?.trim()) && !fileUrl)) return ack?.({ error: "invalid_payload" });

      const chat = await prisma.chat.findUnique({ where: { id: chatId } });
      if (!chat) return ack?.({ error: "chat_not_found" });

      const user = socket.user;
      if (user.role === "doctor" && chat.doctorId !== user.id)
        return ack?.({ error: "forbidden" });
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
        data: { chatId, sender, text: text || null, clientKey, fileUrl: fileUrl || null, mimeType: mimeType || null, fileName: fileName || null },
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

  socket.on("delivered_ack", async ({ messageIds } = {}, ack) => {
    if (!Array.isArray(messageIds) || messageIds.length === 0) return ack?.({ ok: false });
    const user = socket.user;
    if (!user?.id) return ack?.({ error: "unauthenticated" });

    for (const id of messageIds) {
      const msg = await prisma.message.findUnique({
        where: { id },
        include: { chat: true },
      });
      if (!msg || msg.status !== "sent" || !msg.chat) continue;

      // Ensure the acknowledging socket is a legitimate recipient in this chat
      const isAuthorized = await verifyUserChatAccess(user.id, user.role, msg.chatId);
      if (!isAuthorized) continue;

      // Senders cannot acknowledge delivery to themselves
      const userSenderType = user.role === "doctor" ? "doctor" : "patient";
      if (msg.sender === userSenderType) continue;

      await prisma.message.update({ where: { id }, data: { status: "delivered" } });
      io.to(`chat:${msg.chatId}`).emit("message_update", { id, status: "delivered" });
    }
    ack?.({ ok: true });
  });

  socket.on("read_ack", async ({ messageIds } = {}, ack) => {
    if (!Array.isArray(messageIds) || messageIds.length === 0) return ack?.({ ok: false });
    const user = socket.user;
    if (!user?.id) return ack?.({ error: "unauthenticated" });

    for (const id of messageIds) {
      const msg = await prisma.message.findUnique({
        where: { id },
        include: { chat: true },
      });
      if (!msg || msg.status === "read" || !msg.chat) continue;

      // Ensure the acknowledging socket is a legitimate recipient in this chat
      const isAuthorized = await verifyUserChatAccess(user.id, user.role, msg.chatId);
      if (!isAuthorized) continue;

      // Senders cannot read-acknowledge their own messages
      const userSenderType = user.role === "doctor" ? "doctor" : "patient";
      if (msg.sender === userSenderType) continue;

      await prisma.message.update({ where: { id }, data: { status: "read" } });
      io.to(`chat:${msg.chatId}`).emit("message_update", { id, status: "read" });
      io.to(`chat:${msg.chatId}`).emit("message_read", { messageId: id, userId: user.id, timestamp: new Date() });
    }
    ack?.({ ok: true });
  });

  socket.on("disconnect", (reason) => {
    console.log("socket disconnected", socket.id, reason);
    markUserOffline(socket).catch(() => {});
    try {
      const rooms = Array.from(socket.rooms || []);
      rooms.forEach((r) => {
        if (!r.startsWith("chat:")) return;
        const chatId = r.split(":")[1];
        if (redis) redis.srem(`chat:${chatId}:online`, socket.user.id).catch(() => {});
        const set = onlineByChat.get(String(chatId));
        if (set) {
          set.delete(String(socket.user.id));
          if (set.size === 0) onlineByChat.delete(String(chatId));
        }
        socket.to(r).emit("presence", { userId: socket.user.id, online: false });
      });
    } catch (e) {
      console.error("disconnect presence cleanup failed", e);
    }
  });
});

server.on("error", (err) => {
  if (err?.code === "EADDRINUSE") {
    console.warn(`Socket.io port ${PORT} already in use — skipping start.`);
    process.exit(0);
  }
  console.error("Socket server error", err);
  process.exit(1);
});

server.listen(PORT, () => {
  console.log(`Socket.io server listening on port ${PORT}`);
});
