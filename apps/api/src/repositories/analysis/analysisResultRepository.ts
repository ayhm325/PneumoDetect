import fs from "fs";
import { Prisma } from "@prisma/client";
import { prisma, type PrismaClientLike } from "../../db/prisma";
import type { SaveAnalysisInput } from "../../types/analysis";
import { AppError } from "../../lib/errors/appError";
import { normalizeUploadStorageReference } from "../../services/analysis/analysisBackfillService";
import {
  resolveHeatmapDiskPath,
  resolveUploadDiskPath,
} from "../../services/analysis/analysisService";

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
            imageUrl: normalizeUploadStorageReference(input.imageUrl) || input.imageUrl,
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
          include: {
            medicalRecord: {
              select: {
                id: true,
                reviewedByDoctor: true,
                doctorNotes: true,
              },
            },
          },
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
      type TargetAnalysisRow = {
        id: string;
        userId: string;
        imageUrl: string;
        heatmapUrl: string | null;
        medicalRecord?: { id: string } | null;
      };
      let target: TargetAnalysisRow | null = null;

      try {
        if (typeof db.analysisResult.findFirst === "function") {
          const found = await db.analysisResult.findFirst({
            where: { id, userId },
            include: {
              medicalRecord: {
                select: { id: true },
              },
            },
          });
          target = (found as TargetAnalysisRow | null) ?? null;
        }
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to inspect analysis result before deletion",
          statusCode: 500,
          cause: error,
        });
      }

      if (typeof db.analysisResult.findFirst === "function" && target === null) {
        return { count: 0 };
      }

      const targetRow = target as TargetAnalysisRow | null;
      if (targetRow?.medicalRecord?.id) {
        throw new AppError({
          code: "medical_record_protected",
          message: "Cannot delete an analysis that is linked to an official medical record",
          statusCode: 409,
        });
      }

      let deletedCount = 0;
      try {
        const result = await db.analysisResult.deleteMany({
          where: { userId, id },
        });
        deletedCount = result.count;
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to delete analysis result",
          statusCode: 500,
          cause: error,
        });
      }

      // Safely clean up unreferenced physical files for unlinked analysis history items
      if (deletedCount > 0 && targetRow) {
        const normImage = normalizeUploadStorageReference(targetRow.imageUrl);
        if (normImage.startsWith("/uploads/")) {
          try {
            const [otherArCount, otherMrCount, otherMsgCount] = await Promise.all([
              typeof db.analysisResult.count === "function"
                ? db.analysisResult.count({
                    where: {
                      OR: [
                        { imageUrl: normImage },
                        { imageUrl: { startsWith: `${normImage}?` } },
                      ],
                    },
                  })
                : Promise.resolve(0),
              typeof db.medicalRecord?.count === "function"
                ? db.medicalRecord.count({
                    where: {
                      OR: [
                        { imageUrl: normImage },
                        { imageUrl: { startsWith: `${normImage}?` } },
                      ],
                    },
                  })
                : Promise.resolve(0),
              typeof db.message?.count === "function"
                ? db.message.count({
                    where: {
                      OR: [
                        { fileUrl: normImage },
                        { fileUrl: { startsWith: `${normImage}?` } },
                      ],
                    },
                  })
                : Promise.resolve(0),
            ]);

            if (otherArCount === 0 && otherMrCount === 0 && otherMsgCount === 0) {
              const diskPath = resolveUploadDiskPath(normImage);
              if (diskPath) {
                await fs.promises.unlink(diskPath).catch(() => undefined);
              }
            }
          } catch {
            // Do not fail deletion if post-commit file cleanup check encounters an error
          }
        }

        if (targetRow.heatmapUrl) {
          try {
            const otherHeatmapCount =
              typeof db.analysisResult.count === "function"
                ? await db.analysisResult.count({
                    where: { heatmapUrl: targetRow.heatmapUrl },
                  })
                : 0;
            if (otherHeatmapCount === 0) {
              const heatmapDisk = resolveHeatmapDiskPath(targetRow.heatmapUrl);
              if (heatmapDisk) {
                await fs.promises.unlink(heatmapDisk).catch(() => undefined);
              }
            }
          } catch {
            // Ignore post-commit heatmap cleanup errors
          }
        }
      }

      return { count: deletedCount };
    },
  };
}
