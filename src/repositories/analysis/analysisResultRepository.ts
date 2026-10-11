import { prisma, type PrismaClientLike } from "../../db/prisma";
import type { SaveAnalysisInput } from "../../types/analysis";
import { AppError } from "../../lib/errors/appError";

export interface AnalysisResultRepository {
  save(input: SaveAnalysisInput): Promise<unknown>;
  findHistoryByUserId(userId: string): Promise<unknown[]>;
  deleteByUserAndId(userId: string, id: string): Promise<{ count: number }>;
}

export function createAnalysisResultRepository(
  db: PrismaClientLike = prisma,
): AnalysisResultRepository {
  return {
    async save(input) {
      try {
        return await db.analysisResult.create({
          data: {
            userId: input.userId,
            imageUrl: input.imageUrl,
            prediction: input.analysisData.prediction,
            confidence: input.analysisData.confidence,
            explanation: input.analysisData.explanation,
            heatmapUrl: input.analysisData.heatmapUrl,
            modelVersion: input.analysisData.modelVersion,
            inferenceTimeMs: input.analysisData.inferenceTimeMs,
          },
        });
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to save analysis result",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async findHistoryByUserId(userId) {
      try {
        return await db.analysisResult.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
        });
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to load analysis history",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async deleteByUserAndId(userId, id) {
      try {
        const result = await db.analysisResult.deleteMany({
          where: { userId, id },
        });
        return { count: result.count };
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to delete analysis result",
          statusCode: 500,
          cause: error,
        });
      }
    },
  };
}
