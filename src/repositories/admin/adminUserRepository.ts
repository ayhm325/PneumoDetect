import { prisma, type PrismaClientLike } from "../../db/prisma";
import { AppError } from "../../lib/errors/appError";
import type { Prisma } from "@prisma/client";

type UserWithProfiles = Prisma.UserGetPayload<{
  include: { doctor: true; patient: true };
}>;

type AdminUser = Prisma.UserGetPayload<{}>;

export interface AdminUserRepository {
  listUsersWithProfiles(): Promise<UserWithProfiles[]>;
  findUserByEmail(email: string): Promise<{ id: string } | null>;
  findUserByIdWithProfiles(id: string): Promise<UserWithProfiles | null>;
  createAdminUser(input: {
    fullName: string;
    email: string;
    hashedPassword: string;
    isActive: boolean;
  }): Promise<AdminUser>;
  toggleUserActiveState(input: { id: string; isActive: boolean }): Promise<void>;
}

export function createAdminUserRepository(
  db: PrismaClientLike = prisma,
): AdminUserRepository {
  return {
    async listUsersWithProfiles() {
      try {
        return await db.user.findMany({
          include: { doctor: true, patient: true },
          orderBy: { createdAt: "desc" },
        });
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to list users",
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
          message: "Failed to check user email",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async createAdminUser(input) {
      try {
        return await db.user.create({
          data: {
            fullName: input.fullName,
            email: input.email,
            password: input.hashedPassword,
            role: "admin",
            isActive: input.isActive,
          },
        });
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to create admin user",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async findUserByIdWithProfiles(id) {
      try {
        return await db.user.findUnique({
          where: { id },
          include: { doctor: true, patient: true },
        });
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to find user",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async toggleUserActiveState(input) {
      try {
        const doctor = await db.doctor.findUnique({ where: { userId: input.id } });
        const patient = await db.patient.findUnique({ where: { userId: input.id } });

        const operations: Array<Prisma.PrismaPromise<unknown>> = [
          db.user.update({ where: { id: input.id }, data: { isActive: input.isActive } }),
        ];

        if (doctor) {
          operations.push(
            db.doctor.update({
              where: { userId: input.id },
              data: { status: input.isActive ? "active" : "banned" },
            }),
          );
        }

        if (patient) {
          operations.push(
            db.patient.update({
              where: { userId: input.id },
              data: { status: input.isActive ? "active" : "suspended" },
            }),
          );
        }

        await db.$transaction(operations);
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to toggle user state",
          statusCode: 500,
          cause: error,
        });
      }
    },
  };
}
