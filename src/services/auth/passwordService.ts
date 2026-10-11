import bcrypt from "../../../lib/auth/bcryptWrapper.mjs";
import { AppError } from "../../lib/errors/appError";
import { authenticateRequest, authenticateToken, extractBearerToken } from "../../lib/auth/authRequestService";
import type { PasswordRepository } from "../../repositories/auth/passwordRepository";
import type { AuthNotificationRepository } from "../../repositories/auth/notificationRepository";

export interface PasswordService {
  changePasswordByEmail(input: {
    email: string;
    currentPassword: string;
    newPassword: string;
  }): Promise<{ success: true }>;
  changePasswordForAuthenticatedUser(input: {
    request: Request;
    oldPassword: string;
    newPassword: string;
    tokenFallback?: string;
  }): Promise<{ success: true }>;
}

export function createPasswordService(deps: {
  passwordRepository: PasswordRepository;
  notificationRepository: AuthNotificationRepository;
}): PasswordService {
  return {
    async changePasswordByEmail(input) {
      const email = String(input.email || "").trim();
      const currentPassword = String(input.currentPassword || "").trim();
      const newPassword = String(input.newPassword || "").trim();

      if (!email || !currentPassword || !newPassword) {
        throw new AppError({
          code: "validation_error",
          message: "missing_fields",
          statusCode: 400,
        });
      }

      if (currentPassword === newPassword) {
        throw new AppError({
          code: "validation_error",
          message: "same_password",
          statusCode: 400,
        });
      }

      const user = await deps.passwordRepository.findUserByEmail(email);
      if (!user) {
        throw new AppError({
          code: "not_found",
          message: "user_not_found",
          statusCode: 404,
        });
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password || "");
      if (!isMatch) {
        throw new AppError({
          code: "unauthenticated",
          message: "wrong_current_password",
          statusCode: 401,
        });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await deps.passwordRepository.updatePasswordByEmail(email, hashedPassword);

      return { success: true };
    },

    async changePasswordForAuthenticatedUser(input) {
      const oldPassword = String(input.oldPassword || "").trim();
      const newPassword = String(input.newPassword || "").trim();

      if (!oldPassword || !newPassword) {
        throw new AppError({
          code: "validation_error",
          message: "missing_fields",
          statusCode: 400,
        });
      }

      if (oldPassword === newPassword) {
        throw new AppError({
          code: "validation_error",
          message: "same_password",
          statusCode: 400,
        });
      }

      let userId: string;
      const token = extractBearerToken(input.request) || input.tokenFallback || null;
      if (token) {
        const auth = await authenticateToken(token);
        userId = auth.user.id;
      } else {
        const auth = await authenticateRequest(input.request);
        userId = auth.user.id;
      }

      const user = await deps.passwordRepository.findUserById(userId);
      if (!user) {
        throw new AppError({
          code: "not_found",
          message: "user_not_found",
          statusCode: 404,
        });
      }

      const isMatch = await bcrypt.compare(oldPassword, user.password || "");
      if (!isMatch) {
        throw new AppError({
          code: "validation_error",
          message: "wrong_current_password",
          statusCode: 400,
        });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await deps.passwordRepository.updatePasswordById(userId, hashedPassword);

      await deps.notificationRepository.createSecurityPasswordChangeNotification({
        userId,
      });

      return { success: true };
    },
  };
}
