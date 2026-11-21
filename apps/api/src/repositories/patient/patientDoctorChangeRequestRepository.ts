import { prisma, type PrismaClientLike } from "../../db/prisma";
import { AppError } from "../../lib/errors/appError";

export interface PatientDoctorChangeRequestRepository {
  listDoctorsForChange(): Promise<Array<Record<string, unknown>>>;
  findPatientByUserId(userId: string): Promise<Record<string, unknown> | null>;
  findDoctorByUserId(userId: string): Promise<Record<string, unknown> | null>;
  createDoctorChangeRequest(input: {
    userId: string;
    patientId: string;
    currentDoctorId: string | null;
    requestedDoctorId: string;
    reason: string;
  }): Promise<Record<string, unknown>>;
}

export function createPatientDoctorChangeRequestRepository(
  db: PrismaClientLike = prisma,
): PatientDoctorChangeRequestRepository {
  return {
    async listDoctorsForChange() {
      try {
        const doctors = await db.doctor.findMany({
          where: { status: { in: ["active", "pending"] } },
          select: {
            userId: true,
            status: true,
            phone: true,
            clinic: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                isActive: true,
                role: true,
                createdAt: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        });

        return doctors as unknown as Array<Record<string, unknown>>;
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to list doctors for change request",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async findPatientByUserId(userId) {
      try {
        const patient = await db.patient.findFirst({ where: { userId } });
        return patient as unknown as Record<string, unknown> | null;
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to find patient by userId",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async findDoctorByUserId(userId) {
      try {
        const doctor = await db.doctor.findUnique({
          where: { userId },
          select: { userId: true, status: true },
        });
        return doctor as unknown as Record<string, unknown> | null;
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to find doctor by userId",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async createDoctorChangeRequest(input) {
      try {
        const created = await db.changeRequest.create({
          data: {
            userId: input.userId,
            type: "doctor_change",
            status: "pending",
            details: {
              patientId: input.patientId,
              currentDoctorId: input.currentDoctorId,
              requestedDoctorId: input.requestedDoctorId,
              reason: input.reason,
            },
          },
        });

        return created as unknown as Record<string, unknown>;
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to create doctor change request",
          statusCode: 500,
          cause: error,
        });
      }
    },
  };
}
