import type { NextFunction, Request, Response } from "express";
import { authenticateRequest, type AuthPayload } from "../lib/auth/authRequestService.js";
import { toServiceRequest } from "../lib/http/expressAdapter.js";
import { AppError } from "../lib/errors/appError.js";

export interface AuthenticatedRequest extends Request {
  auth?: {
    token: string;
    user: AuthPayload;
  };
}

export async function requireAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
) {
  try {
    const auth = await authenticateRequest(toServiceRequest(req));
    req.auth = auth;
    next();
  } catch (error) {
    next(error);
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    const userRole = req.auth?.user?.role;
    if (!userRole || !roles.includes(userRole)) {
      return next(
        new AppError({
          code: "forbidden",
          message: "Insufficient permissions",
          statusCode: 403,
        }),
      );
    }
    next();
  };
}
