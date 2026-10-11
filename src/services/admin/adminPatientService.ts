import bcrypt from "../../../lib/auth/bcryptWrapper.mjs";
import { Gender } from "@prisma/client";
import { AppError } from "../../lib/errors/appError";
import type { AuthNotificationRepository } from "../../repositories/auth/notificationRepository";
import type { AdminPatientRepository } from "../../repositories/admin/adminPatientRepository";

type PatientStatus = "active" | "suspended";

export interface AdminPatientService {
  listPatients(): Promise<Array<Record<string, unknown>>>;
  createPatient(input: {
    name: string;
    email: string;
    phone: string;
    gender?: string;
    bloodType?: string;
    birthDate?: string;
    status?: string;
    medicalId?: string;
    doctorId?: string;
    password?: string;
  }): Promise<Record<string, unknown>>;
  updatePatientById(input: {
    id: string;
    name?: string;
    email?: string;
    phone?: string;
    gender?: string;
    doctorId?: string;
    status?: string;
    bloodType?: string;
    birthDate?: string;
    medicalId?: string;
  }): Promise<Record<string, unknown>>;
}

function normalizePatientStatus(value?: string): PatientStatus | undefined {
  if (!value) return undefined;
  if (value === "active") return "active";
  if (value === "suspended" || value === "banned") return "suspended";
  return undefined;
}

function normalizeGender(value?: string): Gender | undefined {
  if (!value) return undefined;
  if (value === "male" || value === "female" || value === "other") {
    return value;
  }
  return undefined;
}

export function createAdminPatientService(deps: {
  adminPatientRepository: AdminPatientRepository;
  notificationRepository: AuthNotificationRepository;
}): AdminPatientService {
  return {
    async listPatients() {
      const patients = await deps.adminPatientRepository.listPatients();
      return patients as unknown as Array<Record<string, unknown>>;
    },

    async createPatient(input) {
      const name = String(input.name || "").trim();
      const email = String(input.email || "").trim();
      const phone = String(input.phone || "").trim();

      if (!name || !email || !phone) {
        throw new AppError({
          code: "validation_error",
          message: "الاسم والبريد والهاتف مطلوبة",
          statusCode: 400,
        });
      }

      const defaultPassword = process.env.DEFAULT_PATIENT_PASSWORD;
      const rawPassword =
        input.password ||
        defaultPassword ||
        (process.env.NODE_ENV === "development" ? "changeme" : null);

      if (!rawPassword) {
        throw new AppError({
          code: "validation_error",
          message: "Missing password (set DEFAULT_PATIENT_PASSWORD in production)",
          statusCode: 400,
        });
      }

      const hashedPassword = await bcrypt.hash(rawPassword, 10);
      const normalizedStatus = normalizePatientStatus(input.status) || "active";
      const normalizedGender = normalizeGender(input.gender);

      const created = await deps.adminPatientRepository.createPatientWithUser({
        name,
        email,
        phone,
        gender: normalizedGender ?? null,
        bloodType: input.bloodType || null,
        birthDate: input.birthDate ? new Date(input.birthDate) : null,
        status: normalizedStatus,
        doctorId: input.doctorId,
        hashedPassword,
      });

      if (input.doctorId && String(input.doctorId).trim()) {
        const assignedDoctorId = String(input.doctorId).trim();
        await deps.notificationRepository.createSystemNotification({
          userId: assignedDoctorId,
          type: "info",
          messageAr: `تم إسناد مريض جديد إليك: ${name}.`,
          messageEn: `A new patient has been assigned to you: ${name}.`,
        });
      }

      return created as unknown as Record<string, unknown>;
    },

    async updatePatientById(input) {
      const id = String(input.id || "").trim();
      if (!id) {
        throw new AppError({
          code: "validation_error",
          message: "Missing patient id",
          statusCode: 400,
        });
      }

      const patient = await deps.adminPatientRepository.findPatientById(id);
      if (!patient) {
        throw new AppError({
          code: "not_found",
          message: "Patient not found",
          statusCode: 404,
        });
      }

      if (!patient.userId) {
        throw new AppError({
          code: "validation_error",
          message: "Patient record missing userId, cannot update user.",
          statusCode: 400,
        });
      }

      const normalizedStatus = normalizePatientStatus(input.status);
      const normalizedGender = normalizeGender(input.gender);
      const previousDoctorId = patient.doctorId || null;

      await deps.adminPatientRepository.updatePatientAndUser({
        patientId: id,
        userId: patient.userId,
        user: {
          ...(typeof input.name === "string" ? { fullName: input.name } : {}),
          ...(typeof input.email === "string" ? { email: input.email } : {}),
          ...(normalizedStatus ? { isActive: normalizedStatus === "active" } : {}),
        },
        patient: {
          ...(typeof input.phone !== "undefined" ? { phone: input.phone } : {}),
          ...(normalizedGender ? { gender: normalizedGender } : {}),
          ...(typeof input.bloodType === "string" ? { bloodType: input.bloodType } : {}),
          ...(typeof input.birthDate === "string"
            ? { birthDate: new Date(input.birthDate) }
            : {}),
          ...(normalizedStatus ? { status: normalizedStatus } : {}),
          ...(typeof input.doctorId === "string" && input.doctorId.trim()
            ? { doctorId: input.doctorId.trim() }
            : {}),
        },
      });

      const nextDoctorId =
        typeof input.doctorId === "string" && input.doctorId.trim()
          ? input.doctorId.trim()
          : null;

      if (nextDoctorId && nextDoctorId !== previousDoctorId) {
        const patientName =
          typeof input.name === "string" && input.name.trim()
            ? input.name.trim()
            : patient.fullName || "مريض جديد";

        await deps.notificationRepository.createSystemNotification({
          userId: nextDoctorId,
          type: "info",
          messageAr: `تم إسناد مريض إليك: ${patientName}.`,
          messageEn: `A patient has been assigned to you: ${patientName}.`,
        });
      }

      const patientWithUser = await deps.adminPatientRepository.getPatientWithUserById(id);
      return (patientWithUser || {}) as unknown as Record<string, unknown>;
    },
  };
}
