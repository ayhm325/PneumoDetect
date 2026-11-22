import { AppError } from "../../lib/errors/appError";
import type { AnalysisResultRepository } from "../../repositories/analysis/analysisResultRepository";

export interface AnalysisHistoryService {
  getHistory(userId: string, options?: { scope?: string; role?: string }): Promise<unknown[]>;
  deleteHistoryItem(userId: string, id: string): Promise<{ count: number }>;
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
        return rows.map((row) => {
          const r = row as Record<string, unknown>;
          const med = (r.medicalRecord as Record<string, unknown> | null | undefined) || null;
          const patient = (med?.patient as Record<string, unknown> | null | undefined) || null;
          return {
            ...r,
            patientName: (patient?.fullName as string | undefined) || null,
            patientEmail: (patient?.email as string | undefined) || null,
            reviewedByDoctor: Boolean(med?.reviewedByDoctor),
            doctorNotes: (med?.doctorNotes as string | null) ?? null,
          };
        });
      }

      return deps.analysisResultRepository.findHistoryByUserId(normalizedUserId);
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
