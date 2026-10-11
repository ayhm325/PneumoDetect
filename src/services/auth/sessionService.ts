import jwt from "jsonwebtoken";
import { AppError } from "../../lib/errors/appError";
import { authenticateRequest, extractBearerToken } from "../../lib/auth/authRequestService";
import type { LogoutResult, WhoAmIResult } from "../../types/auth";
import type { AuthSessionRepository } from "../../repositories/auth/sessionRepository";

type SessionServiceDeps = {
  sessionRepository: AuthSessionRepository;
};

export interface SessionService {
  whoAmI(request: Request): Promise<WhoAmIResult>;
  logout(request: Request): Promise<LogoutResult>;
  isRevoked(token: string | null): Promise<boolean>;
}

export function createSessionService(deps: SessionServiceDeps): SessionService {
  return {
    async whoAmI(request) {
      const auth = await authenticateRequest(request);
      return {
        id: auth.user.id,
        role: auth.user.role,
        email: auth.user.email,
      };
    },

    async logout(request) {
      let token = extractBearerToken(request);

      if (!token) {
        const contentType = request.headers.get("content-type") || "";
        if (contentType.toLowerCase().includes("application/json")) {
          let body: unknown;
          try {
            body = await request.json();
          } catch {
            throw new AppError({
              code: "validation_error",
              message: "invalid_json",
              statusCode: 400,
            });
          }

          token =
            body && typeof body === "object" && "token" in body
              ? String((body as { token?: unknown }).token || "").trim()
              : null;
        }
      }

      if (!token) {
        throw new AppError({
          code: "validation_error",
          message: "no_token_provided",
          statusCode: 400,
        });
      }

      let expMs: number | null = null;
      try {
        const decoded = jwt.decode(token) as jwt.JwtPayload | null;
        if (decoded?.exp) {
          expMs = decoded.exp * 1000;
        }
      } catch {
        expMs = null;
      }

      try {
        await deps.sessionRepository.revoke(token, expMs);
      } catch (error) {
        console.error("sessionService.logout revoke failed", error);
      }

      return { ok: true };
    },

    async isRevoked(token) {
      if (!token) return false;
      return deps.sessionRepository.isRevoked(token);
    },
  };
}
