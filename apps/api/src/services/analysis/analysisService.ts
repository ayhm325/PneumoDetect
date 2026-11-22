import fs from "fs";
import path from "path";
import crypto from "crypto";
import type {
  AnalyzeXrayCommand,
  AnalyzeXrayResult,
  NormalizedInferenceResult,
  RawInferenceResult,
  RunInferenceInput,
} from "../../types/analysis";
import { AppError } from "../../lib/errors/appError";
import type { AnalysisResultRepository } from "../../repositories/analysis/analysisResultRepository";
import type { MedicalRecordRepository } from "../../repositories/analysis/medicalRecordRepository";
import type { NotificationRepository } from "../../repositories/analysis/notificationRepository";
import type { PatientRepository } from "../../repositories/analysis/patientRepository";

function resolveUploadsDir(): string {
  const cwd = process.cwd();
  const repoRoot = fs.existsSync(path.join(cwd, "apps")) ? cwd : path.resolve(cwd, "../..");
  return path.join(repoRoot, "public", "uploads");
}

function getUploadSigningSecret(): string {
  const secret = process.env.UPLOAD_URL_SIGNING_SECRET || process.env.JWT_SECRET;
  if (secret && secret.trim().length > 0) {
    return secret;
  }
  if (process.env.NODE_ENV === "production") {
    throw new AppError({
      code: "server_error",
      message: "Missing UPLOAD_URL_SIGNING_SECRET or JWT_SECRET in production",
      statusCode: 500,
    });
  }
  return "pneumo-detect-dev-signing-secret";
}

function generateUUID() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  if (crypto && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const bytes = crypto.randomBytes(16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function toAiResult(prediction: string): "POSITIVE" | "NEGATIVE" {
  const value = String(prediction || "").trim().toUpperCase();
  if (value === "NORMAL" || value === "NEGATIVE" || value === "NO FINDING") {
    return "NEGATIVE";
  }
  if (value === "PNEUMONIA" || value === "POSITIVE") {
    return "POSITIVE";
  }
  throw new AppError({
    code: "inference_error",
    message: `Invalid or unclassified model prediction: ${prediction}`,
    statusCode: 502,
  });
}

function clamp01(input: number) {
  const num = Number(input);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, Math.min(1, num));
}

async function detectFileType(buffer: Buffer): Promise<{ ext?: string; mime?: string } | null> {
  try {
    const fileTypeModule = await import("file-type");
    const fn = fileTypeModule?.fileTypeFromBuffer;
    if (typeof fn === "function") {
      const result = await fn(buffer);
      return result ?? null;
    }
  } catch {
  }

  // Fast signature fallback for standard medical images in test/edge runtimes
  if (buffer.length >= 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return { ext: "png", mime: "image/png" };
  }
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { ext: "jpg", mime: "image/jpeg" };
  }
  if (buffer.length >= 12 && buffer.subarray(0, 4).toString() === "RIFF" && buffer.subarray(8, 12).toString() === "WEBP") {
    return { ext: "webp", mime: "image/webp" };
  }
  return null;
}

function normalizeInferenceResult(raw: RawInferenceResult): NormalizedInferenceResult {
  return {
    analysisId: raw.analysis_id ?? raw.analysisId ?? null,
    prediction: raw.prediction ?? "Unknown",
    confidence: typeof raw.confidence === "number" ? raw.confidence : Number(raw.confidence) || 0,
    explanation: raw.explanation ?? "",
    heatmapUrl: raw.heatmap_url ?? raw.heatmapUrl ?? null,
    modelVersion: raw.model_version ?? raw.modelVersion ?? "unknown",
    inferenceTimeMs: raw.inference_time_ms ?? raw.inferenceTimeMs ?? 0,
    createdAt: raw.created_at ?? raw.createdAt ?? new Date().toISOString(),
  };
}

export type AnalysisServiceDeps = {
  runInference: (input: RunInferenceInput) => Promise<RawInferenceResult>;
  analysisResultRepository: AnalysisResultRepository;
  patientRepository: PatientRepository;
  medicalRecordRepository: MedicalRecordRepository;
  notificationRepository: NotificationRepository;
};

export interface AnalysisService {
  analyzeXray(command: AnalyzeXrayCommand): Promise<AnalyzeXrayResult>;
}

export function createAnalysisService(deps: AnalysisServiceDeps): AnalysisService {
  return {
    async analyzeXray(command) {
      const maxSize = Number(process.env.MAX_UPLOAD_BYTES || 10 * 1024 * 1024);
      const { image, userId } = command;

      if (!image?.buffer || image.buffer.length === 0) {
        throw new AppError({
          code: "missing_file",
          message: "Image file is required",
          statusCode: 400,
        });
      }

      if (image.buffer.length > maxSize) {
        throw new AppError({
          code: "file_too_large",
          message: `File exceeds maximum size of ${Math.round(maxSize / 1024 / 1024)}MB`,
          statusCode: 413,
        });
      }

      const allowedExtensions = new Set([
        ".png",
        ".jpg",
        ".jpeg",
        ".gif",
        ".bmp",
        ".webp",
        ".tif",
        ".tiff",
      ]);

      let safeExt = "";
      let detectedMime = "";
      const detected = await detectFileType(image.buffer);
      if (detected?.ext) {
        const ext = `.${String(detected.ext).toLowerCase()}`;
        if (allowedExtensions.has(ext)) safeExt = ext;
        detectedMime = detected.mime || "";
      }

      // Do NOT trust client-supplied extensions or MIME types if content validation fails or is unsupported
      if (!safeExt || !detectedMime || !detectedMime.startsWith("image/")) {
        throw new AppError({
          code: "invalid_file_type",
          message: "Uploaded file is not a supported image type or file content is invalid",
          statusCode: 400,
        });
      }

      const uploadsDir = resolveUploadsDir();
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

      const signingSecret = getUploadSigningSecret();

      const safeFileName = path.basename(`${generateUUID()}${safeExt}`);
      const savedFilePath = path.join(uploadsDir, safeFileName);
      
      try {
        await fs.promises.writeFile(savedFilePath, image.buffer);
      } catch (storageErr) {
        console.error("Failed to write uploaded image to disk", storageErr);
        throw new AppError({
          code: "server_error",
          message: "failed_to_save_image",
          statusCode: 500,
          cause: storageErr,
        });
      }

      const expires = Date.now() + (Number(process.env.UPLOAD_URL_EXP_MS) || 24 * 60 * 60 * 1000);
      const sig = crypto.createHmac("sha256", signingSecret).update(`${safeFileName}:${expires}`).digest("hex");
      const imageUrl = `/uploads/${encodeURIComponent(safeFileName)}?exp=${expires}&sig=${sig}`;

      const inferenceInput: RunInferenceInput = {
        buffer: image.buffer,
        mimetype: detectedMime || image.type || "application/octet-stream",
        originalname: image.name || "upload",
        size: image.buffer.length,
        with_heatmap: image.withHeatmap === true,
      };

      let rawInference: RawInferenceResult;
      try {
        rawInference = await deps.runInference(inferenceInput);
      } catch (error) {
        await fs.promises.unlink(savedFilePath).catch(() => undefined);
        throw new AppError({
          code: "inference_error",
          message: "Failed to run AI inference",
          statusCode: 502,
          cause: error,
        });
      }

      const normalized = normalizeInferenceResult(rawInference);
      const aiResult = toAiResult(normalized.prediction);

      let saved: unknown = null;
      try {
        saved = await deps.analysisResultRepository.save({
          userId,
          imageUrl,
          analysisData: normalized,
        });

        const patient = await deps.patientRepository.findByUserId(userId);
        if (patient?.id) {
          await deps.medicalRecordRepository.create({
            patientId: patient.id,
            doctorId: patient.doctorId,
            aiResult,
            confidenceScore: clamp01(normalized.confidence),
            imageUrl,
          });

          await deps.notificationRepository.createBestEffort({
            userId,
            type: "success",
            message: {
              ar: "تمت إضافة نتيجة فحص جديدة إلى سجلك.",
              en: "A new analysis result has been added to your records.",
            },
          });

          if (patient.doctorId) {
            await deps.notificationRepository.createBestEffort({
              userId: patient.doctorId,
              type: "info",
              message: {
                ar: `تمت إضافة نتيجة فحص جديدة${patient.fullName ? ` للمريض ${patient.fullName}` : " لأحد مرضاك"}.`,
                en: `A new analysis result was added${patient.fullName ? ` for patient ${patient.fullName}` : " for one of your patients"}.`,
              },
            });
          }
        }
      } catch (error) {
        await fs.promises.unlink(savedFilePath).catch(() => undefined);
        console.error("analysisService: mandatory persistence failed", error);
        throw new AppError({
          code: "server_error",
          message: "Failed to persist analysis record",
          statusCode: 500,
          cause: error,
        });
      }

      const response: AnalyzeXrayResult = {
        success: true,
        data: saved,
        saved: true,
      };

      return response;
    },
  };
}
