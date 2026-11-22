import { Gender } from "@prisma/client";
import { getMedicalRecordsForPatient } from "../../legacy-lib/prismaQueries";
import {
  createNotificationBestEffort,
  formatDateTimeForLocale,
} from "../../legacy-lib/notifications";
import { prisma } from "../../db/prisma";
import {
  clearNotificationCache,
  getNotificationCache,
  setNotificationCache,
} from "../../legacy-lib/cache/notificationCache";
import { AppError } from "../../lib/errors/appError";
import type { PatientPortalRepository } from "../../repositories/patient/patientPortalRepository";
import { createAdminSettingsRepository, type AdminSettingsRepository } from "../../repositories/admin/adminSettingsRepository";
import {
  computeCanonicalReviewStatus,
  normalizeUploadStorageReference,
} from "../analysis/analysisBackfillService";
import { buildSignedUploadAccessUrl } from "../analysis/analysisService";

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
    body?: Record<string, unknown>;
    [key: string]: unknown;
  }): Promise<{ profile: Record<string, unknown> }>;
  listResults(userId: string): Promise<{ records: Array<Record<string, unknown>> }>;
  listAppointments(userId: string): Promise<{ appointments: Array<Record<string, unknown>> }>;
  createAppointment(input: {
    userId: string;
    doctorId?: string;
    scheduledAt?: string;
    type?: string;
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
  adminSettingsRepository?: AdminSettingsRepository;
}): PatientPortalService {
  const settingsRepo = deps.adminSettingsRepository ?? createAdminSettingsRepository();
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

      const body: Record<string, unknown> =
        input.body && typeof input.body === "object"
          ? (input.body as Record<string, unknown>)
          : (input as Record<string, unknown>);
      const updateData: Record<string, unknown> = {};
      const userUpdate: Record<string, unknown> = {};

      if (typeof body.fullName === "string") {
        const trimmedName = body.fullName.trim();
        if (!trimmedName) {
          throw new AppError({
            code: "validation_error",
            message: "الاسم الكامل مطلوب",
            statusCode: 400,
          });
        }
        updateData.fullName = trimmedName;
        userUpdate.fullName = trimmedName;
      }

      if (typeof body.email === "string") {
        const trimmedEmail = body.email.trim();
        if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
          throw new AppError({
            code: "validation_error",
            message: "البريد الإلكتروني غير صالح",
            statusCode: 400,
          });
        }
        updateData.email = trimmedEmail;
        userUpdate.email = trimmedEmail;
      }

      if (typeof body.phone === "string") updateData.phone = body.phone.trim();
      if (typeof body.birthDate === "string") {
        if (body.birthDate.trim()) {
          const parsedBirth = new Date(body.birthDate);
          if (Number.isNaN(parsedBirth.getTime())) {
            throw new AppError({
              code: "validation_error",
              message: "تاريخ الميلاد غير صالح",
              statusCode: 400,
            });
          }
          updateData.birthDate = parsedBirth;
        } else {
          updateData.birthDate = null;
        }
      }

      const normalizedGender = normalizeGender(body.gender);
      if (normalizedGender) updateData.gender = normalizedGender;
      else if (body.gender === "") updateData.gender = null;

      if (typeof body.bloodType === "string") updateData.bloodType = body.bloodType.trim();
      if (typeof body.notes === "string") updateData.notes = body.notes;

      let updated: Record<string, unknown>;
      if (typeof deps.patientPortalRepository.updatePatientAndUserProfile === "function") {
        updated = (await deps.patientPortalRepository.updatePatientAndUserProfile({
          patientId: patient.id,
          userId: input.userId,
          patientData: updateData,
          userData: userUpdate,
        })) as unknown as Record<string, unknown>;
      } else {
        updated = (await deps.patientPortalRepository.updatePatientProfile(
          patient.id,
          updateData,
        )) as unknown as Record<string, unknown>;
        if (Object.keys(userUpdate).length > 0) {
          await deps.patientPortalRepository.updateUserProfile(
            input.userId,
            userUpdate,
          );
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
          birthDate:
            updated.birthDate instanceof Date
              ? updated.birthDate.toISOString().split("T")[0]
              : typeof updated.birthDate === "string"
                ? updated.birthDate.split("T")[0]
                : "",
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

      const mapped = (records || []).map((record) => {
        const analysis = (record.analysisResult as Record<string, unknown> | null | undefined) || null;
        const reviewed = Boolean(record.reviewedByDoctor);
        const needsReview = Boolean(analysis?.needsReview);
        const reviewStatus = computeCanonicalReviewStatus({
          reviewedByDoctor: reviewed,
          needsReview,
        });
        const rawImageUrl = (record.imageUrl as string | null) || null;

        return {
          id: record.id,
          analysisResultId: record.analysisResultId || analysis?.id || null,
          imageUrl: buildSignedUploadAccessUrl(rawImageUrl),
          storageImageUrl: rawImageUrl ? normalizeUploadStorageReference(rawImageUrl) : null,
          heatmapUrl: (analysis?.heatmapUrl as string | null) || null,
          aiResult: record.aiResult || null,
          confidenceScore: record.confidenceScore ?? null,
          probabilities: analysis?.probabilities ?? null,
          needsReview,
          reviewStatus,
          status: reviewStatus,
          reviewedByDoctor: reviewed,
          doctorNotes: record.doctorNotes || null,
          uploadNotes: record.uploadNotes || (analysis?.uploadNotes as string | null) || null,
          explanation: (analysis?.explanation as string | null) || null,
          modelVersion: (analysis?.modelVersion as string | null) || null,
          inferenceTimeMs: (analysis?.inferenceTimeMs as number | null) ?? null,
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
        };
      });

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
        patientReason: appointment.patientReason || null,
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

      const scheduledDate = new Date(scheduledAt);
      if (Number.isNaN(scheduledDate.getTime())) {
        throw new AppError({
          code: "validation_error",
          message: "تاريخ أو وقت الموعد غير صالح",
          statusCode: 400,
        });
      }

      if (scheduledDate.getTime() < Date.now() - 60_000) {
        throw new AppError({
          code: "validation_error",
          message: "لا يمكن حجز موعد في وقت سابق",
          statusCode: 400,
        });
      }

      const settings = await settingsRepo.readSettings().catch(() => null);
      const intervalMinutes = Number(settings?.appointmentInterval);
      if (
        Number.isFinite(intervalMinutes) &&
        intervalMinutes > 1 &&
        [15, 30, 45, 60].includes(intervalMinutes)
      ) {
        const mins = scheduledDate.getUTCMinutes();
        if (mins % intervalMinutes !== 0) {
          throw new AppError({
            code: "validation_error",
            message: `يجب أن يكون وقت الموعد بمضاعفات ${intervalMinutes} دقيقة`,
            statusCode: 400,
          });
        }
      }

      const patient = await deps.patientPortalRepository.findPatientByUserId(input.userId);
      if (!patient) {
        throw new AppError({
          code: "not_found",
          message: "Patient not found",
          statusCode: 404,
        });
      }

      const doctor = await deps.patientPortalRepository.findDoctorByUserId(doctorId);
      if (!doctor) {
        throw new AppError({
          code: "not_found",
          message: "الطبيب المحدد غير موجود",
          statusCode: 404,
        });
      }
      const doctorStatus = (doctor as { status?: string }).status;
      if (doctorStatus && doctorStatus !== "active") {
        throw new AppError({
          code: "validation_error",
          message: "الطبيب المحدد غير متاح لاستقبال المواعيد حالياً",
          statusCode: 400,
        });
      }
      const doctorName = doctor?.user?.fullName || null;
      const doctorClinic = (doctor as { clinic?: string | null })?.clinic || null;

      if (typeof input.phone === "string" && input.phone.trim() && input.phone.trim() !== patient.phone) {
        await deps.patientPortalRepository
          .updatePatientProfile(patient.id, { phone: input.phone.trim() })
          .catch(() => undefined);
      }

      const normalizedType = input.type === "online" ? "online" : "clinic";
      const locationValue =
        (typeof input.location === "string" && input.location.trim()) ||
        (normalizedType === "online" ? "عن بعد" : doctorClinic) ||
        null;

      let created: Record<string, unknown>;
      try {
        created = await deps.patientPortalRepository.createAppointment({
          doctorId,
          patientId: patient.id,
          scheduledAt: scheduledDate,
          type: normalizedType,
          reason: input.reason || null,
          location: locationValue,
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
