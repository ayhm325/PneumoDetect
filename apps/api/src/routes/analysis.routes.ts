import { Router } from "express";
import fs from "fs/promises";
import formidable from "formidable";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { withRateLimit } from "../middleware/rateLimit.js";
import { analysisService, analysisHistoryService } from "../services/analysis/index.js";
import { predictService } from "../services/predict/index.js";
import { AppError } from "../lib/errors/appError.js";
import { sendJsonNoStore } from "../lib/http/jsonResponse.js";
import { env } from "../config/env.js";

export const analysisRouter = Router();

function parseWithHeatmap(raw: unknown): boolean {
  if (raw === null || raw === undefined) return false;
  const val = Array.isArray(raw) ? raw[0] : raw;
  const normalized = String(val).trim().toLowerCase();
  return normalized === "true" || normalized === "on" || normalized === "1" || normalized === "yes";
}

analysisRouter.post(
  "/predict",
  requireAuth,
  withRateLimit("POST /api/predict"),
  async (req, res, next) => {
  try {
    const contentType = String(req.headers["content-type"] || "");
    if (!contentType.toLowerCase().includes("application/json")) {
      return sendJsonNoStore(res, { error: "invalid_content_type" }, 400);
    }
    const result = await predictService.forwardPrediction({ payload: req.body });
    return sendJsonNoStore(res, result.body, result.status);
  } catch (error) {
    next(error);
  }
});

analysisRouter.post(
  "/analysis/analyze",
  requireAuth,
  withRateLimit("POST /api/analysis/analyze"),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const contentType = String(req.headers["content-type"] || "");
      if (!contentType.toLowerCase().includes("multipart/form-data")) {
        throw new AppError({
          code: "validation_error",
          message: "Request must be multipart/form-data",
          statusCode: 400,
        });
      }

      const form = formidable({
        maxFileSize: env.maxUploadBytes,
        allowEmptyFiles: false,
      });

      const [fields, files] = await form.parse(req);
      const uploaded = files.image?.[0];
      if (!uploaded) {
        throw new AppError({
          code: "missing_file",
          message: "Image file is required",
          statusCode: 400,
        });
      }

      let buffer: Buffer;
      try {
        buffer = await fs.readFile(uploaded.filepath);
      } finally {
        await fs.unlink(uploaded.filepath).catch(() => {});
      }

      const patientIdField = Array.isArray(fields.patientId) ? fields.patientId[0] : fields.patientId;
      const modalityField = Array.isArray(fields.modality) ? fields.modality[0] : fields.modality;
      const notesField = Array.isArray(fields.notes) ? fields.notes[0] : fields.notes;

      const result = await analysisService.analyzeXray({
        userId: req.auth!.user.id,
        role: req.auth!.user.role,
        patientId: typeof patientIdField === "string" ? patientIdField.trim() : undefined,
        modality: typeof modalityField === "string" ? modalityField.trim() : undefined,
        notes: typeof notesField === "string" ? notesField.trim() : undefined,
        image: {
          name: uploaded.originalFilename || "upload",
          type: uploaded.mimetype || "application/octet-stream",
          buffer,
          withHeatmap: parseWithHeatmap(fields.with_heatmap),
        },
      });

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
);

analysisRouter.get(
  "/analysis/history",
  requireAuth,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const scope = typeof req.query.scope === "string" ? req.query.scope : undefined;
      const records = await analysisHistoryService.getHistory(req.auth!.user.id, {
        scope,
        role: req.auth!.user.role,
      });
      return res.status(200).json({ success: true, data: records });
    } catch (error) {
      next(error);
    }
  },
);

analysisRouter.delete(
  "/analysis/history",
  requireAuth,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const queryId = typeof req.query.id === "string" ? req.query.id.trim() : "";
      const bodyId = typeof req.body?.id === "string" ? req.body.id.trim() : "";
      const id = queryId || bodyId;

      const result = await analysisHistoryService.deleteHistoryItem(req.auth!.user.id, id);
      return res.status(200).json({ success: true, deletedCount: result.count });
    } catch (error) {
      next(error);
    }
  },
);
