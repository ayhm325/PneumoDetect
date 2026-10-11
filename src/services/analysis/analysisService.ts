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

function toAiResult(prediction: string) {
  const value = String(prediction || "").toLowerCase();
  if (value.includes("normal") || value.includes("negative") || value.includes("no finding")) {
    return "NEGATIVE" as const;
  }
  return "POSITIVE" as const;
}

function clamp01(input: number) {
  const num = Number(input);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, Math.min(1, num));
}

async function detectFileType(buffer: Buffer): Promise<{ ext?: string; mime?: string } | null> {
  try {
    const fileTypeModule = await import("file-type");
    if (fileTypeModule && typeof fileTypeModule.fileTypeFromBuffer === "function") {
      const result = await fileTypeModule.fileTypeFromBuffer(buffer);
      return result ?? null;
    }
    return null;
  } catch {
    return null;
  }
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

      if (!safeExt) {
        const sourceName = image.name || "upload";
        const rawExt = path.extname(sourceName) || "";
        const ext = String(rawExt).toLowerCase();
        if (allowedExtensions.has(ext)) {
          safeExt = ext;
        } else if (image.type && String(image.type).startsWith("image/")) {
          const imageType = String(image.type).toLowerCase();
          if (imageType.includes("jpeg") || imageType.includes("jpg")) safeExt = ".jpg";
          else if (imageType.includes("png")) safeExt = ".png";
          else if (imageType.includes("webp")) safeExt = ".webp";
          else if (imageType.includes("gif")) safeExt = ".gif";
          else if (imageType.includes("bmp") || imageType.includes("bitmap")) safeExt = ".bmp";
          else if (imageType.includes("tiff") || imageType.includes("tif")) safeExt = ".tiff";
          detectedMime = image.type;
        }
      }

      if (!safeExt || (!detectedMime && !image.type)) {
        throw new AppError({
          code: "invalid_file_type",
          message: "Uploaded file is not a supported image type",
          statusCode: 400,
        });
      }

      if (detectedMime && !String(detectedMime).startsWith("image/")) {
        throw new AppError({
          code: "invalid_file_type",
          message: "Detected file type is not an image",
          statusCode: 400,
        });
      }

      const uploadsDir = path.join(process.cwd(), "public", "uploads");
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

      const shouldUseSignedUrls = process.env.ENABLE_SIGNED_URLS === "1";
      const signingSecret = shouldUseSignedUrls
        ? process.env.UPLOAD_URL_SIGNING_SECRET || process.env.JWT_SECRET || ""
        : "";
      if (shouldUseSignedUrls && !signingSecret) {
        throw new AppError({
          code: "server_error",
          message: "missing_upload_signing_secret",
          statusCode: 500,
        });
      }

      const safeFileName = path.basename(`${generateUUID()}${safeExt}`);
      const savedFilePath = path.join(uploadsDir, safeFileName);
      await fs.promises.writeFile(savedFilePath, image.buffer);

      let imageUrl = `/uploads/${encodeURIComponent(safeFileName)}`;
      if (shouldUseSignedUrls) {
        const expires = Date.now() + (Number(process.env.UPLOAD_URL_EXP_MS) || 5 * 60 * 1000);
        const sig = crypto.createHmac("sha256", signingSecret).update(`${safeFileName}:${expires}`).digest("hex");
        imageUrl = `/uploads/${encodeURIComponent(safeFileName)}?exp=${expires}&sig=${sig}`;
      }

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

      let saved: unknown = null;
      let saveError: string | undefined;
      try {
        saved = await deps.analysisResultRepository.save({
          userId,
          imageUrl,
          analysisData: normalized,
        });
      } catch (error) {
        saveError = error instanceof Error ? error.message : String(error);
        console.warn("analysisService: failed to save analysis result", saveError);
      }

      try {
        const patient = await deps.patientRepository.findByUserId(userId);
        if (patient?.id) {
          await deps.medicalRecordRepository.create({
            patientId: patient.id,
            doctorId: patient.doctorId,
            aiResult: toAiResult(normalized.prediction),
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
        console.warn("analysisService: failed to create medical record or notifications", error);
      }

      const response: AnalyzeXrayResult = {
        success: true,
        data: saved ?? normalized,
        saved: Boolean(saved),
      };

      if (!saved && saveError && process.env.NODE_ENV !== "production") {
        response.saveError = saveError;
      }

      return response;
    },
  };
}
