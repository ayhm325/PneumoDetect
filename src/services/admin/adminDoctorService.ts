import bcrypt from "../../../lib/auth/bcryptWrapper.mjs";
import { DoctorStatus } from "@prisma/client";
import { AppError } from "../../lib/errors/appError";
import type { AuthNotificationRepository } from "../../repositories/auth/notificationRepository";
import type { AdminDoctorRepository } from "../../repositories/admin/adminDoctorRepository";

export interface AdminDoctorService {
  listDoctors(): Promise<Array<Record<string, unknown>>>;
  createDoctor(input: {
    name: string;
    email: string;
    phone: string;
    licenseNumber: string;
    password?: string;
  }): Promise<Record<string, unknown>>;
  updateDoctorStatus(input: { id: string; status: string }): Promise<{ success: true }>;
  updateDoctorByUserId(input: {
    userId: string;
    fullName?: string;
    email?: string;
    phone?: string;
    licenseNumber?: string;
    clinic?: string | null;
    status?: string;
  }): Promise<{ success: true }>;
  blockDoctorByUserId(input: { userId: string }): Promise<{ success: true }>;
}

export function createAdminDoctorService(deps: {
  adminDoctorRepository: AdminDoctorRepository;
  notificationRepository: AuthNotificationRepository;
}): AdminDoctorService {
  return {
    async listDoctors() {
      const doctors = await deps.adminDoctorRepository.listDoctorsWithUser();
      return doctors.map((doctor) => ({
        id: doctor.userId,
        licenseNumber: doctor.licenseNumber,
        phone: doctor.phone,
        status: doctor.status,
        createdAt: doctor.createdAt,
        user: doctor.user
          ? {
              id: doctor.user.id,
              fullName: doctor.user.fullName,
              email: doctor.user.email,
              createdAt: doctor.user.createdAt,
              isActive: doctor.user.isActive,
            }
          : null,
      }));
    },

    async createDoctor(input) {
      const name = String(input.name || "").trim();
      const email = String(input.email || "").trim();
      const phone = String(input.phone || "").trim();
      const licenseNumber = String(input.licenseNumber || "").trim();

      if (!name || !email || !phone || !licenseNumber) {
        throw new AppError({
          code: "validation_error",
          message: "يرجى تعبئة جميع الحقول المطلوبة",
          statusCode: 400,
        });
      }

      const existing = await deps.adminDoctorRepository.findUserByEmail(email);
      if (existing) {
        throw new AppError({
          code: "validation_error",
          message: "البريد الإلكتروني مستخدم بالفعل",
          statusCode: 400,
        });
      }

      const defaultPassword = process.env.DEFAULT_DOCTOR_PASSWORD;
      const rawPassword =
        input.password ||
        defaultPassword ||
        (process.env.NODE_ENV === "development" ? "doctor123" : null);

      if (!rawPassword) {
        throw new AppError({
          code: "validation_error",
          message: "كلمة المرور غير متوفرة",
          statusCode: 400,
        });
      }

      const hashedPassword = await bcrypt.hash(rawPassword, 10);

      const created = await deps.adminDoctorRepository.createDoctorWithUser({
        name,
        email,
        phone,
        licenseNumber,
        hashedPassword,
      });

      return created as unknown as Record<string, unknown>;
    },

    async updateDoctorStatus(input) {
      const id = String(input.id || "").trim();
      const status = String(input.status || "").trim();

      if (!id || !status) {
        throw new AppError({
          code: "validation_error",
          message: "بيانات غير صالحة",
          statusCode: 400,
        });
      }

      if (!Object.values(DoctorStatus).includes(status as DoctorStatus)) {
        throw new AppError({
          code: "validation_error",
          message: "حالة الطبيب غير صحيحة",
          statusCode: 400,
        });
      }

      await deps.adminDoctorRepository.updateDoctorStatus({
        userId: id,
        status: status as DoctorStatus,
      });

      const isActive = status === "active";
      await deps.notificationRepository.createSystemNotification({
        userId: id,
        type: isActive ? "success" : "warning",
        messageAr: isActive
          ? "تم تفعيل حساب الطبيب الخاص بك."
          : "تم تعطيل أو حظر حساب الطبيب الخاص بك.",
        messageEn: isActive
          ? "Your doctor account has been activated."
          : "Your doctor account has been disabled or banned.",
      });

      return { success: true };
    },

    async updateDoctorByUserId(input) {
      const userId = String(input.userId || "").trim();
      if (!userId) {
        throw new AppError({
          code: "validation_error",
          message: "معرّف الطبيب غير موجود",
          statusCode: 400,
        });
      }

      const statusValue = input.status ? String(input.status).trim() : undefined;
      if (statusValue && !Object.values(DoctorStatus).includes(statusValue as DoctorStatus)) {
        throw new AppError({
          code: "validation_error",
          message: "حالة الطبيب غير صالحة",
          statusCode: 400,
        });
      }

      const doctor = await deps.adminDoctorRepository.findDoctorByUserId(userId);
      if (!doctor) {
        throw new AppError({
          code: "not_found",
          message: "الطبيب غير موجود",
          statusCode: 404,
        });
      }

      const user = await deps.adminDoctorRepository.findUserById(userId);
      if (!user) {
        throw new AppError({
          code: "not_found",
          message: "المستخدم غير موجود",
          statusCode: 404,
        });
      }

      await deps.adminDoctorRepository.updateDoctorAndUser({
        userId,
        user: {
          ...(typeof input.fullName === "string" ? { fullName: input.fullName } : {}),
          ...(typeof input.email === "string" ? { email: input.email } : {}),
          ...(statusValue ? { isActive: statusValue === "active" } : {}),
        },
        doctor: {
          ...(typeof input.phone === "string" ? { phone: input.phone } : {}),
          ...(typeof input.licenseNumber === "string" ? { licenseNumber: input.licenseNumber } : {}),
          ...(typeof input.clinic === "string" || input.clinic === null
            ? { clinic: input.clinic }
            : {}),
          ...(statusValue ? { status: statusValue as DoctorStatus } : {}),
        },
      });

      return { success: true };
    },

    async blockDoctorByUserId(input) {
      const userId = String(input.userId || "").trim();
      if (!userId) {
        throw new AppError({
          code: "validation_error",
          message: "معرّف الطبيب غير موجود",
          statusCode: 400,
        });
      }

      const doctor = await deps.adminDoctorRepository.findDoctorByUserId(userId);
      if (!doctor) {
        throw new AppError({
          code: "not_found",
          message: "الطبيب غير موجود",
          statusCode: 404,
        });
      }

      await deps.adminDoctorRepository.updateDoctorAndUser({
        userId,
        user: { isActive: false },
        doctor: { status: "banned" },
      });

      return { success: true };
    },
  };
}
