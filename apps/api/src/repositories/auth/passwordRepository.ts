import { prisma, type PrismaClientLike } from "../../db/prisma";
import { AppError } from "../../lib/errors/appError";

export interface PasswordRepository {
  findUserByEmail(email: string): Promise<{ id: string; password: string } | null>;
  findUserById(id: string): Promise<{ id: string; password: string } | null>;
  updatePasswordByEmail(email: string, hashedPassword: string): Promise<void>;
  updatePasswordById(id: string, hashedPassword: string): Promise<void>;
}

export function createPasswordRepository(
  db: PrismaClientLike = prisma,
): PasswordRepository {
  return {
    async findUserByEmail(email) {
      try {
        return await db.user.findUnique({
          where: { email },
          select: { id: true, password: true },
        });
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to fetch user by email",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async findUserById(id) {
      try {
        return await db.user.findUnique({
          where: { id },
          select: { id: true, password: true },
        });
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to fetch user by id",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async updatePasswordByEmail(email, hashedPassword) {
      try {
        await db.user.update({
          where: { email },
          data: { password: hashedPassword },
        });
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to update password by email",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async updatePasswordById(id, hashedPassword) {
      try {
        await db.user.update({
          where: { id },
          data: { password: hashedPassword },
        });
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to update password by id",
          statusCode: 500,
          cause: error,
        });
      }
    },
  };
}
