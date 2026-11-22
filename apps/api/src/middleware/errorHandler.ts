import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { isAppError } from "../lib/errors/appError.js";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (isAppError(err)) {
    res.setHeader("Cache-Control", "no-store");
    return res.status(err.statusCode).json({
      error: err.code || "error",
      message: err.message,
    });
  }

  if (err instanceof ZodError) {
    res.setHeader("Cache-Control", "no-store");
    return res.status(400).json({
      error: "validation_error",
      message: "Invalid request payload",
      details: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    });
  }

  console.error("[API ERROR]", err);
  res.setHeader("Cache-Control", "no-store");
  return res.status(500).json({
    error: "server_error",
    message: "Internal server error",
  });
}
