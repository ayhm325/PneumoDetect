import { AppError } from "../../lib/errors/appError";
import type { AnalysisResultRepository } from "../../repositories/analysis/analysisResultRepository";

export interface AnalysisHistoryService {
  getHistory(userId: string): Promise<unknown[]>;
  deleteHistoryItem(userId: string, id: string): Promise<{ count: number }>;
}

export function createAnalysisHistoryService(deps: {
  analysisResultRepository: AnalysisResultRepository;
}): AnalysisHistoryService {
  return {
    async getHistory(userId) {
      const normalizedUserId = String(userId || "").trim();
      if (!normalizedUserId) {
        throw new AppError({
          code: "invalid_token_payload",
          message: "Missing user identifier",
          statusCode: 401,
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
