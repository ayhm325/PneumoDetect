import { Prisma } from "@prisma/client";
import { prisma, type PrismaClientLike } from "../../db/prisma";
import type { SaveAnalysisInput } from "../../types/analysis";
import { AppError } from "../../lib/errors/appError";

export interface AnalysisResultRepository {
  save(input: SaveAnalysisInput, tx?: PrismaClientLike): Promise<unknown>;
  findHistoryByUserId(userId: string): Promise<unknown[]>;
  findHistoryByUploadedUserId(uploadedByUserId: string): Promise<unknown[]>;
  deleteByUserAndId(userId: string, id: string): Promise<{ count: number }>;
}

export function createAnalysisResultRepository(
  db: PrismaClientLike = prisma,
): AnalysisResultRepository {
  return {
    async save(input, tx) {
      const client = tx || db;
      try {
        return await client.analysisResult.create({
          data: {
            userId: input.userId,
            patientId: input.patientId ?? null,
            uploadedByUserId: input.uploadedByUserId ?? input.userId,
            uploadedByRole: input.uploadedByRole ?? null,
            uploadNotes: input.uploadNotes ?? null,
            imageUrl: input.imageUrl,
            prediction: input.analysisData.prediction,
            confidence: input.analysisData.confidence,
            probabilities: input.analysisData.probabilities
              ? (input.analysisData.probabilities as Prisma.InputJsonValue)
              : Prisma.JsonNull,
            needsReview: input.analysisData.needsReview,
            reviewStatus:
              input.reviewStatus ||
              (input.analysisData.needsReview ? "requires_review" : "pending_review"),
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

    async findHistoryByUploadedUserId(uploadedByUserId) {
      try {
        return await db.analysisResult.findMany({
          where: {
            OR: [
              { uploadedByUserId },
              { userId: uploadedByUserId },
            ],
          },
          include: {
            medicalRecord: {
              include: {
                patient: {
                  select: {
                    id: true,
                    fullName: true,
                    email: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        });
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to load uploaded analysis history",
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
