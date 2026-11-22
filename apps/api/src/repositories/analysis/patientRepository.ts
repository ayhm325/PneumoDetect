import { prisma, type PrismaClientLike } from "../../db/prisma";
import { AppError } from "../../lib/errors/appError";

export type PatientIdentity = {
  id: string;
  userId?: string;
  doctorId: string | null;
  fullName: string;
};

export interface PatientRepository {
  findByUserId(userId: string): Promise<PatientIdentity | null>;
  findById?(id: string): Promise<PatientIdentity | null>;
}

export function createPatientRepository(
  db: PrismaClientLike = prisma,
): PatientRepository {
  return {
    async findByUserId(userId) {
      try {
        return await db.patient.findUnique({
          where: { userId },
          select: {
            id: true,
            userId: true,
            doctorId: true,
            fullName: true,
          },
        });
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to load patient record",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async findById(id) {
      try {
        return await db.patient.findUnique({
          where: { id },
          select: {
            id: true,
            userId: true,
            doctorId: true,
            fullName: true,
          },
        });
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to load patient record",
          statusCode: 500,
          cause: error,
        });
      }
    },
  };
}
