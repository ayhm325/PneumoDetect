import { jest } from "@jest/globals";
import { Server } from "socket.io";
import { createServer } from "http";
import Client from "socket.io-client";
import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "jest-test-secret-32-chars-minimum!!";

describe("Socket.IO Authorization and Room Access Control", () => {
  let io, server, serverAddress;
  let clientSocket;

  const mockPrisma = {
    chat: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    patient: {
      findUnique: jest.fn(),
    },
    message: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeAll((done) => {
    server = createServer();
    io = new Server(server);

    // Middleware mirroring scripts/socket-server.js
    io.use((socket, next) => {
      try {
        const token = socket.handshake.auth?.token;
        if (!token) return next(new Error("unauthenticated"));
        const user = jwt.verify(token, SECRET);
        socket.user = { id: user.id, role: user.role, email: user.email };
        return next();
      } catch (err) {
        return next(new Error("invalid_token"));
      }
    });

    // Event handlers mirroring the hardened scripts/socket-server.js
    io.on("connection", (socket) => {
      async function verifyUserChatAccess(userId, role, chatId) {
        if (!chatId || !userId) return false;
        try {
          const chat = await mockPrisma.chat.findUnique({ where: { id: chatId } });
          if (!chat) return false;
          if (role === "admin") return true;
          if (role === "doctor") return chat.doctorId === userId;
          if (role === "patient") {
            const patient = await mockPrisma.patient.findUnique({ where: { userId } });
            return Boolean(patient && patient.id === chat.patientId);
          }
          return false;
        } catch {
          return false;
        }
      }

      socket.on("join", async (chatId, ack) => {
        if (!chatId) return ack?.({ error: "invalid_payload" });
        const isAuthorized = await verifyUserChatAccess(socket.user?.id, socket.user?.role, chatId);
        if (!isAuthorized) return ack?.({ error: "forbidden" });
        socket.join(`chat:${chatId}`);
        ack?.({ ok: true });
      });

      socket.on("read_ack", async ({ messageIds } = {}, ack) => {
        if (!Array.isArray(messageIds) || messageIds.length === 0) return ack?.({ ok: false });
        const user = socket.user;
        if (!user?.id) return ack?.({ error: "unauthenticated" });

        for (const id of messageIds) {
          const msg = await mockPrisma.message.findUnique({
            where: { id },
            include: { chat: true },
          });
          if (!msg || msg.status === "read") continue;

          const isAuthorized = await verifyUserChatAccess(user.id, user.role, msg.chatId);
          if (!isAuthorized) continue;

          const userSenderType = user.role === "doctor" ? "doctor" : "patient";
          if (msg.sender === userSenderType) continue;

          await mockPrisma.message.update({ where: { id }, data: { status: "read" } });
        }
        ack?.({ ok: true });
      });
    });

    server.listen(() => {
      const port = server.address().port;
      serverAddress = `http://localhost:${port}`;
      done();
    });
  });

  afterAll((done) => {
    io.close();
    server.close(done);
  });

  afterEach(() => {
    if (clientSocket && clientSocket.connected) {
      clientSocket.disconnect();
    }
    jest.clearAllMocks();
  });

  test("unauthorized user cannot join another user's chat room", (done) => {
    const token = jwt.sign(
      { id: "attacker-user-id", role: "patient", email: "attacker@test.com" },
      SECRET
    );

    // Mock chat belonging to doctor-1 and victim-patient-id
    mockPrisma.chat.findUnique.mockResolvedValueOnce({
      id: "victim-chat-1",
      doctorId: "doctor-1",
      patientId: "victim-patient-id",
    });
    mockPrisma.patient.findUnique.mockResolvedValueOnce({
      id: "attacker-patient-id",
      userId: "attacker-user-id",
    });

    clientSocket = Client(serverAddress, {
      auth: { token },
      transports: ["websocket"],
    });

    clientSocket.on("connect", () => {
      clientSocket.emit("join", "victim-chat-1", (response) => {
        expect(response).toEqual({ error: "forbidden" });
        done();
      });
    });
  });

  test("authorized participant can successfully join their own chat room", (done) => {
    const token = jwt.sign(
      { id: "legit-doctor-id", role: "doctor", email: "doc@test.com" },
      SECRET
    );

    mockPrisma.chat.findUnique.mockResolvedValueOnce({
      id: "chat-123",
      doctorId: "legit-doctor-id",
      patientId: "patient-456",
    });

    clientSocket = Client(serverAddress, {
      auth: { token },
      transports: ["websocket"],
    });

    clientSocket.on("connect", () => {
      clientSocket.emit("join", "chat-123", (response) => {
        expect(response).toEqual({ ok: true });
        done();
      });
    });
  });

  test("read_ack does not mark messages read if user does not belong to the chat", (done) => {
    const token = jwt.sign(
      { id: "eavesdropper", role: "patient", email: "eaves@test.com" },
      SECRET
    );

    mockPrisma.message.findUnique.mockResolvedValueOnce({
      id: "msg-999",
      chatId: "private-chat-xyz",
      status: "delivered",
      sender: "doctor",
    });

    // Chat access check fails for eavesdropper
    mockPrisma.chat.findUnique.mockResolvedValueOnce({
      id: "private-chat-xyz",
      doctorId: "doctor-1",
      patientId: "patient-target",
    });
    mockPrisma.patient.findUnique.mockResolvedValueOnce({
      id: "patient-eavesdropper",
      userId: "eavesdropper",
    });

    clientSocket = Client(serverAddress, {
      auth: { token },
      transports: ["websocket"],
    });

    clientSocket.on("connect", () => {
      clientSocket.emit("read_ack", { messageIds: ["msg-999"] }, () => {
        expect(mockPrisma.message.update).not.toHaveBeenCalled();
        done();
      });
    });
  });
});
