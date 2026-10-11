import { prisma, type PrismaClientLike } from "../../db/prisma";
import { AppError } from "../../lib/errors/appError";

export type PatientIdentity = {
  id: string;
  doctorId: string | null;
  fullName: string;
};

export interface PatientRepository {
  findByUserId(userId: string): Promise<PatientIdentity | null>;
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
