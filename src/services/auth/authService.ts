import bcrypt from "../../../lib/auth/bcryptWrapper.mjs";
import jwt from "jsonwebtoken";
import { AppError } from "../../lib/errors/appError";
import { applyJwtClaimsToSignOptions } from "../../../lib/auth/jwtClaims.js";
import { getJwtSecret } from "../../../lib/auth/jwtSecret.js";
import type {
  LoginCommand,
  LoginResult,
  RegisterDoctorCommand,
  RegisterDoctorResult,
  RegisterPatientCommand,
  RegisterPatientResult,
} from "../../types/auth";
import type { AuthUserRepository } from "../../repositories/auth/userRepository";
import type { AuthActivityRepository } from "../../repositories/auth/activityRepository";
import type { AuthNotificationRepository } from "../../repositories/auth/notificationRepository";
import type { LoginAttemptStore } from "./loginAttemptStore";
import type { AuthDoctorRepository } from "../../repositories/auth/doctorRepository";

export interface AuthService {
  login(command: LoginCommand): Promise<LoginResult>;
  registerPatient(command: RegisterPatientCommand): Promise<RegisterPatientResult>;
  registerDoctor(command: RegisterDoctorCommand): Promise<RegisterDoctorResult>;
}

type AuthServiceDeps = {
  userRepository: AuthUserRepository;
  doctorRepository: AuthDoctorRepository;
  activityRepository: AuthActivityRepository;
  notificationRepository: AuthNotificationRepository;
  loginAttemptStore: LoginAttemptStore;
  maxAttempts: number;
  windowMinutes: number;
};

export function createAuthService(deps: AuthServiceDeps): AuthService {
  return {
    async login(command) {
      const email = String(command.email || "").trim();
      const password = String(command.password || "");

      if (!email || !password) {
        throw new AppError({
          code: "validation_error",
          message: "يرجى إدخال البريد وكلمة المرور",
          statusCode: 400,
        });
      }

      const now = Date.now();
      const entry = deps.loginAttemptStore.get(email, now);

      if (
        entry.count >= deps.maxAttempts &&
        now - entry.first < deps.windowMinutes * 60 * 1000
      ) {
        throw new AppError({
          code: "forbidden",
          message: `تم تجاوز الحد الأقصى لمحاولات الدخول. يرجى المحاولة بعد ${deps.windowMinutes} دقيقة.`,
          statusCode: 429,
        });
      }

      const user = await deps.userRepository.findByEmailWithDoctor(email);
      if (!user) {
        deps.loginAttemptStore.increment(email, now);
        throw new AppError({
          code: "not_found",
          message: "المستخدم غير موجود",
          statusCode: 404,
        });
      }

      if (user.role === "doctor") {
        if (!user.doctor) {
          throw new AppError({
            code: "forbidden",
            message: "حسابك قيد المراجعة من الإدارة",
            statusCode: 403,
          });
        }

        if (user.doctor.status === "banned") {
          throw new AppError({
            code: "forbidden",
            message: "تم رفض طلبك",
            statusCode: 403,
          });
        }

        if (user.doctor.status !== "active") {
          throw new AppError({
            code: "forbidden",
            message: "حسابك قيد المراجعة من الإدارة",
            statusCode: 403,
          });
        }
      } else if (!user.isActive) {
        throw new AppError({
          code: "forbidden",
          message: "الحساب غير مفعل",
          statusCode: 403,
        });
      }

      if (user.isDeleted) {
        throw new AppError({
          code: "forbidden",
          message: "الحساب محذوف",
          statusCode: 403,
        });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        deps.loginAttemptStore.increment(email, now);
        throw new AppError({
          code: "unauthenticated",
          message: "كلمة المرور غير صحيحة",
          statusCode: 401,
        });
      }

      deps.loginAttemptStore.clear(email);

      await deps.activityRepository.createLoginActivity({
        userId: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        ip: command.ip,
      });

      try {
        const since = new Date(Date.now() - 12 * 60 * 60 * 1000);
        const hasRecent = await deps.notificationRepository.hasRecentSecurityLoginNotification(
          user.id,
          since,
        );

        if (!hasRecent) {
          await deps.notificationRepository.createSecurityLoginNotification({
            userId: user.id,
            ip: command.ip,
          });
        }
      } catch (error) {
        if (process.env.DEBUG_AUTH === "1") {
          console.warn("authService.login security notification failed", error);
        }
      }

      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role,
          fullName: user.fullName,
          isActive: Boolean(user.isActive),
        },
        getJwtSecret(),
        applyJwtClaimsToSignOptions({ expiresIn: "2h" }),
      );

      const { password: _password, ...safeUser } = user;
      const result: LoginResult = {
        user: safeUser,
        token,
      };

      if (process.env.NODE_ENV !== "production") {
        result.tokenForDev = token;
      }

      return result;
    },

    async registerPatient(command) {
      if (!command.email || !command.password || !command.fullName || !command.doctorId) {
        throw new AppError({
          code: "validation_error",
          message: "جميع الحقول مطلوبة",
          statusCode: 400,
        });
      }

      const existing = await deps.userRepository.findByEmail(command.email);
      if (existing) {
        throw new AppError({
          code: "validation_error",
          message: "البريد الإلكتروني مستخدم بالفعل",
          statusCode: 409,
        });
      }

      const hashedPassword = await bcrypt.hash(command.password, 10);
      const created = await deps.userRepository.createPatientUser({
        email: command.email,
        hashedPassword,
        fullName: command.fullName,
        phone: command.phone || null,
        doctorId: command.doctorId || null,
      });

      return {
        user: {
          id: created.id,
          email: created.email,
          fullName: created.fullName,
          patientId: created.patient.id,
        },
      };
    },

    async registerDoctor(command) {
      const { email, password, fullName, licenseNumber, phone } = command;
      if (!email || !password || !fullName || !licenseNumber || !phone) {
        throw new AppError({
          code: "validation_error",
          message: "جميع الحقول مطلوبة",
          statusCode: 400,
        });
      }

      const [existingPhone, existingLicense, existingEmail] = await Promise.all([
        deps.doctorRepository.findByPhone(phone),
        deps.doctorRepository.findByLicenseNumber(licenseNumber),
        deps.userRepository.findByEmail(email),
      ]);

      if (existingPhone) {
        throw new AppError({
          code: "validation_error",
          message: "رقم الهاتف مستخدم بالفعل",
          statusCode: 409,
          details: { errorCode: "PHONE_ALREADY_USED" },
        });
      }

      if (existingLicense) {
        throw new AppError({
          code: "validation_error",
          message: "رقم الترخيص مستخدم بالفعل",
          statusCode: 409,
          details: { errorCode: "LICENSE_ALREADY_USED" },
        });
      }

      if (existingEmail) {
        throw new AppError({
          code: "validation_error",
          message: "البريد الإلكتروني مستخدم بالفعل",
          statusCode: 409,
          details: { errorCode: "EMAIL_ALREADY_USED" },
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      try {
        const createdDoctor = await deps.doctorRepository.createDoctorAccount({
          email,
          hashedPassword,
          fullName,
          licenseNumber,
          phone,
        });

        await deps.activityRepository.createDoctorRegistrationActivity({
          userId: createdDoctor.id,
          fullName: createdDoctor.fullName,
          email: createdDoctor.email,
          licenseNumber,
          phone,
        });
      } catch (error) {
        const appError = error instanceof AppError ? error : null;
        const details = appError?.details as {
          prismaCode?: string;
          target?: string[] | string;
        } | undefined;

        if (details?.prismaCode === "P2002") {
          const fields = Array.isArray(details.target)
            ? details.target
            : typeof details.target === "string"
              ? [details.target]
              : [];

          if (fields.some((field) => String(field).includes("phone"))) {
            throw new AppError({
              code: "validation_error",
              message: "رقم الهاتف مستخدم بالفعل",
              statusCode: 409,
              details: { errorCode: "PHONE_ALREADY_USED" },
            });
          }

          if (fields.some((field) => String(field).includes("licenseNumber"))) {
            throw new AppError({
              code: "validation_error",
              message: "رقم الترخيص مستخدم بالفعل",
              statusCode: 409,
              details: { errorCode: "LICENSE_ALREADY_USED" },
            });
          }

          if (fields.some((field) => String(field).includes("email"))) {
            throw new AppError({
              code: "validation_error",
              message: "البريد الإلكتروني مستخدم بالفعل",
              statusCode: 409,
              details: { errorCode: "EMAIL_ALREADY_USED" },
            });
          }

          throw new AppError({
            code: "validation_error",
            message: "بيانات مستخدمة بالفعل",
            statusCode: 409,
            details: { errorCode: "DATA_ALREADY_USED" },
          });
        }

        throw new AppError({
          code: "server_error",
          message: "حدث خطأ أثناء التسجيل",
          statusCode: 500,
          cause: error,
        });
      }

      return { success: true };
    },
  };
}
