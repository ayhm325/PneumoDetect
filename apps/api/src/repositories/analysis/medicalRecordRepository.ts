import { prisma, type PrismaClientLike } from "../../db/prisma";
import { AppError } from "../../lib/errors/appError";

export type CreateMedicalRecordInput = {
  patientId: string;
  doctorId: string | null;
  aiResult: "POSITIVE" | "NEGATIVE";
  confidenceScore: number;
  imageUrl: string;
};

export interface MedicalRecordRepository {
  create(input: CreateMedicalRecordInput): Promise<unknown>;
}

export function createMedicalRecordRepository(
  db: PrismaClientLike = prisma,
): MedicalRecordRepository {
  return {
    async create(input) {
      try {
        return await db.medicalRecord.create({
          data: {
            patientId: input.patientId,
            doctorId: input.doctorId,
            aiResult: input.aiResult,
            confidenceScore: input.confidenceScore,
            imageUrl: input.imageUrl,
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
