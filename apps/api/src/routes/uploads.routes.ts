import express, { Router } from "express";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { withRateLimit } from "../middleware/rateLimit.js";
import { uploadService } from "../services/uploads/index.js";
import { AppError } from "../lib/errors/appError.js";

export const uploadsRouter = Router();

uploadsRouter.post(
  "/uploads/init",
  requireAuth,
  withRateLimit("POST /api/uploads/init"),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const result = await uploadService.initUpload({
        chatId: req.body?.chatId,
        filename: req.body?.filename || req.body?.fileName,
        contentType: req.body?.contentType,
      });
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
);

uploadsRouter.post(
  "/uploads/complete",
  requireAuth,
  withRateLimit("POST /api/uploads/complete"),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const result = await uploadService.completeUpload({
        chatId: req.body?.chatId,
        key: req.body?.key,
        filename: req.body?.filename || req.body?.fileName,
        provider: req.body?.provider,
        bucket: req.body?.bucket,
        region: req.body?.region,
      });
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
);

uploadsRouter.put(
  "/uploads/local-upload",
  requireAuth,
  withRateLimit("PUT /api/uploads/local-upload"),
  express.raw({ type: "*/*", limit: "25mb" }),
  async (req, res, next) => {
    try {
      const rel = typeof req.query.path === "string" ? req.query.path : "";
      if (!rel) {
        throw new AppError({
          code: "validation_error",
          message: "missing_path",
          statusCode: 400,
        });
      }
      const data = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body || "");
      const result = await uploadService.saveLocalUpload({
        relativePath: rel,
        data: data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength),
      });
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
);
