import { AppError } from "../../lib/errors/appError";
import { env } from "../../config/env.js";
import { runInference } from "../../ai/inference/inference.service.js";
import { normalizeInferenceResult } from "../analysis/analysisService.js";
import type { RawInferenceResult } from "../../types/analysis";

export interface PredictService {
  forwardPrediction(input: { payload: unknown }): Promise<{ status: number; body: unknown }>;
}

function decodeImageBase64(raw: string): { buffer: Buffer; mimetype: string; originalname: string } {
  const trimmed = raw.trim();
  let mimetype = "image/png";
  let ext = "png";
  let base64Part = trimmed;

  const dataUriMatch = /^data:(image\/(?:png|jpe?g|webp));base64,(.+)$/i.exec(trimmed);
  if (dataUriMatch) {
    mimetype = dataUriMatch[1].toLowerCase();
    ext = mimetype === "image/jpeg" || mimetype === "image/jpg" ? "jpg" : mimetype === "image/webp" ? "webp" : "png";
    base64Part = dataUriMatch[2];
  }

  const buffer = Buffer.from(base64Part, "base64");
  if (!buffer || buffer.length === 0) {
    throw new AppError({
      code: "validation_error",
      message: "image_base64 decoded to empty payload",
      statusCode: 400,
    });
  }
  if (buffer.length > env.maxUploadBytes) {
    throw new AppError({
      code: "file_too_large",
      message: `Image exceeds maximum size of ${Math.round(env.maxUploadBytes / 1024 / 1024)}MB`,
      statusCode: 413,
    });
  }

  return {
    buffer,
    mimetype,
    originalname: `predict.${ext}`,
  };
}

export function createPredictService(): PredictService {
  return {
    async forwardPrediction(input) {
      const payload = (input.payload && typeof input.payload === "object"
        ? input.payload
        : {}) as Record<string, unknown>;

      const rawBase64 = typeof payload.image_base64 === "string" ? payload.image_base64 : "";
      if (!rawBase64.trim()) {
        throw new AppError({
          code: "validation_error",
          message: "image_base64 is required",
          statusCode: 400,
        });
      }

      const decoded = decodeImageBase64(rawBase64);
      const rawResult = (await runInference({
        buffer: decoded.buffer,
        mimetype: decoded.mimetype,
        originalname: decoded.originalname,
        size: decoded.buffer.length,
        with_heatmap: Boolean(payload.with_heatmap),
      })) as RawInferenceResult;

      const normalized = normalizeInferenceResult(rawResult);
      return {
        status: 200,
        body: {
          ...rawResult,
          prediction: normalized.prediction,
          confidence: normalized.confidence,
          probabilities: normalized.probabilities,
          needs_review: normalized.needsReview,
          display_label: normalized.displayLabel,
          heatmap_url: normalized.heatmapUrl,
          model_version: normalized.modelVersion,
          inference_time_ms: normalized.inferenceTimeMs,
          is_mock: normalized.isMock,
        },
      };
    },
  };
}
