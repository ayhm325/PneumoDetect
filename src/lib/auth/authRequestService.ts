import jwt from "jsonwebtoken";
import { isTokenRevoked } from "../../../lib/auth/revocation.server.js";
import { getJwtSecret } from "../../../lib/auth/jwtSecret.js";
import { AppError } from "../errors/appError";

export type AuthPayload = {
  id: string;
  email?: string;
  role?: string;
  isActive?: boolean;
};

export function extractBearerToken(request: Request): string | null {
  const cookieToken = (request as Request & { cookies?: { get(name: string): { value?: string } | undefined } })
    .cookies
    ?.get("token")
    ?.value;
  if (cookieToken) return cookieToken;

  const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  return authHeader.slice(7).trim();
}

export async function authenticateToken(token: string): Promise<{ token: string; user: AuthPayload }> {
  if (!token) {
    throw new AppError({
      code: "unauthenticated",
      message: "Authentication required",
      statusCode: 401,
    });
  }

  try {
    const revoked = await isTokenRevoked(token);
    if (revoked) {
      throw new AppError({
        code: "token_revoked",
        message: "Token is revoked",
        statusCode: 401,
      });
    }
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.warn("authRequestService: revocation check failed", error);
  }

  try {
    const payload = jwt.verify(token, getJwtSecret()) as jwt.JwtPayload;
    const userId = payload.id as string | undefined;
    if (!userId) {
      throw new AppError({
        code: "invalid_token_payload",
        message: "Token payload is invalid",
        statusCode: 401,
      });
    }

    return {
      token,
      user: {
        id: userId,
        email: typeof payload.email === "string" ? payload.email : undefined,
        role: typeof payload.role === "string" ? payload.role : undefined,
        isActive: typeof payload.isActive === "boolean" ? payload.isActive : undefined,
      },
    };
  } catch (error) {
    if (error instanceof AppError) throw error;

    throw new AppError({
      code: "invalid_token",
      message: "Invalid token",
      statusCode: 401,
      cause: error,
    });
  }
}

export async function authenticateRequest(request: Request): Promise<{ token: string; user: AuthPayload }> {
  const token = extractBearerToken(request);
  return authenticateToken(token || "");
}
