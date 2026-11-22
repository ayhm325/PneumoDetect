import fs from "fs";
import path from "path";
import crypto from "crypto";
import { prisma, type PrismaClientLike } from "../../db/prisma";
import type {
  AnalyzeXrayCommand,
  AnalyzeXrayResult,
  NormalizedInferenceResult,
  RawInferenceResult,
  RunInferenceInput,
} from "../../types/analysis";
import { AppError, type ErrorCode } from "../../lib/errors/appError";
import type { AnalysisResultRepository } from "../../repositories/analysis/analysisResultRepository";
import type { MedicalRecordRepository } from "../../repositories/analysis/medicalRecordRepository";
import type { NotificationRepository } from "../../repositories/analysis/notificationRepository";
import type { PatientIdentity, PatientRepository } from "../../repositories/analysis/patientRepository";

function resolveUploadsDir(): string {
  const cwd = process.cwd();
  const repoRoot = fs.existsSync(path.join(cwd, "apps")) ? cwd : path.resolve(cwd, "../..");
  return path.join(repoRoot, "public", "uploads");
}

export function getUploadSigningSecret(): string {
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
      if (result) return result;
    }
  } catch {
    // fallback to magic-byte signature detection below
  }

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

export function normalizeInferenceResult(raw: RawInferenceResult): NormalizedInferenceResult {
  const threshold = Number(process.env.MODEL_CONFIDENCE_THRESHOLD) || 0.85;
  const confidence = typeof raw.confidence === "number" ? raw.confidence : Number(raw.confidence) || 0;
  const prediction = raw.prediction ?? "Unknown";
  const needsReview =
    typeof raw.needs_review === "boolean"
      ? raw.needs_review
      : typeof raw.needsReview === "boolean"
        ? raw.needsReview
        : confidence < threshold;

  return {
    analysisId: raw.analysis_id ?? raw.analysisId ?? null,
    prediction,
    confidence,
    probabilities: raw.probabilities ?? null,
    needsReview,
    displayLabel:
      raw.display_label ??
      raw.displayLabel ??
      (needsReview ? "Needs Physician Review" : prediction),
    explanation: raw.explanation ?? "",
    heatmapUrl: raw.heatmap_url ?? raw.heatmapUrl ?? null,
    modelVersion: raw.model_version ?? raw.modelVersion ?? "unknown",
    inferenceTimeMs: raw.inference_time_ms ?? raw.inferenceTimeMs ?? 0,
    createdAt: raw.created_at ?? raw.createdAt ?? new Date().toISOString(),
    isMock: Boolean(raw.is_mock),
  };
}

export type AnalysisServiceDeps = {
  runInference: (input: RunInferenceInput) => Promise<RawInferenceResult>;
  analysisResultRepository: AnalysisResultRepository;
  patientRepository: PatientRepository;
  medicalRecordRepository: MedicalRecordRepository;
  notificationRepository: NotificationRepository;
  runInTransaction?: <T>(fn: (tx: PrismaClientLike) => Promise<T>) => Promise<T>;
};

export interface AnalysisService {
  analyzeXray(command: AnalyzeXrayCommand): Promise<AnalyzeXrayResult>;
}

export function createAnalysisService(deps: AnalysisServiceDeps): AnalysisService {
  return {
    async analyzeXray(command) {
      const maxSize = Number(process.env.MAX_UPLOAD_BYTES || 10 * 1024 * 1024);
      const { image, userId, role, patientId, modality } = command;

      if (modality) {
        const normModality = String(modality).trim().toLowerCase();
        if (normModality !== "xray" && normModality !== "chest_xray") {
          throw new AppError({
            code: "invalid_modality",
            message:
              "Only chest X-ray images (PNG, JPG, JPEG, WEBP) are supported by the current DenseNet121 model",
            statusCode: 400,
          });
        }
      }

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

      const rawName = String(image.name || "").toLowerCase();
      if (rawName.endsWith(".dcm") || String(image.type || "").toLowerCase().includes("dicom")) {
        throw new AppError({
          code: "unsupported_dicom",
          message: "DICOM (.dcm) files are not supported; please upload a chest X-ray PNG, JPG, or WEBP image",
          statusCode: 400,
        });
      }

      // Resolve & authorize target patient before running inference
      let targetPatient: PatientIdentity | null = null;
      const normalizedRole = String(role || "").trim().toLowerCase();

      if (normalizedRole === "doctor") {
        const requestedPatientId = String(patientId || "").trim();
        if (!requestedPatientId) {
          throw new AppError({
            code: "missing_patient_id",
            message: "Assigned patientId is required for doctor X-ray uploads",
            statusCode: 400,
          });
        }
        if (typeof deps.patientRepository.findById !== "function") {
          throw new AppError({
            code: "server_error",
            message: "Patient lookup by ID is unavailable",
            statusCode: 500,
          });
        }
        targetPatient = await deps.patientRepository.findById(requestedPatientId);
        if (!targetPatient) {
          throw new AppError({
            code: "not_found",
            message: "Patient not found",
            statusCode: 404,
          });
        }
        if (targetPatient.doctorId !== userId) {
          throw new AppError({
            code: "forbidden",
            message: "You are not assigned to this patient",
            statusCode: 403,
          });
        }
      } else if (normalizedRole && normalizedRole !== "patient") {
        throw new AppError({
          code: "forbidden",
          message: "Only patients and assigned doctors may submit chest X-ray analyses",
          statusCode: 403,
        });
      } else {
        targetPatient = await deps.patientRepository.findByUserId(userId);
        if (patientId && targetPatient && patientId !== targetPatient.id) {
          throw new AppError({
            code: "forbidden",
            message: "Patients may only analyze their own chest X-ray images",
            statusCode: 403,
          });
        }
      }

      const allowedExtensions = new Set([".png", ".jpg", ".jpeg", ".webp"]);

      let safeExt = "";
      let detectedMime = "";
      const detected = await detectFileType(image.buffer);
      if (detected?.ext) {
        const ext = `.${String(detected.ext).toLowerCase()}`;
        if (allowedExtensions.has(ext)) safeExt = ext;
        detectedMime = detected.mime || "";
      }

      if (!safeExt || !detectedMime || !detectedMime.startsWith("image/")) {
        throw new AppError({
          code: "invalid_file_type",
          message: "Uploaded file is not a supported chest X-ray image (PNG, JPG, JPEG, WEBP)",
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
        const errWithStatus = error as { statusCode?: number; code?: string; message?: string };
        throw new AppError({
          code: (errWithStatus?.code as ErrorCode) || "inference_error",
          message: errWithStatus?.message || "Failed to run AI inference",
          statusCode: errWithStatus?.statusCode || 502,
          cause: error,
        });
      }

      const normalized = normalizeInferenceResult(rawInference);
      const aiResult = toAiResult(normalized.prediction);

      // Never persist simulated mock results as genuine clinical records
      if (normalized.isMock) {
        await fs.promises.unlink(savedFilePath).catch(() => undefined);
        return {
          success: true,
          saved: false,
          is_mock: true,
          prediction: normalized.prediction,
          confidence: normalized.confidence,
          probabilities: normalized.probabilities,
          needs_review: normalized.needsReview,
          display_label: normalized.displayLabel,
          heatmap_url: normalized.heatmapUrl,
          model_version: normalized.modelVersion,
          inference_time_ms: normalized.inferenceTimeMs,
          data: {
            id: normalized.analysisId || `mock_${generateUUID()}`,
            prediction: normalized.prediction,
            confidence: normalized.confidence,
            probabilities: normalized.probabilities,
            needsReview: normalized.needsReview,
            displayLabel: normalized.displayLabel,
            explanation: normalized.explanation,
            heatmapUrl: normalized.heatmapUrl,
            modelVersion: normalized.modelVersion,
            inferenceTimeMs: normalized.inferenceTimeMs,
            createdAt: normalized.createdAt,
            isMock: true,
            reviewedByDoctor: false,
          },
        };
      }

      // Attribute AnalysisResult to the patient's userId when uploaded by an assigned doctor
      const ownerUserId = targetPatient?.userId || userId;
      const rawNotes = typeof command.notes === "string" ? command.notes.trim() : "";
      const uploadNotes = rawNotes ? rawNotes.slice(0, 2000) : null;
      const runTx =
        deps.runInTransaction ||
        (<T>(fn: (tx: PrismaClientLike) => Promise<T>) => prisma.$transaction(fn));

      let savedRecord: Record<string, unknown> | null = null;
      let createdMedicalRecord: Record<string, unknown> | null = null;

      try {
        const txResult = await runTx(async (tx) => {
          const persisted = await deps.analysisResultRepository.save(
            {
              userId: ownerUserId,
              patientId: targetPatient?.id ?? null,
              uploadedByUserId: userId,
              uploadedByRole: normalizedRole || null,
              uploadNotes,
              reviewStatus: normalized.needsReview ? "requires_review" : "pending_review",
              imageUrl,
              analysisData: normalized,
            },
            tx,
          );
          const saved = (persisted as Record<string, unknown>) || null;

          let medRecord: Record<string, unknown> | null = null;
          if (targetPatient?.id) {
            const med = await deps.medicalRecordRepository.create(
              {
                patientId: targetPatient.id,
                doctorId: targetPatient.doctorId,
                analysisResultId: (saved?.id as string | undefined) ?? null,
                aiResult,
                confidenceScore: clamp01(normalized.confidence),
                imageUrl,
                uploadNotes,
              },
              tx,
            );
            medRecord = (med as Record<string, unknown>) || null;
          }

          return { saved, medRecord };
        });
        savedRecord = txResult.saved;
        createdMedicalRecord = txResult.medRecord;
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

      // Best-effort notifications after mandatory DB commit
      if (targetPatient?.id) {
        await Promise.allSettled([
          deps.notificationRepository.createBestEffort({
            userId: ownerUserId,
            type: "success",
            message: {
              ar: "تمت إضافة نتيجة فحص جديدة إلى سجلك.",
              en: "A new analysis result has been added to your records.",
            },
          }),
          ...(targetPatient.doctorId
            ? [
                deps.notificationRepository.createBestEffort({
                  userId: targetPatient.doctorId,
                  type: "info",
                  message: {
                    ar: `تمت إضافة نتيجة فحص جديدة${targetPatient.fullName ? ` للمريض ${targetPatient.fullName}` : " لأحد مرضاك"}.`,
                    en: `A new analysis result was added${targetPatient.fullName ? ` for patient ${targetPatient.fullName}` : " for one of your patients"}.`,
                  },
                }),
              ]
            : []),
        ]);
      }

      const canonicalData = {
        ...(savedRecord || {}),
        patientId: targetPatient?.id ?? null,
        doctorId: targetPatient?.doctorId ?? null,
        medicalRecordId: (createdMedicalRecord?.id as string | undefined) ?? null,
        uploadNotes,
        probabilities: normalized.probabilities,
        needsReview: normalized.needsReview,
        displayLabel: normalized.displayLabel,
        reviewedByDoctor: false,
        isMock: false,
      };

      return {
        success: true,
        data: canonicalData,
        saved: true,
        prediction: normalized.prediction,
        confidence: normalized.confidence,
        probabilities: normalized.probabilities,
        needs_review: normalized.needsReview,
        display_label: normalized.displayLabel,
        heatmap_url: normalized.heatmapUrl,
        model_version: normalized.modelVersion,
        inference_time_ms: normalized.inferenceTimeMs,
        is_mock: false,
      };
    },
  };
}
