import { AppError } from "../../lib/errors/appError";
import type { AnalysisResultRepository } from "../../repositories/analysis/analysisResultRepository";
import {
  computeCanonicalReviewStatus,
  normalizeUploadStorageReference,
} from "./analysisBackfillService";
import { buildSignedUploadAccessUrl } from "./analysisService";

export interface AnalysisHistoryService {
  getHistory(userId: string, options?: { scope?: string; role?: string }): Promise<unknown[]>;
  deleteHistoryItem(userId: string, id: string): Promise<{ count: number }>;
}

function enrichHistoryRow(row: unknown): Record<string, unknown> {
  const r = (row && typeof row === "object" ? row : {}) as Record<string, unknown>;
  const med = (r.medicalRecord as Record<string, unknown> | null | undefined) || null;
  const patient = (med?.patient as Record<string, unknown> | null | undefined) || null;
  const rawImg = typeof r.imageUrl === "string" ? r.imageUrl : null;
  const storageImageUrl = rawImg ? normalizeUploadStorageReference(rawImg) : null;
  const signedImageUrl = rawImg ? buildSignedUploadAccessUrl(rawImg) : null;
  const reviewedByDoctor = Boolean(
    med ? med.reviewedByDoctor : r.reviewStatus === "reviewed",
  );
  const needsReview = Boolean(r.needsReview);
  const reviewStatus = computeCanonicalReviewStatus({
    reviewedByDoctor,
    needsReview,
  });

  return {
    ...r,
    imageUrl: signedImageUrl,
    storageImageUrl,
    medicalRecordId: (med?.id as string | undefined) || null,
    patientName: (patient?.fullName as string | undefined) || null,
    patientEmail: (patient?.email as string | undefined) || null,
    reviewedByDoctor,
    reviewStatus,
    status: reviewStatus,
    doctorNotes: (med?.doctorNotes as string | null) ?? null,
  };
}

export function createAnalysisHistoryService(deps: {
  analysisResultRepository: AnalysisResultRepository;
}): AnalysisHistoryService {
  return {
    async getHistory(userId, options) {
      const normalizedUserId = String(userId || "").trim();
      if (!normalizedUserId) {
        throw new AppError({
          code: "invalid_token_payload",
          message: "Missing user identifier",
          statusCode: 401,
        });
      }

      const scope = String(options?.scope || "").trim().toLowerCase();
      const role = String(options?.role || "").trim().toLowerCase();

      if (scope === "doctor" || (role === "doctor" && scope !== "self")) {
        const rows = await deps.analysisResultRepository.findHistoryByUploadedUserId(normalizedUserId);
        return rows.map(enrichHistoryRow);
      }

      const rows = await deps.analysisResultRepository.findHistoryByUserId(normalizedUserId);
      return rows.map(enrichHistoryRow);
    },

    async deleteHistoryItem(userId, id) {
      const normalizedId = String(id || "").trim();
      if (!normalizedId) {
        throw new AppError({
          code: "missing_id",
          message: "Analysis result id is required",
          statusCode: 400,
        });
      }

      const normalizedUserId = String(userId || "").trim();
      if (!normalizedUserId) {
        throw new AppError({
          code: "invalid_token_payload",
          message: "Missing user identifier",
          statusCode: 401,
        });
      }

      return deps.analysisResultRepository.deleteByUserAndId(normalizedUserId, normalizedId);
    },
  };
}
