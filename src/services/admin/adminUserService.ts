import bcrypt from "../../../lib/auth/bcryptWrapper.mjs";
import { AppError } from "../../lib/errors/appError";
import type { AdminUserRepository } from "../../repositories/admin/adminUserRepository";

export interface AdminUserService {
  listUsers(): Promise<Array<Record<string, unknown>>>;
  createAdminUser(input: {
    name: string;
    email: string;
    password: string;
    status?: string;
  }): Promise<Record<string, unknown>>;
  toggleUserState(input: {
    id: string;
    isActive?: boolean;
    status?: string;
  }): Promise<{ success: true; user: Record<string, unknown> }>;
}

export function createAdminUserService(deps: {
  adminUserRepository: AdminUserRepository;
}): AdminUserService {
  return {
    async listUsers() {
      const users = await deps.adminUserRepository.listUsersWithProfiles();
      return users.map((user) => {
        const safeUser = { ...user };
        delete (safeUser as { password?: unknown }).password;
        return safeUser;
      });
    },

    async createAdminUser(input) {
      const name = String(input.name || "").trim();
      const email = String(input.email || "").trim();
      const password = String(input.password || "");
      const status = String(input.status || "active");

      if (!name || !email || !password) {
        throw new AppError({
          code: "validation_error",
          message: "name, email and password are required",
          statusCode: 400,
        });
      }

      const existing = await deps.adminUserRepository.findUserByEmail(email);
      if (existing) {
        throw new AppError({
          code: "validation_error",
          message: "User with this email already exists",
          statusCode: 409,
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const created = await deps.adminUserRepository.createAdminUser({
        fullName: name,
        email,
        hashedPassword,
        isActive: status === "active",
      });

      const safeUser = { ...created };
      delete (safeUser as { password?: unknown }).password;
      return safeUser;
    },

    async toggleUserState(input) {
      const id = String(input.id || "").trim();
      if (!id) {
        throw new AppError({
          code: "validation_error",
          message: "User ID required",
          statusCode: 400,
        });
      }

      let isActive = input.isActive;
      if (typeof isActive === "undefined" && typeof input.status === "string") {
        isActive = input.status === "active";
      }

      if (typeof isActive !== "boolean") {
        throw new AppError({
          code: "validation_error",
          message: "isActive (boolean) is required in body",
          statusCode: 400,
        });
      }

      const existing = await deps.adminUserRepository.findUserByIdWithProfiles(id);
      if (!existing) {
        throw new AppError({
          code: "not_found",
          message: "User not found",
          statusCode: 404,
        });
      }

      await deps.adminUserRepository.toggleUserActiveState({ id, isActive });

      const updated = await deps.adminUserRepository.findUserByIdWithProfiles(id);
      const safeUser = { ...(updated || existing) } as Record<string, unknown>;
      delete (safeUser as { password?: unknown }).password;

      return { success: true, user: safeUser };
    },
  };
}
