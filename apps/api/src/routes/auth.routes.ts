import { Router } from "express";
import { authService, sessionService } from "../services/auth/index.js";
import { extractBearerToken } from "../lib/auth/authRequestService.js";
import { toServiceRequest } from "../lib/http/expressAdapter.js";
import { sendJsonNoStore } from "../lib/http/jsonResponse.js";
import { env } from "../config/env.js";

export const authRouter = Router();

authRouter.post("/login", async (req, res, next) => {
  try {
    const contentType = String(req.headers["content-type"] || "");
    if (!contentType.toLowerCase().includes("application/json")) {
      return sendJsonNoStore(res, { error: "invalid_content_type" }, 400);
    }

    const ip =
      (req.headers["x-forwarded-for"] as string) ||
      req.ip ||
      (req.headers.host as string) ||
      null;

    const result = await authService.login({
      email: req.body?.email,
      password: req.body?.password,
      ip,
    });

    const responseBody: Record<string, unknown> = { user: result.user };
    if (result.tokenForDev) responseBody.tokenForDev = result.tokenForDev;

    res.cookie("token", result.token, {
      httpOnly: true,
      secure: env.isProd,
      sameSite: env.isProd ? "none" : "lax",
      path: "/",
      maxAge: 1000 * 60 * 60 * 2,
    });

    return sendJsonNoStore(res, responseBody, 200);
  } catch (error) {
    next(error);
  }
});

authRouter.post("/auth/logout", async (req, res, next) => {
  try {
    const result = await sessionService.logout(toServiceRequest(req));
    res.cookie("token", "", {
      httpOnly: true,
      path: "/",
      maxAge: 0,
      sameSite: env.isProd ? "none" : "lax",
      secure: env.isProd,
    });
    return sendJsonNoStore(res, result, 200);
  } catch (error) {
    next(error);
  }
});

authRouter.get("/auth/whoami", async (req, res, next) => {
  try {
    const result = await sessionService.whoAmI(toServiceRequest(req));
    return sendJsonNoStore(res, result, 200);
  } catch (error) {
    next(error);
  }
});

authRouter.get("/auth/token", (req, res) => {
  const token = (req.cookies?.token as string | undefined)?.trim();
  if (token) {
    return sendJsonNoStore(res, { token }, 200);
  }
  return sendJsonNoStore(res, { error: "Token not found" }, 404);
});

authRouter.post("/auth/is-revoked", async (req, res) => {
  try {
    let token = extractBearerToken(toServiceRequest(req));
    if (!token && req.body && typeof req.body.token === "string") {
      token = req.body.token.trim();
    }
    const revoked = await sessionService.isRevoked(token || null);
    return sendJsonNoStore(res, { revoked: Boolean(revoked) }, 200);
  } catch (error) {
    console.error("/api/auth/is-revoked error", error);
    return sendJsonNoStore(res, { revoked: false }, 500);
  }
});
