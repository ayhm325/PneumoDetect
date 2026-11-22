import http from "http";
import { jest } from "@jest/globals";
import jwt from "jsonwebtoken";
import request from "supertest";
import { io as ioClient } from "socket.io-client";
import { createApp } from "../apps/api/src/bootstrap/createApp";
import { setupSocket } from "../apps/api/src/socket/setupSocket";
import { prisma } from "../apps/api/src/db/prisma";
import { setChatRealtimeServer } from "../apps/api/src/services/chat/chatRealtimePublisher";

const SECRET = process.env.JWT_SECRET || "jest-test-secret-32-chars-minimum!!";

function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: "1h" });
}

function connectClient(port, token) {
  return new Promise((resolve, reject) => {
    const client = ioClient(`http://127.0.0.1:${port}`, {
      auth: { token },
      transports: ["websocket"],
      forceNew: true,
    });
    const timer = setTimeout(() => reject(new Error("Socket connect timeout")), 5000);
    client.on("connect", () => {
      clearTimeout(timer);
      resolve(client);
    });
    client.on("connect_error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

function joinRoom(client, chatId) {
  return new Promise((resolve) => {
    client.emit("join", chatId, (ack) => resolve(ack));
  });
}

describe("Production Chat Real-Time & Security Integration", () => {
  let server;
  let io;
  let port;
  let messagesStore;
  let msgSeq;

  const doctorToken = signToken({ id: "doc-1", role: "doctor", email: "doc@test.com", isActive: true });
  const patientToken = signToken({ id: "pat-user-1", role: "patient", email: "pat@test.com", isActive: true });
  const outsiderToken = signToken({ id: "outsider-1", role: "patient", email: "out@test.com", isActive: true });
  const adminToken = signToken({ id: "admin-1", role: "admin", email: "admin@test.com", isActive: true });

  beforeAll(async () => {
    const app = createApp();
    server = http.createServer(app);
    io = setupSocket(server);
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    port = server.address().port;
  });

  afterAll(async () => {
    setChatRealtimeServer(null);
    if (io) await new Promise((resolve) => io.close(resolve));
    if (server) await new Promise((resolve) => server.close(resolve));
  });

  beforeEach(() => {
    messagesStore = [];
    msgSeq = 1;
    jest.restoreAllMocks();

    jest.spyOn(prisma.chat, "findUnique").mockImplementation(async ({ where }) => {
      if (where?.id === "chat-1") {
        return {
          id: "chat-1",
          doctorId: "doc-1",
          patientId: "pat-1",
          updatedAt: new Date(),
        };
      }
      return null;
    });

    jest.spyOn(prisma.chat, "update").mockResolvedValue({ id: "chat-1" });

    jest.spyOn(prisma.patient, "findUnique").mockImplementation(async ({ where }) => {
      if (where?.userId === "pat-user-1" || where?.id === "pat-1") {
        return { id: "pat-1", userId: "pat-user-1", doctorId: "doc-1", fullName: "Patient One" };
      }
      if (where?.userId === "outsider-1") {
        return { id: "pat-outsider", userId: "outsider-1", doctorId: "doc-other" };
      }
      return null;
    });

    jest.spyOn(prisma.doctor, "findUnique").mockImplementation(async ({ where }) => {
      if (where?.userId === "doc-1" || where?.id === "doc-1") {
        return { id: "doc-1", userId: "doc-1", status: "active" };
      }
      return null;
    });

    jest.spyOn(prisma.message, "findFirst").mockImplementation(async ({ where }) => {
      if (where?.chatId && where?.clientKey) {
        return (
          messagesStore.find(
            (m) => m.chatId === where.chatId && m.clientKey === where.clientKey,
          ) || null
        );
      }
      return null;
    });

    jest.spyOn(prisma.message, "findUnique").mockImplementation(async ({ where }) => {
      if (where?.chatId_clientKey) {
        return (
          messagesStore.find(
            (m) =>
              m.chatId === where.chatId_clientKey.chatId &&
              m.clientKey === where.chatId_clientKey.clientKey,
          ) || null
        );
      }
      if (where?.id) {
        return messagesStore.find((m) => m.id === where.id) || null;
      }
      return null;
    });

    jest.spyOn(prisma.message, "create").mockImplementation(async ({ data }) => {
      if (data.clientKey) {
        const dup = messagesStore.find(
          (m) => m.chatId === data.chatId && m.clientKey === data.clientKey,
        );
        if (dup) {
          throw new Error("Unique constraint failed");
        }
      }
      const created = {
        id: `msg-${msgSeq++}`,
        chatId: data.chatId,
        sender: data.sender,
        text: data.text ?? null,
        clientKey: data.clientKey ?? null,
        fileUrl: data.fileUrl ?? null,
        mimeType: data.mimeType ?? null,
        fileName: data.fileName ?? null,
        status: "sent",
        createdAt: new Date(),
      };
      messagesStore.push(created);
      return created;
    });

    jest.spyOn(prisma.message, "findMany").mockImplementation(async ({ where }) => {
      if (where?.id?.in) {
        return messagesStore.filter((m) => where.id.in.includes(m.id));
      }
      return messagesStore.filter((m) => m.chatId === where?.chatId);
    });

    jest.spyOn(prisma.message, "updateMany").mockImplementation(async ({ where, data }) => {
      let count = 0;
      for (const m of messagesStore) {
        if (where?.id?.in?.includes(m.id)) {
          m.status = data.status;
          count += 1;
        }
      }
      return { count };
    });

    jest.spyOn(prisma.notification, "findFirst").mockResolvedValue(null);
    jest.spyOn(prisma.notification, "create").mockResolvedValue({ id: "notif-1" });
    jest.spyOn(prisma.notification, "updateMany").mockResolvedValue({ count: 0 });
  });

  test("Doctor and Patient exchange live messages via Socket.IO and unauthorized join is rejected", async () => {
    const docSocket = await connectClient(port, doctorToken);
    const patSocket = await connectClient(port, patientToken);
    const outSocket = await connectClient(port, outsiderToken);

    try {
      expect(await joinRoom(docSocket, "chat-1")).toEqual({ ok: true });
      expect(await joinRoom(patSocket, "chat-1")).toEqual({ ok: true });
      expect(await joinRoom(outSocket, "chat-1")).toEqual({ error: "forbidden" });

      const patReceived = new Promise((resolve) => {
        patSocket.once("message", (msg) => resolve(msg));
      });

      const docAck = await new Promise((resolve) => {
        docSocket.emit(
          "message",
          { chatId: "chat-1", text: "Hello from doctor", clientKey: "ck-sock-1" },
          resolve,
        );
      });

      expect(docAck.ok).toBe(true);
      expect(docAck.message.sender).toBe("doctor");

      const liveToPat = await patReceived;
      expect(liveToPat.id).toBe(docAck.message.id);
      expect(liveToPat.text).toBe("Hello from doctor");

      const docReceived = new Promise((resolve) => {
        docSocket.once("message", (msg) => resolve(msg));
      });

      const patAck = await new Promise((resolve) => {
        patSocket.emit(
          "message",
          { chatId: "chat-1", text: "Reply from patient", clientKey: "ck-sock-2" },
          resolve,
        );
      });

      expect(patAck.ok).toBe(true);
      const liveToDoc = await docReceived;
      expect(liveToDoc.sender).toBe("patient");
      expect(liveToDoc.text).toBe("Reply from patient");
    } finally {
      docSocket.disconnect();
      patSocket.disconnect();
      outSocket.disconnect();
    }
  });

  test("REST message submission broadcasts live Socket.IO event to recipient in both directions", async () => {
    const docSocket = await connectClient(port, doctorToken);
    const patSocket = await connectClient(port, patientToken);

    try {
      await joinRoom(docSocket, "chat-1");
      await joinRoom(patSocket, "chat-1");

      const patReceived = new Promise((resolve) => {
        patSocket.once("message", (msg) => resolve(msg));
      });

      const docRestRes = await request(`http://127.0.0.1:${port}`)
        .post("/api/chat/chat-1/messages")
        .set("Authorization", `Bearer ${doctorToken}`)
        .send({ text: "Sent via REST fallback", clientKey: "ck-rest-1" });

      expect(docRestRes.status).toBe(200);
      expect(docRestRes.body.message.text).toBe("Sent via REST fallback");

      const liveToPat = await patReceived;
      expect(liveToPat.id).toBe(docRestRes.body.message.id);
      expect(liveToPat.sender).toBe("doctor");

      const docReceived = new Promise((resolve) => {
        docSocket.once("message", (msg) => resolve(msg));
      });

      const patRestRes = await request(`http://127.0.0.1:${port}`)
        .post("/api/chat/chat-1/messages")
        .set("Authorization", `Bearer ${patientToken}`)
        .send({ text: "Patient REST reply", clientKey: "ck-rest-2" });

      expect(patRestRes.status).toBe(200);
      const liveToDoc = await docReceived;
      expect(liveToDoc.id).toBe(patRestRes.body.message.id);
      expect(liveToDoc.sender).toBe("patient");
    } finally {
      docSocket.disconnect();
      patSocket.disconnect();
    }
  });

  test("Notification failure does not block persistence or Socket.IO delivery", async () => {
    jest.spyOn(prisma.notification, "create").mockRejectedValue(new Error("Notification DB failure"));
    const patSocket = await connectClient(port, patientToken);

    try {
      await joinRoom(patSocket, "chat-1");
      const patReceived = new Promise((resolve) => {
        patSocket.once("message", (msg) => resolve(msg));
      });

      const res = await request(`http://127.0.0.1:${port}`)
        .post("/api/chat/chat-1/messages")
        .set("Authorization", `Bearer ${doctorToken}`)
        .send({ text: "Must deliver despite notification error", clientKey: "ck-notif-err" });

      expect(res.status).toBe(200);
      expect(res.body.message.text).toBe("Must deliver despite notification error");

      const liveMsg = await patReceived;
      expect(liveMsg.id).toBe(res.body.message.id);
    } finally {
      patSocket.disconnect();
    }
  });

  test("REST route rejects admin impersonation and ignores spoofed userId/role/chatId fields", async () => {
    const spoofedDocRes = await request(`http://127.0.0.1:${port}`)
      .post("/api/chat/chat-1/messages")
      .set("Authorization", `Bearer ${doctorToken}`)
      .send({
        userId: "pat-user-1",
        role: "patient",
        sender: "patient",
        chatId: "chat-other",
        text: "Spoof attempt",
        clientKey: "ck-spoof-1",
      });

    expect(spoofedDocRes.status).toBe(200);
    expect(spoofedDocRes.body.message.sender).toBe("doctor");
    expect(spoofedDocRes.body.message.chatId).toBe("chat-1");

    const adminRes = await request(`http://127.0.0.1:${port}`)
      .post("/api/chat/chat-1/messages")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ text: "Admin impersonation", clientKey: "ck-admin-1" });

    expect(adminRes.status).toBe(403);

    const adminReadRes = await request(`http://127.0.0.1:${port}`)
      .post("/api/chat/chat-1/read")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ messageIds: ["msg-1"] });

    expect(adminReadRes.status).toBe(403);
  });

  test("Idempotent clientKey prevents duplicate messages on retries", async () => {
    const first = await request(`http://127.0.0.1:${port}`)
      .post("/api/chat/chat-1/messages")
      .set("Authorization", `Bearer ${doctorToken}`)
      .send({ text: "Idempotent text", clientKey: "ck-idem-1" });

    const second = await request(`http://127.0.0.1:${port}`)
      .post("/api/chat/chat-1/messages")
      .set("Authorization", `Bearer ${doctorToken}`)
      .send({ text: "Idempotent text", clientKey: "ck-idem-1" });

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(second.body.message.id).toBe(first.body.message.id);
    expect(second.body.existing).toBe(true);
    expect(messagesStore.length).toBe(1);
  });
});
