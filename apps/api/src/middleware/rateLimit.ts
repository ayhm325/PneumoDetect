import type { NextFunction, Response } from "express";
import { rateLimit } from "../legacy-lib/security/rateLimiter.js";
import { logAudit } from "../legacy-lib/security/auditLogger.js";
import { toServiceRequest } from "../lib/http/expressAdapter.js";
import type { AuthenticatedRequest } from "./auth.js";

export function withRateLimit(endpointLabel: string) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const rl = await rateLimit(toServiceRequest(req));
      if (rl.limited) {
        logAudit({
          event: "rate_limit_exceeded",
          userId: req.auth?.user?.id,
          ip: req.ip || (req.headers["x-forwarded-for"] as string) || undefined,
          details: { endpoint: endpointLabel },
        });
        return res.status(429).json({ error: "Rate limit exceeded" });
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}
