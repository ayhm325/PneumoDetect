import jwt from "jsonwebtoken";
import {
  clearRevokedForTest,
  isTokenRevoked,
  addRevokedToken,
} from "../apps/api/src/legacy-lib/auth/revocation.server.js";
import { sessionService } from "../apps/api/src/services/auth";

const SECRET = process.env.JWT_SECRET || "your-secret-key";

describe("revocation helper and whoami session service", () => {
  beforeEach(async () => {
    await clearRevokedForTest();
  });

  test("non-revoked token is accepted by whoAmI", async () => {
    const token = jwt.sign(
      { id: "user-1", role: "patient", email: "a@b.com" },
      SECRET,
    );
    const revoked = await isTokenRevoked(token);
    expect(revoked).toBe(false);

    const req = {
      headers: {
        get: (name) =>
          name.toLowerCase().startsWith("authorization")
            ? `Bearer ${token}`
            : null,
      },
      cookies: { get: () => undefined },
    };

    const body = await sessionService.whoAmI(req);
    expect(body.id).toBe("user-1");
  });

  test("revoked token is rejected (401) by whoAmI", async () => {
    const token = jwt.sign(
      { id: "user-2", role: "admin", email: "x@y.com" },
      SECRET,
    );
    await addRevokedToken(token, Math.floor(Date.now() / 1000) + 3600);

    const revoked = await isTokenRevoked(token);
    expect(revoked).toBe(true);

    const req = {
      headers: {
        get: (name) =>
          name.toLowerCase().startsWith("authorization")
            ? `Bearer ${token}`
            : null,
      },
      cookies: { get: () => undefined },
    };

    await expect(sessionService.whoAmI(req)).rejects.toMatchObject({
      statusCode: 401,
      code: "token_revoked",
    });
  });
});
