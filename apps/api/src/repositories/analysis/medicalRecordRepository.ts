import { prisma, type PrismaClientLike } from "../../db/prisma";
import { AppError } from "../../lib/errors/appError";

export type CreateMedicalRecordInput = {
  patientId: string;
  doctorId: string | null;
  analysisResultId?: string | null;
  aiResult: "POSITIVE" | "NEGATIVE";
  confidenceScore: number;
  imageUrl: string;
  uploadNotes?: string | null;
};

export interface MedicalRecordRepository {
  create(input: CreateMedicalRecordInput, tx?: PrismaClientLike): Promise<unknown>;
}

export function createMedicalRecordRepository(
  db: PrismaClientLike = prisma,
): MedicalRecordRepository {
  return {
    async create(input, tx) {
      const client = tx || db;
      try {
        return await client.medicalRecord.create({
          data: {
            patientId: input.patientId,
            doctorId: input.doctorId,
            analysisResultId: input.analysisResultId ?? null,
            aiResult: input.aiResult,
            confidenceScore: input.confidenceScore,
            imageUrl: input.imageUrl,
            uploadNotes: input.uploadNotes ?? null,
            reviewedByDoctor: false,
            doctorNotes: null,
          },
        });
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to create medical record",
          statusCode: 500,
          cause: error,
        });
      }
    },
  };
}
