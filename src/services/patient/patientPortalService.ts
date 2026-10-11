import { Gender } from "@prisma/client";
import { getMedicalRecordsForPatient } from "../../../lib/prismaQueries";
import {
  createNotificationBestEffort,
  formatDateTimeForLocale,
} from "../../../lib/notifications";
import { prisma } from "../../db/prisma";
import {
  clearNotificationCache,
  getNotificationCache,
  setNotificationCache,
} from "../../../lib/cache/notificationCache";
import { AppError } from "../../lib/errors/appError";
import type { PatientPortalRepository } from "../../repositories/patient/patientPortalRepository";

function toStringOrEmpty(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function normalizeGender(value: unknown): Gender | undefined {
  if (value === "male" || value === "female" || value === "other") {
    return value;
  }
  return undefined;
}

export interface PatientPortalService {
  getUnreadNotificationsCount(userId: string): Promise<number>;
  listNotifications(input: {
    userId: string;
    cursor?: string | null;
    take?: number;
  }): Promise<{ notifications: Array<Record<string, unknown>>; nextCursor?: string }>;
  updateNotifications(input: {
    userId: string;
    id?: string | null;
    isRead?: boolean;
  }): Promise<{ success: true; updated?: Record<string, unknown>; updatedCount?: number }>;
  deleteNotifications(input: {
    userId: string;
    id?: string | null;
  }): Promise<{ success: true; deletedCount?: number }>;
  getDashboardStats(userId: string): Promise<{
    upcomingAppointments: number;
    totalReports: number;
    readyReports: number;
    pendingReports: number;
    newMessages: number;
    clinicalStatus: string | null;
  }>;
  getProfile(userId: string): Promise<{ profile: Record<string, unknown> }>;
  updateProfile(input: {
    userId: string;
    body: Record<string, unknown>;
  }): Promise<{ profile: Record<string, unknown> }>;
  listResults(userId: string): Promise<{ records: Array<Record<string, unknown>> }>;
  listAppointments(userId: string): Promise<{ appointments: Array<Record<string, unknown>> }>;
  createAppointment(input: {
    userId: string;
    doctorId?: string;
    scheduledAt?: string;
    reason?: string;
    location?: string;
    phone?: string;
  }): Promise<{ appointment: Record<string, unknown> }>;
  patchAppointment(input: {
    userId: string;
    appointmentId: string;
    action?: string;
    patientReason?: string;
    reason?: string;
  }): Promise<{ appointment: Record<string, unknown> }>;
  deleteAppointment(input: {
    userId: string;
    appointmentId: string;
  }): Promise<{ appointment: Record<string, unknown> }>;
}

export function createPatientPortalService(deps: {
  patientPortalRepository: PatientPortalRepository;
}): PatientPortalService {
  return {
    async getUnreadNotificationsCount(userId) {
      const cached = await getNotificationCache(userId);
      if (typeof cached === "number") return cached;

      const unread = await deps.patientPortalRepository.countUnreadNotifications(userId);
      setNotificationCache(userId, unread);
      return unread;
    },

    async listNotifications(input) {
      const take = Math.min(Number(input.take) || 20, 100);
      const notifications = await deps.patientPortalRepository.listNotifications({
        userId: input.userId,
        cursor: input.cursor || null,
        take,
      });

      let nextCursor: string | undefined;
      let sliced = notifications;
      if (notifications.length > take) {
        const cursorValue = notifications[take]?.id;
        if (typeof cursorValue === "string") nextCursor = cursorValue;
        sliced = notifications.slice(0, take);
      }

      return { notifications: sliced, ...(nextCursor ? { nextCursor } : {}) };
    },

    async updateNotifications(input) {
      const id = input.id ? String(input.id).trim() : "";

      if (id) {
        const existing = await deps.patientPortalRepository.findNotificationById(id);
        if (!existing || existing.userId !== input.userId) {
          throw new AppError({
            code: "not_found",
            message: "not_found",
            statusCode: 404,
          });
        }

        const isRead =
          typeof input.isRead === "boolean" ? input.isRead : Boolean(existing.isRead);

        const updated = await deps.patientPortalRepository.updateNotificationRead({
          id,
          isRead,
          readAt: isRead ? new Date() : null,
        });

        clearNotificationCache(input.userId);
        return { success: true as const, updated };
      }

      const updatedCount = await deps.patientPortalRepository.markAllNotificationsRead(
        input.userId,
      );
      clearNotificationCache(input.userId);
      return { success: true as const, updatedCount };
    },

    async deleteNotifications(input) {
      const id = input.id ? String(input.id).trim() : "";

      if (id) {
        const existing = await deps.patientPortalRepository.findNotificationById(id);
        if (!existing || existing.userId !== input.userId) {
          throw new AppError({
            code: "not_found",
            message: "not_found",
            statusCode: 404,
          });
        }

        await deps.patientPortalRepository.softDeleteNotificationById(id);
        clearNotificationCache(input.userId);
        return { success: true as const };
      }

      const deletedCount = await deps.patientPortalRepository.softDeleteAllNotifications(
        input.userId,
      );
      clearNotificationCache(input.userId);
      return { success: true as const, deletedCount };
    },

    async getDashboardStats(userId) {
      const patient = await deps.patientPortalRepository.findPatientByUserId(userId);
      if (!patient) {
        throw new AppError({
          code: "not_found",
          message: "Patient not found",
          statusCode: 404,
        });
      }

      const upcomingAppointments = await deps.patientPortalRepository.countUpcomingAppointments(
        patient.id,
      );

      let records: Array<Record<string, unknown>> = [];
      try {
        records = (await getMedicalRecordsForPatient(patient.id)) as Array<Record<string, unknown>>;
      } catch {
        records = await deps.patientPortalRepository.listMedicalRecords(patient.id);
      }

      const totalReports = records.length;
      const readyReports = records.filter(
        (record) => (record as { reviewedByDoctor?: unknown }).reviewedByDoctor === true,
      ).length;
      const pendingReports = totalReports - readyReports;

      const newMessages = await deps.patientPortalRepository.countUnreadDoctorMessages(
        patient.id,
      );

      return {
        upcomingAppointments,
        totalReports,
        readyReports,
        pendingReports,
        newMessages,
        clinicalStatus: (patient.clinicalStatus as string | null) || null,
      };
    },

    async getProfile(userId) {
      const [user, patient] = await Promise.all([
        deps.patientPortalRepository.findUserById(userId),
        deps.patientPortalRepository.findPatientByUserId(userId),
      ]);

      if (!patient) {
        throw new AppError({
          code: "not_found",
          message: "Patient not found",
          statusCode: 404,
        });
      }

      const profile: Record<string, unknown> = {
        id: patient.id,
        userId: patient.userId,
        fullName: patient.fullName || user?.fullName || "",
        email: patient.email || user?.email || "",
        phone: patient.phone || "",
        doctorId: patient.doctorId || "",
        birthDate: patient.birthDate
          ? patient.birthDate.toISOString().split("T")[0]
          : "",
        gender: patient.gender || "",
        bloodType: patient.bloodType || "",
        notes: patient.notes || "",
        joinDate: patient.joinDate,
        clinicalStatus: (patient.clinicalStatus as string | null) || (patient.status as string | null) || null,
        notificationSettings: {
          emailNotifications: true,
          smsNotifications: true,
          pushNotifications: true,
          appointmentReminders: true,
          reportUpdates: true,
          medicationReminders: true,
          healthTips: false,
        },
        createdAt: patient.createdAt,
        updatedAt: patient.updatedAt,
      };

      try {
        const activity = await deps.patientPortalRepository.findNotificationSettingsActivity(userId);
        if (activity?.meta && typeof activity.meta === "object") {
          profile.notificationSettings = activity.meta as Record<string, unknown>;
        }
      } catch {
      }

      try {
        if (patient.doctorId) {
          const doctorUser = await deps.patientPortalRepository.findDoctorUser(patient.doctorId);
          if (doctorUser) {
            profile.doctor = {
              id: doctorUser.id,
              fullName: doctorUser.fullName || "",
              email: doctorUser.email || "",
            };
          }
        }
      } catch {
      }

      return { profile };
    },

    async updateProfile(input) {
      const patient = await deps.patientPortalRepository.findPatientByUserId(input.userId);
      if (!patient) {
        throw new AppError({
          code: "not_found",
          message: "Patient not found",
          statusCode: 404,
        });
      }

      const body = input.body || {};
      const updateData: Record<string, unknown> = {};

      if (typeof body.fullName === "string") updateData.fullName = body.fullName;
      if (typeof body.email === "string") updateData.email = body.email;
      if (typeof body.phone === "string") updateData.phone = body.phone;
      if (typeof body.birthDate === "string" && body.birthDate) {
        updateData.birthDate = new Date(body.birthDate);
      }

      const normalizedGender = normalizeGender(body.gender);
      if (normalizedGender) updateData.gender = normalizedGender;
      if (typeof body.bloodType === "string") updateData.bloodType = body.bloodType;
      if (typeof body.notes === "string") updateData.notes = body.notes;

      const updated = await deps.patientPortalRepository.updatePatientProfile(
        patient.id,
        updateData,
      );

      if (body.fullName || body.email) {
        const userUpdate: Record<string, unknown> = {};
        if (typeof body.fullName === "string") userUpdate.fullName = body.fullName;
        if (typeof body.email === "string") userUpdate.email = body.email;

        try {
          await deps.patientPortalRepository.updateUserProfile(
            input.userId,
            userUpdate,
          );
        } catch {
        }
      }

      if (body.notificationSettings && typeof body.notificationSettings === "object") {
        try {
          const existing = await deps.patientPortalRepository.findNotificationSettingsActivity(
            input.userId,
          );

          if (existing) {
            await deps.patientPortalRepository.updateNotificationSettingsActivity(
              existing.id,
              body.notificationSettings as Record<string, unknown>,
            );
          } else {
            await deps.patientPortalRepository.createNotificationSettingsActivity(
              input.userId,
              body.notificationSettings as Record<string, unknown>,
            );
          }
        } catch {
        }
      }

      return {
        profile: {
          ...updated,
          fullName: toStringOrEmpty((updated as { fullName?: unknown }).fullName),
          email: toStringOrEmpty((updated as { email?: unknown }).email),
        } as Record<string, unknown>,
      };
    },

    async listResults(userId) {
      const patient = await deps.patientPortalRepository.findPatientByUserId(userId);
      if (!patient) {
        throw new AppError({
          code: "not_found",
          message: "Patient not found",
          statusCode: 404,
        });
      }

      let records: Array<Record<string, unknown>> = [];
      try {
        records = (await getMedicalRecordsForPatient(patient.id)) as Array<Record<string, unknown>>;
      } catch {
        records = await deps.patientPortalRepository.listMedicalRecordsWithDoctor(patient.id);
      }

      const mapped = (records || []).map((record) => ({
        id: record.id,
        imageUrl: record.imageUrl || null,
        aiResult: record.aiResult || null,
        confidenceScore: record.confidenceScore || null,
        reviewedByDoctor: Boolean(record.reviewedByDoctor),
        doctorNotes: record.doctorNotes || null,
        createdAt: record.createdAt,
        clinicalStatus: (patient.clinicalStatus as string | null) || "stable",
        doctor:
          record.doctor && (record.doctor as { user?: Record<string, unknown>; userId?: string; clinic?: string }).user
            ? {
                id: (record.doctor as { userId?: string }).userId || null,
                name:
                  ((record.doctor as { user?: Record<string, unknown> }).user || {})
                    .fullName || null,
                clinic: (record.doctor as { clinic?: string }).clinic || null,
              }
            : null,
      }));

      return { records: mapped };
    },

    async listAppointments(userId) {
      const patient = await deps.patientPortalRepository.findPatientByUserId(userId);
      if (!patient) {
        throw new AppError({
          code: "not_found",
          message: "Patient not found",
          statusCode: 404,
        });
      }

      const appointments = await deps.patientPortalRepository.listAppointmentsForPatient(patient.id);
      const out = appointments.map((appointment) => ({
        id: appointment.id,
        patient: appointment.patient
          ? {
              id: (appointment.patient as { id?: string }).id || null,
              name: (appointment.patient as { fullName?: string }).fullName || null,
              phone: (appointment.patient as { phone?: string }).phone || null,
            }
          : null,
        doctor: appointment.doctor
          ? {
              id: (appointment.doctor as { userId?: string }).userId || null,
              name:
                ((appointment.doctor as { user?: Record<string, unknown> }).user || {})
                  .fullName || null,
              phone: (appointment.doctor as { phone?: string }).phone || null,
              user: (appointment.doctor as { user?: Record<string, unknown> }).user || null,
              clinic: (appointment.doctor as { clinic?: string }).clinic || null,
            }
          : null,
        doctorId: appointment.doctorId,
        scheduledAt: appointment.scheduledAt,
        status: appointment.status,
        reason: appointment.reason,
        type: appointment.type || "clinic",
        location:
          appointment.location ||
          ((appointment.doctor as { clinic?: string } | undefined)?.clinic || null),
        createdAt: appointment.createdAt,
      }));

      return { appointments: out };
    },

    async createAppointment(input) {
      const doctorId = String(input.doctorId || "").trim();
      const scheduledAt = String(input.scheduledAt || "").trim();

      if (!doctorId || !scheduledAt) {
        throw new AppError({
          code: "validation_error",
          message: "Missing fields",
          statusCode: 400,
        });
      }

      const patient = await deps.patientPortalRepository.findPatientByUserId(input.userId);
      if (!patient) {
        throw new AppError({
          code: "not_found",
          message: "Patient not found",
          statusCode: 404,
        });
      }

      const scheduledDate = new Date(scheduledAt);
      const doctor = await deps.patientPortalRepository.findDoctorByUserId(doctorId);
      const doctorName = doctor?.user?.fullName || null;

      let created: Record<string, unknown>;
      try {
        created = await deps.patientPortalRepository.createAppointment({
          doctorId,
          patientId: patient.id,
          scheduledAt: scheduledDate,
          reason: input.reason || null,
          location: input.location || null,
          phone: input.phone || null,
        });
      } catch (error) {
        const appError = error as AppError & {
          cause?: { code?: string };
        };

        if (appError?.cause?.code === "P2002") {
          throw new AppError({
            code: "conflict",
            message: "Appointment conflict",
            statusCode: 409,
          });
        }

        throw error;
      }

      await createNotificationBestEffort(prisma, {
        userId: input.userId,
        type: "info",
        message: {
          ar: `تم حجز موعد${doctorName ? ` مع د. ${doctorName}` : ""} بتاريخ ${formatDateTimeForLocale(scheduledDate, "ar")}.`,
          en: `Your appointment${doctorName ? ` with Dr. ${doctorName}` : ""} was booked for ${formatDateTimeForLocale(scheduledDate, "en")}.`,
        },
      });

      const patientName = patient?.fullName || null;
      await createNotificationBestEffort(prisma, {
        userId: doctorId,
        type: "info",
        message: {
          ar: `تم حجز موعد جديد من${patientName ? ` المريض ${patientName}` : " أحد المرضى"} بتاريخ ${formatDateTimeForLocale(scheduledDate, "ar")}.`,
          en: `A new appointment was booked by${patientName ? ` ${patientName}` : " a patient"} for ${formatDateTimeForLocale(scheduledDate, "en")}.`,
        },
      });

      return { appointment: created };
    },

    async patchAppointment(input) {
      const action = String(input.action || "").trim();
      if (!input.appointmentId || !action) {
        throw new AppError({
          code: "validation_error",
          message: "Missing parameters",
          statusCode: 400,
        });
      }

      const patient = await deps.patientPortalRepository.findPatientByUserId(input.userId);
      if (!patient) {
        throw new AppError({
          code: "not_found",
          message: "Patient not found",
          statusCode: 404,
        });
      }

      const appointment = await deps.patientPortalRepository.findAppointmentById(
        input.appointmentId,
      );
      if (!appointment || appointment.patientId !== patient.id) {
        throw new AppError({
          code: "not_found",
          message: "Appointment not found or unauthorized",
          statusCode: 404,
        });
      }

      if (action === "confirm" || action === "confirmed") {
        const updated = await deps.patientPortalRepository.updateAppointmentById(
          input.appointmentId,
          { status: "completed" },
        );

        await createNotificationBestEffort(prisma, {
          userId: input.userId,
          type: "success",
          message: {
            ar: `تم تأكيد إتمام الموعد بتاريخ ${formatDateTimeForLocale(appointment.scheduledAt, "ar")}.`,
            en: `Your appointment on ${formatDateTimeForLocale(appointment.scheduledAt, "en")} was marked as completed.`,
          },
        });

        if (appointment.doctorId) {
          const patientName = patient?.fullName || null;
          await createNotificationBestEffort(prisma, {
            userId: appointment.doctorId,
            type: "success",
            message: {
              ar: `أكد${patientName ? ` المريض ${patientName}` : " المريض"} إتمام الموعد بتاريخ ${formatDateTimeForLocale(appointment.scheduledAt, "ar")}.`,
              en: `${patientName ? `Patient ${patientName}` : "A patient"} confirmed completion for the appointment on ${formatDateTimeForLocale(appointment.scheduledAt, "en")}.`,
            },
          });
        }

        return { appointment: updated };
      }

      if (action === "cancel" || action === "cancelled") {
        const patientReason = String(input.patientReason || input.reason || "").trim();
        if (!patientReason) {
          throw new AppError({
            code: "validation_error",
            message: "سبب الإلغاء مطلوب",
            statusCode: 400,
          });
        }

        const updated = await deps.patientPortalRepository.updateAppointmentById(
          input.appointmentId,
          { status: "cancelled", patientReason },
        );

        await createNotificationBestEffort(prisma, {
          userId: input.userId,
          type: "warning",
          message: {
            ar: `تم إلغاء الموعد بتاريخ ${formatDateTimeForLocale(appointment.scheduledAt, "ar")}.`,
            en: `Your appointment on ${formatDateTimeForLocale(appointment.scheduledAt, "en")} was cancelled.`,
          },
        });

        if (appointment.doctorId) {
          const patientName = patient?.fullName || null;
          await createNotificationBestEffort(prisma, {
            userId: appointment.doctorId,
            type: "warning",
            message: {
              ar: `ألغى${patientName ? ` المريض ${patientName}` : " المريض"} الموعد بتاريخ ${formatDateTimeForLocale(appointment.scheduledAt, "ar")}.${patientReason ? ` السبب: ${patientReason}` : ""}`,
              en: `${patientName ? `Patient ${patientName}` : "A patient"} cancelled the appointment on ${formatDateTimeForLocale(appointment.scheduledAt, "en")}.${patientReason ? ` Reason: ${patientReason}` : ""}`,
            },
          });
        }

        return { appointment: updated };
      }

      if (action === "delete" || action === "remove") {
        const updated = await deps.patientPortalRepository.updateAppointmentById(
          input.appointmentId,
          { isDeleted: true },
        );

        await createNotificationBestEffort(prisma, {
          userId: input.userId,
          type: "info",
          message: {
            ar: `تم حذف الموعد بتاريخ ${formatDateTimeForLocale(appointment.scheduledAt, "ar")}.`,
            en: `Your appointment on ${formatDateTimeForLocale(appointment.scheduledAt, "en")} was removed.`,
          },
        });

        if (appointment.doctorId) {
          const patientName = patient?.fullName || null;
          await createNotificationBestEffort(prisma, {
            userId: appointment.doctorId,
            type: "info",
            message: {
              ar: `حذف${patientName ? ` المريض ${patientName}` : " المريض"} الموعد بتاريخ ${formatDateTimeForLocale(appointment.scheduledAt, "ar")}.`,
              en: `${patientName ? `Patient ${patientName}` : "A patient"} removed the appointment on ${formatDateTimeForLocale(appointment.scheduledAt, "en")}.`,
            },
          });
        }

        return { appointment: updated };
      }

      throw new AppError({
        code: "validation_error",
        message: "Unknown action",
        statusCode: 400,
      });
    },

    async deleteAppointment(input) {
      if (!input.appointmentId) {
        throw new AppError({
          code: "validation_error",
          message: "Missing id",
          statusCode: 400,
        });
      }

      const patient = await deps.patientPortalRepository.findPatientByUserId(input.userId);
      if (!patient) {
        throw new AppError({
          code: "not_found",
          message: "Patient not found",
          statusCode: 404,
        });
      }

      const appointment = await deps.patientPortalRepository.findAppointmentById(
        input.appointmentId,
      );
      if (!appointment || appointment.patientId !== patient.id) {
        throw new AppError({
          code: "not_found",
          message: "Appointment not found or unauthorized",
          statusCode: 404,
        });
      }

      const updated = await deps.patientPortalRepository.updateAppointmentById(
        input.appointmentId,
        { isDeleted: true },
      );

      return { appointment: updated };
    },
  };
}
