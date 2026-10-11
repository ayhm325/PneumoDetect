import { prisma, type PrismaClientLike } from "../../db/prisma";
import { AppError } from "../../lib/errors/appError";
import type { Prisma } from "@prisma/client";

export type UserWithDoctor = Prisma.UserGetPayload<{
  include: { doctor: true };
}> & {
  isDeleted?: boolean;
};

export interface AuthUserRepository {
  findByEmailWithDoctor(email: string): Promise<UserWithDoctor | null>;
  findByEmail(email: string): Promise<{ id: string } | null>;
  createPatientUser(input: {
    email: string;
    hashedPassword: string;
    fullName: string;
    phone?: string | null;
    doctorId?: string | null;
  }): Promise<{ id: string; email: string; fullName: string; patient: { id: string } }>;
}

export function createAuthUserRepository(db: PrismaClientLike = prisma): AuthUserRepository {
  return {
    async findByEmailWithDoctor(email) {
      try {
        return await db.user.findUnique({
          where: { email },
          include: { doctor: true },
        });
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to load user",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async findByEmail(email) {
      try {
        return await db.user.findUnique({ where: { email }, select: { id: true } });
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to check user existence",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async createPatientUser(input) {
      try {
        return await db.user.create({
          data: {
            email: input.email,
            password: input.hashedPassword,
            fullName: input.fullName,
            role: "patient",
            isActive: true,
            patient: {
              create: {
                fullName: input.fullName,
                email: input.email,
                phone: input.phone || null,
                doctorId: input.doctorId || null,
              },
            },
          },
          include: { patient: true },
        });
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to create patient user",
          statusCode: 500,
          cause: error,
        });
      }
    },
  };
}
