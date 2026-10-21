import { jest } from "@jest/globals";
import jwt from "jsonwebtoken";
import { clearRevokedForTest, addRevokedToken } from "../lib/auth/revocation.server.js";
import { authenticateToken, authenticateRequest } from "../src/lib/auth/authRequestService";
import { AppError } from "../src/lib/errors/appError";
import * as revocationServer from "../lib/auth/revocation.server.js";

const SECRET = process.env.JWT_SECRET || "jest-test-secret-32-chars-minimum!!";

describe("JWT Revocation and Fail-Closed Security", () => {
  beforeEach(async () => {
    await clearRevokedForTest();
    jest.restoreAllMocks();
  });

  test("valid non-revoked token is authenticated successfully", async () => {
    const token = jwt.sign(
      { id: "user-valid", role: "doctor", email: "doc@test.com", isActive: true },
      SECRET,
      { expiresIn: "1h" }
    );

    const result = await authenticateToken(token);
    expect(result.user.id).toBe("user-valid");
    expect(result.user.role).toBe("doctor");
  });

  test("revoked token is rejected with token_revoked error code", async () => {
    const token = jwt.sign(
      { id: "user-revoked", role: "patient", email: "pat@test.com" },
      SECRET,
      { expiresIn: "1h" }
    );
    await addRevokedToken(token, Math.floor(Date.now() / 1000) + 3600);

    await expect(authenticateToken(token)).rejects.toMatchObject({
      code: "token_revoked",
      statusCode: 401,
    });
  });

  test("revocation store error fails closed (revocation_check_unavailable)", async () => {
    const token = jwt.sign(
      { id: "user-store-error", role: "admin", email: "admin@test.com" },
      SECRET,
      { expiresIn: "1h" }
    );

    // Mock revocation failure (e.g. database/file/redis outage)
    jest.spyOn(revocationServer, "isTokenRevoked").mockRejectedValueOnce(new Error("Redis connection timed out"));

    await expect(authenticateToken(token)).rejects.toMatchObject({
      code: "revocation_check_unavailable",
      statusCode: 401,
    });
  });
});
