import { AppError } from "../../lib/errors/appError";
import { env } from "../../config/env.js";
import { runInference } from "../../ai/inference/inference.service.js";
import {
  detectFileType,
  normalizeInferenceResult,
  toAiResult,
} from "../analysis/analysisService.js";
import type { RawInferenceResult } from "../../types/analysis";

export interface PredictService {
  forwardPrediction(input: { payload: unknown }): Promise<{ status: number; body: unknown }>;
}

const ALLOWED_IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp"]);

async function decodeAndValidateBase64Image(
  raw: string,
): Promise<{ buffer: Buffer; mimetype: string; originalname: string }> {
  const trimmed = raw.trim();
  let base64Part = trimmed;

  // Reject explicit DICOM data URIs early
  if (/^data:[^;]*dicom[^;]*;base64,/i.test(trimmed)) {
    throw new AppError({
      code: "unsupported_dicom",
      message: "DICOM (.dcm) files are not supported; please upload a chest X-ray PNG, JPG, or WEBP image",
      statusCode: 400,
    });
  }

  const dataUriMatch = /^data:([^;]+);base64,(.+)$/i.exec(trimmed);
  if (dataUriMatch) {
    base64Part = dataUriMatch[2].trim();
  }

  // Strip whitespace inside base64 payload
  const compact = base64Part.replace(/\s+/g, "");
  if (!compact) {
    throw new AppError({
      code: "validation_error",
      message: "image_base64 is empty",
      statusCode: 400,
    });
  }

  // Pre-decode size check to prevent memory exhaustion on huge payloads
  const maxBase64Chars = Math.ceil((env.maxUploadBytes * 4) / 3) + 1024;
  if (compact.length > maxBase64Chars) {
    throw new AppError({
      code: "file_too_large",
      message: `Image exceeds maximum size of ${Math.round(env.maxUploadBytes / 1024 / 1024)}MB`,
      statusCode: 413,
    });
  }

  // Strict RFC 4648 base64 format check (must be multiple of 4 and contain only base64 chars)
  if (compact.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(compact)) {
    throw new AppError({
      code: "validation_error",
      message: "Invalid base64 encoding in image_base64",
      statusCode: 400,
    });
  }

  const buffer = Buffer.from(compact, "base64");
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

  // Verify actual file type from magic bytes (never trust client-supplied MIME)
  const detected = await detectFileType(buffer);
  if (detected?.ext === "dcm" || detected?.mime === "application/dicom") {
    throw new AppError({
      code: "unsupported_dicom",
      message: "DICOM (.dcm) files are not supported; please upload a chest X-ray PNG, JPG, or WEBP image",
      statusCode: 400,
    });
  }

  const detectedExt = String(detected?.ext || "").toLowerCase();
  const detectedMime = String(detected?.mime || "").toLowerCase();
  if (!detectedExt || !ALLOWED_IMAGE_EXTENSIONS.has(detectedExt) || !detectedMime.startsWith("image/")) {
    throw new AppError({
      code: "invalid_file_type",
      message: "Decoded payload is not a supported chest X-ray image (PNG, JPG, JPEG, WEBP)",
      statusCode: 400,
    });
  }

  return {
    buffer,
    mimetype: detectedMime,
    originalname: `predict.${detectedExt}`,
  };
}

export function createPredictService(): PredictService {
  return {
    async forwardPrediction(input) {
      const payload = (input.payload && typeof input.payload === "object"
        ? input.payload
        : {}) as Record<string, unknown>;

      if (typeof payload.image_base64 !== "string" || !payload.image_base64.trim()) {
        throw new AppError({
          code: "validation_error",
          message: "image_base64 is required",
          statusCode: 400,
        });
      }

      const decoded = await decodeAndValidateBase64Image(payload.image_base64);
      const rawResult = (await runInference({
        buffer: decoded.buffer,
        mimetype: decoded.mimetype,
        originalname: decoded.originalname,
        size: decoded.buffer.length,
        with_heatmap: Boolean(payload.with_heatmap),
      })) as RawInferenceResult;

      const normalized = normalizeInferenceResult(rawResult);
      // Enforce canonical classification contract (NORMAL/PNEUMONIA only)
      toAiResult(normalized.prediction);

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
          saved: false,
        },
      };
    },
  };
}
