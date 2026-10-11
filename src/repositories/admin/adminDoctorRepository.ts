import { DoctorStatus, type Prisma } from "@prisma/client";
import { prisma, type PrismaClientLike } from "../../db/prisma";
import { AppError } from "../../lib/errors/appError";

type DoctorWithUser = Prisma.DoctorGetPayload<{
  include: {
    user: {
      select: {
        id: true;
        fullName: true;
        email: true;
        createdAt: true;
        isActive: true;
      };
    };
  };
}>;

export interface AdminDoctorRepository {
  listDoctorsWithUser(): Promise<DoctorWithUser[]>;
  findUserByEmail(email: string): Promise<{ id: string } | null>;
  createDoctorWithUser(input: {
    name: string;
    email: string;
    phone: string;
    licenseNumber: string;
    hashedPassword: string;
  }): Promise<DoctorWithUser>;
  updateDoctorStatus(input: { userId: string; status: DoctorStatus }): Promise<void>;
  findDoctorByUserId(userId: string): Promise<{ userId: string } | null>;
  findUserById(userId: string): Promise<{ id: string } | null>;
  updateDoctorAndUser(input: {
    userId: string;
    user: {
      fullName?: string;
      email?: string;
      isActive?: boolean;
    };
    doctor: {
      phone?: string;
      licenseNumber?: string;
      clinic?: string | null;
      status?: DoctorStatus;
    };
  }): Promise<void>;
}

export function createAdminDoctorRepository(
  db: PrismaClientLike = prisma,
): AdminDoctorRepository {
  return {
    async listDoctorsWithUser() {
      try {
        return await db.doctor.findMany({ include: { user: { select: { id: true, fullName: true, email: true, createdAt: true, isActive: true } } } });
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to list doctors",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async findUserByEmail(email) {
      try {
        return await db.user.findUnique({ where: { email }, select: { id: true } });
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to find user by email",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async createDoctorWithUser(input) {
      try {
        return await db.$transaction(async (transaction: Prisma.TransactionClient) => {
          const createdUser = await transaction.user.create({
            data: {
              fullName: input.name,
              email: input.email,
              role: "doctor",
              password: input.hashedPassword,
              isActive: true,
            },
          });

          return transaction.doctor.create({
            data: {
              userId: createdUser.id,
              phone: input.phone,
              licenseNumber: input.licenseNumber,
              status: "active",
            },
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                  createdAt: true,
                  isActive: true,
                },
              },
            },
          });
        });
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to create doctor",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async updateDoctorStatus(input) {
      try {
        await db.$transaction(async (transaction: Prisma.TransactionClient) => {
          await transaction.doctor.update({
            where: { userId: input.userId },
            data: { status: input.status },
          });

          await transaction.user.update({
            where: { id: input.userId },
            data: { isActive: input.status === "active" },
          });

          await transaction.activity.create({
            data: {
              type: "update_doctor_status",
              description: `تم تحديث حالة الطبيب إلى ${input.status}`,
              userId: input.userId,
              meta: { status: input.status },
            },
          });
        });
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to update doctor status",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async findDoctorByUserId(userId) {
      try {
        return await db.doctor.findUnique({ where: { userId }, select: { userId: true } });
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to find doctor",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async findUserById(userId) {
      try {
        return await db.user.findUnique({ where: { id: userId }, select: { id: true } });
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to find user",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async updateDoctorAndUser(input) {
      try {
        await db.$transaction(async (transaction: Prisma.TransactionClient) => {
          await transaction.user.update({
            where: { id: input.userId },
            data: input.user,
          });

          await transaction.doctor.update({
            where: { userId: input.userId },
            data: input.doctor,
          });

          await transaction.activity.create({
            data: {
              type: "update_doctor",
              description: "تم تعديل بيانات الطبيب بواسطة الأدمن",
              userId: input.userId,
              meta: {
                updatedUser: Object.keys(input.user),
                updatedDoctor: Object.keys(input.doctor),
                newStatus: input.doctor.status,
              },
            },
          });
        });
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to update doctor",
          statusCode: 500,
          cause: error,
        });
      }
    },
  };
}
