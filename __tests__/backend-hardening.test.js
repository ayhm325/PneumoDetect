import { jest } from "@jest/globals";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { createSessionService } from "../apps/api/src/services/auth/sessionService";
import { createAuthService } from "../apps/api/src/services/auth/authService";
import { authenticateToken } from "../apps/api/src/lib/auth/authRequestService";
import { createChatMessageService } from "../apps/api/src/services/chat/chatMessageService";
import { createUploadService } from "../apps/api/src/services/uploads/uploadService";
import { rateLimit } from "../apps/api/src/legacy-lib/security/rateLimiter.js";

const SECRET = process.env.JWT_SECRET || "jest-test-secret-32-chars-minimum!!";

describe("Backend Security Hardening", () => {
  afterEach(() => {
    delete process.env.JWT_ISSUER;
    delete process.env.JWT_AUDIENCE;
    jest.restoreAllMocks();
  });

  test("sessionService.logout passes JWT exp in seconds (not ms) to sessionRepository.revoke", async () => {
    const revoke = jest.fn().mockResolvedValue(undefined);
    const sessionService = createSessionService({
      sessionRepository: {
        isRevoked: jest.fn().mockResolvedValue(false),
        revoke,
      },
    });

    const token = jwt.sign({ id: "u1", role: "patient" }, SECRET, { expiresIn: "1h" });
    const decoded = jwt.decode(token);

    const request = new Request("http://localhost:4000/api/auth/logout", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    await sessionService.logout(request);
    expect(revoke).toHaveBeenCalledTimes(1);
    expect(revoke).toHaveBeenCalledWith(token, decoded.exp);
    expect(revoke.mock.calls[0][1]).toBeLessThan(1e12);
  });

  test("authService.login rejects inactive doctor accounts even if doctor.status is active", async () => {
    const passwordHash = await bcrypt.hash("Pass123!", 4);
    const authService = createAuthService({
      userRepository: {
        findByEmailWithDoctor: jest.fn().mockResolvedValue({
          id: "doc-user-1",
          email: "doc@test.com",
          password: passwordHash,
          role: "doctor",
          isActive: false,
          isDeleted: false,
          doctor: { id: "doc-1", status: "active" },
        }),
      },
      doctorRepository: {},
      activityRepository: { createBestEffort: jest.fn() },
      notificationRepository: { createBestEffort: jest.fn() },
      loginAttemptStore: {
        get: () => ({ count: 0, firstAttemptAt: 0 }),
        increment: jest.fn(),
        reset: jest.fn(),
      },
      maxAttempts: 5,
      windowMinutes: 15,
    });

    await expect(
      authService.login({ email: "doc@test.com", password: "Pass123!" }),
    ).rejects.toMatchObject({
      code: "forbidden",
      statusCode: 403,
    });
  });

  test("authenticateToken rejects inactive users and enforces JWT issuer/audience when configured", async () => {
    const inactiveToken = jwt.sign(
      { id: "u-inactive", role: "doctor", isActive: false },
      SECRET,
      { expiresIn: "1h" },
    );

    await expect(authenticateToken(inactiveToken)).rejects.toMatchObject({
      code: "forbidden",
      statusCode: 403,
    });

    process.env.JWT_ISSUER = "pneumodetect-api";
    process.env.JWT_AUDIENCE = "pneumodetect-web";

    const wrongClaimsToken = jwt.sign(
      { id: "u-claims", role: "patient", isActive: true },
      SECRET,
      { expiresIn: "1h", issuer: "other-issuer" },
    );
    await expect(authenticateToken(wrongClaimsToken)).rejects.toMatchObject({
      code: "invalid_token",
      statusCode: 401,
    });

    const validClaimsToken = jwt.sign(
      { id: "u-claims", role: "patient", isActive: true },
      SECRET,
      { expiresIn: "1h", issuer: "pneumodetect-api", audience: "pneumodetect-web" },
    );
    const auth = await authenticateToken(validClaimsToken);
    expect(auth.user.id).toBe("u-claims");
  });

  test("chatMessageService.sendMessage forbids admin from sending messages as patient", async () => {
    const chatMessageService = createChatMessageService({
      chatPatientRepository: {
        findChatById: jest.fn().mockResolvedValue({
          id: "chat-1",
          doctorId: "doc-1",
          patientId: "pat-1",
        }),
        createMessage: jest.fn(),
      },
    });

    await expect(
      chatMessageService.sendMessage({
        userId: "admin-1",
        role: "admin",
        chatId: "chat-1",
        text: "hello",
      }),
    ).rejects.toMatchObject({
      code: "forbidden",
      statusCode: 403,
    });
  });

  test("rateLimit ignores forged unverified JWT cookies and isolates buckets by endpoint", async () => {
    delete process.env.REDIS_URL;
    delete process.env.REDIS_URI;
    globalThis.__rl_redis = null;

    const makeReq = (cookieToken, ip = "10.0.0.55") => ({
      url: "http://localhost:4000/api/predict",
      ip,
      headers: new Headers({ "user-agent": "jest-agent" }),
      cookies: {
        get: (name) => (name === "token" ? { value: cookieToken } : undefined),
      },
    });

    const forgedTokenA = jwt.sign({ id: "victim-a" }, "wrong-secret");
    const forgedTokenB = jwt.sign({ id: "victim-b" }, "wrong-secret");

    for (let i = 0; i < 10; i += 1) {
      const token = i % 2 === 0 ? forgedTokenA : forgedTokenB;
      const res = await rateLimit(makeReq(token), { endpoint: "POST /api/predict" });
      expect(res.limited).toBe(false);
    }

    // 11th request from same IP+UA is limited even with a different forged JWT cookie
    const blocked = await rateLimit(makeReq(jwt.sign({ id: "victim-c" }, "wrong-secret")), {
      endpoint: "POST /api/predict",
    });
    expect(blocked.limited).toBe(true);

    // Different endpoint bucket is not affected
    const otherEndpoint = await rateLimit(makeReq(forgedTokenA), {
      endpoint: "POST /api/uploads/init",
    });
    expect(otherEndpoint.limited).toBe(false);
  });

  test("uploadService enforces chat ownership and prevents cross-chat upload completion", async () => {
    const verifyChatAccess = jest.fn(async ({ chatId, userId }) => {
      if (chatId !== "chat-owned" || userId !== "user-1") {
        throw Object.assign(new Error("forbidden"), { code: "forbidden", statusCode: 403 });
      }
    });

    const uploadService = createUploadService({ verifyChatAccess });

    await expect(
      uploadService.initUpload({
        chatId: "chat-other",
        filename: "xray.png",
        userId: "user-1",
        role: "patient",
      }),
    ).rejects.toMatchObject({ code: "forbidden", statusCode: 403 });

    await expect(
      uploadService.completeUpload({
        chatId: "chat-owned",
        key: "uploads/chat-other/123-xray.png",
        filename: "xray.png",
        provider: "local",
        userId: "user-1",
        role: "patient",
      }),
    ).rejects.toMatchObject({ code: "forbidden", statusCode: 403 });

    await expect(
      uploadService.saveLocalUpload({
        relativePath: "uploads/chat-other/123-xray.png",
        data: new Uint8Array([1, 2, 3]).buffer,
        userId: "user-1",
        role: "patient",
      }),
    ).rejects.toMatchObject({ code: "forbidden", statusCode: 403 });
  });
});
