import { Gender, type Prisma } from "@prisma/client";
import { prisma, type PrismaClientLike } from "../../db/prisma";
import { AppError } from "../../lib/errors/appError";

type PatientWithRelations = Prisma.PatientGetPayload<{
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
    doctor: {
      select: {
        userId: true;
        status: true;
        phone: true;
        clinic: true;
        createdAt: true;
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
    };
    _count: { select: { appointments: true; medicalRecords: true } };
  };
}>;

export interface AdminPatientRepository {
  listPatients(): Promise<PatientWithRelations[]>;
  createPatientWithUser(input: {
    name: string;
    email: string;
    phone: string;
    gender?: Gender | null;
    bloodType?: string | null;
    birthDate?: Date | null;
    status?: string;
    doctorId?: string;
    hashedPassword: string;
  }): Promise<{ id: string }>;
  findPatientById(id: string): Promise<{ id: string; userId: string | null; doctorId: string | null; fullName: string } | null>;
  updatePatientAndUser(input: {
    patientId: string;
    userId: string;
    user: {
      fullName?: string;
      email?: string;
      isActive?: boolean;
    };
    patient: Prisma.PatientUncheckedUpdateInput;
  }): Promise<void>;
  getPatientWithUserById(id: string): Promise<Prisma.PatientGetPayload<{ include: { user: { select: { id: true; fullName: true; email: true; role: true; isActive: true; createdAt: true; updatedAt: true } } } }> | null>;
}

export function createAdminPatientRepository(
  db: PrismaClientLike = prisma,
): AdminPatientRepository {
  return {
    async listPatients() {
      try {
        return await db.patient.findMany({
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
            doctor: {
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
                    role: true,
                    isActive: true,
                    createdAt: true,
                    updatedAt: true,
                  },
                },
              },
            },
            _count: { select: { appointments: true, medicalRecords: true } },
          },
        });
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to list patients",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async createPatientWithUser(input) {
      try {
        return await db.$transaction(async (transaction: Prisma.TransactionClient) => {
          const user = await transaction.user.create({
            data: {
              fullName: input.name,
              email: input.email,
              password: input.hashedPassword,
              role: "patient",
              isActive: (input.status || "active") === "active",
            },
            select: { id: true },
          });

          return transaction.patient.create({
            data: {
              userId: user.id,
              fullName: input.name,
              email: input.email,
              phone: input.phone,
              gender: input.gender ?? null,
              bloodType: input.bloodType ?? null,
              birthDate: input.birthDate ?? null,
              status: (input.status as "active" | "suspended") || "active",
              ...(input.doctorId ? { doctorId: input.doctorId } : {}),
            },
            select: { id: true },
          });
        });
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to create patient",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async findPatientById(id) {
      try {
        return await db.patient.findUnique({
          where: { id },
          select: { id: true, userId: true, doctorId: true, fullName: true },
        });
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to find patient",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async updatePatientAndUser(input) {
      try {
        await db.$transaction(async (transaction: Prisma.TransactionClient) => {
          await transaction.user.update({
            where: { id: input.userId },
            data: input.user,
          });

          await transaction.patient.update({
            where: { id: input.patientId },
            data: input.patient,
          });
        });
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to update patient",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async getPatientWithUserById(id) {
      try {
        return await db.patient.findUnique({
          where: { id },
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
          message: "Failed to fetch patient with user",
          statusCode: 500,
          cause: error,
        });
      }
    },
  };
}
