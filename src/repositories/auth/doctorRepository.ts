import { prisma, type PrismaClientLike } from "../../db/prisma";
import { AppError } from "../../lib/errors/appError";

export interface AuthDoctorRepository {
  findByPhone(phone: string): Promise<{ userId: string } | null>;
  findByLicenseNumber(licenseNumber: string): Promise<{ userId: string } | null>;
  createDoctorAccount(input: {
    email: string;
    hashedPassword: string;
    fullName: string;
    licenseNumber: string;
    phone: string;
  }): Promise<{ id: string; email: string; fullName: string }>;
}

export function createAuthDoctorRepository(
  db: PrismaClientLike = prisma,
): AuthDoctorRepository {
  return {
    async findByPhone(phone) {
      try {
        return await db.doctor.findUnique({
          where: { phone },
          select: { userId: true },
        });
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to check doctor phone",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async findByLicenseNumber(licenseNumber) {
      try {
        return await db.doctor.findUnique({
          where: { licenseNumber },
          select: { userId: true },
        });
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to check doctor license",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async createDoctorAccount(input) {
      try {
        return await db.$transaction(async (transaction: PrismaClientLike) => {
          const user = await transaction.user.create({
            data: {
              email: input.email,
              password: input.hashedPassword,
              fullName: input.fullName,
              role: "doctor",
            },
            select: {
              id: true,
              email: true,
              fullName: true,
            },
          });

          await transaction.doctor.create({
            data: {
              userId: user.id,
              licenseNumber: input.licenseNumber,
              phone: input.phone,
              status: "pending",
            },
          });

          return user;
        });
      } catch (error) {
        const asRecord = error as { code?: string; meta?: { target?: string[] | string } };
        throw new AppError({
          code: "repository_error",
          message: "Failed to create doctor account",
          statusCode: 500,
          details: {
            prismaCode: asRecord?.code,
            target: asRecord?.meta?.target,
          },
          cause: error,
        });
      }
    },
  };
}
