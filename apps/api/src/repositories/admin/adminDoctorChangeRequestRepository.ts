import type { Prisma } from "@prisma/client";
import { prisma, type PrismaClientLike } from "../../db/prisma";
import { AppError } from "../../lib/errors/appError";

type ChangeRequestWithUser = Prisma.ChangeRequestGetPayload<{
  include: {
    user: {
      select: {
        id: true;
        fullName: true;
        email: true;
        role: true;
        isActive: true;
        createdAt: true;
        updatedAt: true;
      };
    };
  };
}>;

type DoctorWithUser = Prisma.DoctorGetPayload<{
  include: {
    user: {
      select: {
        fullName: true;
        email: true;
      };
    };
  };
}>;

export interface AdminDoctorChangeRequestRepository {
  listDoctorChangeRequests(all: boolean): Promise<ChangeRequestWithUser[]>;
  findPatientsByIds(ids: string[]): Promise<Array<{ id: string; doctorId: string | null }>>;
  findDoctorsByIds(ids: string[]): Promise<DoctorWithUser[]>;
  findDoctorChangeRequestById(id: string): Promise<Prisma.ChangeRequestGetPayload<{}> | null>;
  updatePatientDoctor(patientId: string, doctorId: string): Promise<void>;
  updateChangeRequestStatus(
    id: string,
    status: "approved" | "rejected",
  ): Promise<Prisma.ChangeRequestGetPayload<{}>>;
  findDoctorByUserId(userId: string): Promise<DoctorWithUser | null>;
  findPatientNameById(id: string): Promise<string | null>;
}

export function createAdminDoctorChangeRequestRepository(
  db: PrismaClientLike = prisma,
): AdminDoctorChangeRequestRepository {
  return {
    async listDoctorChangeRequests(all) {
      try {
        return await db.changeRequest.findMany({
          where: {
            type: "doctor_change",
            ...(all ? {} : { status: "pending" }),
            isDeleted: false,
          },
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
        });
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to list doctor change requests",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async findPatientsByIds(ids) {
      try {
        if (!ids.length) return [];
        return await db.patient.findMany({
          where: { id: { in: ids } },
          select: { id: true, doctorId: true },
        });
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to load patients by ids",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async findDoctorsByIds(ids) {
      try {
        if (!ids.length) return [];
        return await db.doctor.findMany({
          where: { userId: { in: ids } },
          include: {
            user: {
              select: {
                fullName: true,
                email: true,
              },
            },
          },
        });
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to load doctors by ids",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async findDoctorChangeRequestById(id) {
      try {
        return await db.changeRequest.findUnique({ where: { id } });
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to find doctor change request",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async updatePatientDoctor(patientId, doctorId) {
      try {
        await db.patient.update({
          where: { id: patientId },
          data: { doctorId },
        });
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to update patient doctor",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async updateChangeRequestStatus(id, status) {
      try {
        return await db.changeRequest.update({
          where: { id },
          data: {
            status,
            reviewedAt: new Date(),
          },
        });
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to update doctor change request status",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async findDoctorByUserId(userId) {
      try {
        return await db.doctor.findUnique({
          where: { userId },
          include: {
            user: {
              select: {
                fullName: true,
                email: true,
              },
            },
          },
        });
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to find doctor by user id",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async findPatientNameById(id) {
      try {
        const patient = await db.patient.findUnique({
          where: { id },
          select: { fullName: true },
        });
        return patient?.fullName || null;
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to find patient name",
          statusCode: 500,
          cause: error,
        });
      }
    },
  };
}
