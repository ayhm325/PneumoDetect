import { createNotificationBestEffort, formatDateTimeForLocale } from "../../../lib/notifications";
import { clearNotificationCache, getNotificationCache, setNotificationCache } from "../../../lib/cache/notificationCache";
import { prisma } from "../../db/prisma";
import { AppError } from "../../lib/errors/appError";
import type { DoctorPortalRepository } from "../../repositories/doctor/doctorPortalRepository";

export interface DoctorPortalService {
  listAppointments(userId: string): Promise<{ appointments: Array<Record<string, unknown>> }>;
  createAppointment(input: {
    userId: string;
    patientId?: string;
    scheduledAt?: string;
    reason?: string;
    location?: string;
    type?: string;
  }): Promise<{ appointment: Record<string, unknown> }>;
  patchAppointment(input: {
    userId: string;
    id: string;
    action?: string;
    scheduledAt?: string;
    newScheduledAt?: string;
  }): Promise<{ appointment: Record<string, unknown> }>;
  deleteAppointment(input: { userId: string; id: string }): Promise<{ success: true }>;

  listPatients(userId: string): Promise<Array<Record<string, unknown>>>;
  listResults(input: { userId: string; patientId?: string }): Promise<{ records: Array<Record<string, unknown>> }>;
  updateResult(input: {
    userId: string;
    id?: string;
    reviewedByDoctor?: boolean;
    doctorNotes?: string | null;
    clinicalStatus?: string | null;
  }): Promise<{ record: Record<string, unknown> | null }>;

  getUnreadNotificationsCount(userId: string): Promise<number>;
  listNotifications(input: { userId: string; cursor?: string | null; take?: number }): Promise<{ notifications: Array<Record<string, unknown>>; nextCursor?: string }>;
  updateNotifications(input: { userId: string; id?: string | null; isRead?: boolean }): Promise<{ success: true; updated?: Record<string, unknown>; updatedCount?: number }>;
  deleteNotifications(input: { userId: string; id?: string | null }): Promise<{ success: true; deletedCount?: number }>;
  getMyProfile(userId: string): Promise<{ profile: Record<string, unknown> }>;
  listDoctors(input: { includePending: boolean }): Promise<{ doctors: Array<Record<string, unknown>> }>;
}

export function createDoctorPortalService(deps: {
  doctorPortalRepository: DoctorPortalRepository;
}): DoctorPortalService {
  return {
    async listAppointments(userId) {
      const appointments = await deps.doctorPortalRepository.listAppointments(userId);
      const out = appointments.map((appointment) => ({
        id: appointment.id,
        patient: appointment.patient
          ? {
              id: (appointment.patient as { id?: string }).id,
              name: (appointment.patient as { fullName?: string }).fullName,
              email: (appointment.patient as { email?: string }).email,
              phone: (appointment.patient as { phone?: string }).phone || null,
            }
          : null,
        doctor: appointment.doctor
          ? {
              id: (appointment.doctor as { userId?: string }).userId,
              name:
                ((appointment.doctor as { user?: Record<string, unknown> }).user || {})
                  .fullName || null,
              phone: (appointment.doctor as { phone?: string }).phone || null,
            }
          : null,
        scheduledAt: appointment.scheduledAt,
        status: appointment.status,
        reason: appointment.reason,
        patientReason: appointment.patientReason,
        createdAt: appointment.createdAt,
        type: appointment.type || "clinic",
        location: appointment.location || null,
      }));

      return { appointments: out };
    },

    async createAppointment(input) {
      const patientId = String(input.patientId || "").trim();
      const scheduledAt = String(input.scheduledAt || "").trim();
      if (!patientId || !scheduledAt) {
        throw new AppError({ code: "validation_error", message: "Missing required fields", statusCode: 400 });
      }

      const scheduled = new Date(scheduledAt);
      if (Number.isNaN(scheduled.getTime())) {
        throw new AppError({ code: "validation_error", message: "Invalid date", statusCode: 400 });
      }

      const patient = await deps.doctorPortalRepository.findPatientById(patientId);
      if (!patient) {
        throw new AppError({ code: "not_found", message: "Patient not found", statusCode: 404 });
      }

      let locationValue: string | null = null;
      if (input.type === "online") {
        locationValue = "عن بعد";
      } else {
        const doctorProfile = await deps.doctorPortalRepository.findDoctorProfile(input.userId);
        locationValue = input.location || doctorProfile?.clinic || null;
      }

      const created = await deps.doctorPortalRepository.createAppointment({
        doctorId: input.userId,
        patientId,
        scheduledAt: scheduled,
        reason: input.reason || null,
        location: locationValue,
        type: input.type || "clinic",
      });

      try {
        const doctorName = await deps.doctorPortalRepository.findDoctorUserName(input.userId);
        const patientUserId = patient?.userId || null;

        if (patientUserId) {
          await createNotificationBestEffort(prisma, {
            userId: patientUserId,
            type: "info",
            message: {
              ar: `تم تحديد موعد لك${doctorName ? ` مع د. ${doctorName}` : ""} بتاريخ ${formatDateTimeForLocale(scheduled, "ar")}.`,
              en: `An appointment${doctorName ? ` with Dr. ${doctorName}` : ""} was scheduled for ${formatDateTimeForLocale(scheduled, "en")}.`,
            },
          });
        }
      } catch {
      }

      return { appointment: created };
    },

    async patchAppointment(input) {
      const id = String(input.id || "").trim();
      const action = String(input.action || "").trim();
      if (!id) throw new AppError({ code: "validation_error", message: "Missing id", statusCode: 400 });
      if (!action) throw new AppError({ code: "validation_error", message: "Missing action", statusCode: 400 });

      const appointment = await deps.doctorPortalRepository.findAppointmentWithPatient(id);
      if (!appointment || appointment.doctorId !== input.userId) {
        throw new AppError({ code: "not_found", message: "Appointment not found or unauthorized", statusCode: 404 });
      }

      let updated: Record<string, unknown>;

      if (action === "cancel" || action === "cancelled") {
        updated = await deps.doctorPortalRepository.updateAppointment(id, { status: "cancelled" });
        const patientUserId = appointment?.patient?.userId || null;
        if (patientUserId) {
          await createNotificationBestEffort(prisma, {
            userId: patientUserId,
            type: "warning",
            message: {
              ar: `تم إلغاء الموعد من قبل الطبيب بتاريخ ${formatDateTimeForLocale(appointment.scheduledAt, "ar")}.`,
              en: `Your appointment on ${formatDateTimeForLocale(appointment.scheduledAt, "en")} was cancelled by the doctor.`,
            },
          });
        }
      } else if (["confirm", "confirmed", "complete", "completed"].includes(action)) {
        updated = await deps.doctorPortalRepository.updateAppointment(id, { status: "completed" });
        const patientUserId = appointment?.patient?.userId || null;
        if (patientUserId) {
          await createNotificationBestEffort(prisma, {
            userId: patientUserId,
            type: "success",
            message: {
              ar: `تم تأكيد إتمام الموعد بتاريخ ${formatDateTimeForLocale(appointment.scheduledAt, "ar")}.`,
              en: `Your appointment on ${formatDateTimeForLocale(appointment.scheduledAt, "en")} was marked as completed by the doctor.`,
            },
          });
        }
      } else if (action === "reschedule") {
        const nextDateRaw = input.scheduledAt || input.newScheduledAt || "";
        if (!nextDateRaw) throw new AppError({ code: "validation_error", message: "Missing scheduledAt", statusCode: 400 });
        const nextDate = new Date(nextDateRaw);
        if (Number.isNaN(nextDate.getTime())) throw new AppError({ code: "validation_error", message: "Invalid scheduledAt", statusCode: 400 });

        updated = await deps.doctorPortalRepository.updateAppointment(id, {
          scheduledAt: nextDate,
          status: "scheduled",
        });
        const patientUserId = appointment?.patient?.userId || null;
        if (patientUserId) {
          await createNotificationBestEffort(prisma, {
            userId: patientUserId,
            type: "info",
            message: {
              ar: `تم تعديل موعدك إلى ${formatDateTimeForLocale(nextDate, "ar")}.`,
              en: `Your appointment was rescheduled to ${formatDateTimeForLocale(nextDate, "en")}.`,
            },
          });
        }
      } else {
        throw new AppError({ code: "validation_error", message: "Unknown action", statusCode: 400 });
      }

      return { appointment: updated };
    },

    async deleteAppointment(input) {
      const id = String(input.id || "").trim();
      if (!id) throw new AppError({ code: "validation_error", message: "Missing id", statusCode: 400 });

      const appointment = await deps.doctorPortalRepository.findAppointmentWithPatient(id);
      if (!appointment || appointment.doctorId !== input.userId) {
        throw new AppError({ code: "not_found", message: "Appointment not found or unauthorized", statusCode: 404 });
      }

      await deps.doctorPortalRepository.softDeleteAppointment(id);

      const patientUserId = appointment?.patient?.userId || null;
      if (patientUserId) {
        await createNotificationBestEffort(prisma, {
          userId: patientUserId,
          type: "warning",
          message: {
            ar: `تم إلغاء الموعد من قبل الطبيب بتاريخ ${formatDateTimeForLocale(appointment.scheduledAt, "ar")}.`,
            en: `Your appointment on ${formatDateTimeForLocale(appointment.scheduledAt, "en")} was cancelled by the doctor.`,
          },
        });
      }

      return { success: true };
    },

    async listPatients(userId) {
      const patients = await deps.doctorPortalRepository.listActivePatientsForDoctor(userId);
      return patients.map((patient) => {
        const medicalRecords = (patient.medicalRecords as Array<Record<string, unknown>> | undefined) || [];
        const latest = medicalRecords[0] || null;
        const latestDoctorDiagnosis = latest?.doctorNotes ? String(latest.doctorNotes) : "";
        const diagnosisUpdatedAt = latest?.createdAt || null;
        const medicalRecordsCount = medicalRecords.length;

        const { medicalRecords: _records, ...rest } = patient;
        return {
          ...rest,
          latestDoctorDiagnosis,
          diagnosisUpdatedAt,
          medicalRecordsCount,
        };
      });
    },

    async listResults(input) {
      const records = await deps.doctorPortalRepository.listDoctorMedicalRecords({
        doctorId: input.userId,
        ...(input.patientId ? { patientId: input.patientId } : {}),
      });

      const out = records.map((record) => ({
        id: record.id,
        title: record.title || "Chest X-Ray",
        imageUrl: record.imageUrl || null,
        aiResult: record.aiResult || null,
        confidenceScore: record.confidenceScore || null,
        reviewedByDoctor: Boolean(record.reviewedByDoctor),
        doctorNotes: record.doctorNotes || null,
        createdAt: record.createdAt,
        patient: record.patient
          ? {
              id: (record.patient as { id?: string }).id,
              name: (record.patient as { fullName?: string }).fullName,
              email: (record.patient as { email?: string }).email,
              clinicalStatus: (record.patient as { clinicalStatus?: string }).clinicalStatus || null,
            }
          : null,
        patientClinicalStatus:
          ((record.patient as { clinicalStatus?: string } | undefined)?.clinicalStatus) || null,
        doctor:
          (record.doctor as { user?: Record<string, unknown>; userId?: string } | undefined)
            ?.user
            ? {
                id: (record.doctor as { userId?: string }).userId,
                name: ((record.doctor as { user?: Record<string, unknown> }).user || {})
                  .fullName || null,
              }
            : null,
      }));

      return { records: out };
    },

    async updateResult(input) {
      const id = String(input.id || "").trim();
      if (!id) throw new AppError({ code: "validation_error", message: "missing_id", statusCode: 400 });

      const before = await deps.doctorPortalRepository.findDoctorMedicalRecord({ id, doctorId: input.userId });
      if (!before) {
        throw new AppError({ code: "not_found", message: "not_found", statusCode: 404 });
      }

      const reviewedByDoctor =
        typeof input.reviewedByDoctor === "boolean" ? input.reviewedByDoctor : true;
      const doctorNotesRaw = input.doctorNotes;
      const doctorNotes = doctorNotesRaw == null ? null : String(doctorNotesRaw).trim();

      const clinicalStatusRaw = input?.clinicalStatus;
      const clinicalStatus =
        clinicalStatusRaw == null ? null : String(clinicalStatusRaw).trim();
      const allowedClinical = new Set(["stable", "critical", "recovering"]);
      if (clinicalStatus && !allowedClinical.has(clinicalStatus)) {
        throw new AppError({ code: "validation_error", message: "invalid_clinical_status", statusCode: 400 });
      }

      const count = await deps.doctorPortalRepository.updateDoctorMedicalRecord({
        id,
        doctorId: input.userId,
        reviewedByDoctor,
        doctorNotes,
        ...(clinicalStatus
          ? { clinicalStatus: clinicalStatus as "stable" | "critical" | "recovering" }
          : {}),
      });

      if (count === 0) {
        throw new AppError({ code: "not_found", message: "not_found", statusCode: 404 });
      }

      try {
        const patientUserId = before?.patient?.userId || null;
        const patientName = before?.patient?.fullName || null;
        const prevReviewed = Boolean(before.reviewedByDoctor);
        const prevNotes = (before.doctorNotes || "").trim();
        const nextReviewed = Boolean(reviewedByDoctor);
        const nextNotes = (doctorNotes || "").trim();

        const didBecomeReviewed = !prevReviewed && nextReviewed;
        const didAddOrChangeNotes = Boolean(nextNotes) && nextNotes !== prevNotes;

        if (patientUserId && (didBecomeReviewed || didAddOrChangeNotes)) {
          const arMsg =
            didBecomeReviewed && didAddOrChangeNotes
              ? `قام الطبيب بمراجعة نتيجتك وأضاف ملاحظات جديدة.${patientName ? ` (${patientName})` : ""}`
              : didAddOrChangeNotes
                ? `قام الطبيب بإضافة ملاحظات جديدة على نتيجتك.${patientName ? ` (${patientName})` : ""}`
                : `قام الطبيب بمراجعة نتيجتك.${patientName ? ` (${patientName})` : ""}`;

          const enMsg =
            didBecomeReviewed && didAddOrChangeNotes
              ? `Your doctor reviewed your result and added new notes.${patientName ? ` (${patientName})` : ""}`
              : didAddOrChangeNotes
                ? `Your doctor added new notes to your result.${patientName ? ` (${patientName})` : ""}`
                : `Your doctor reviewed your result.${patientName ? ` (${patientName})` : ""}`;

          await createNotificationBestEffort(prisma, {
            userId: patientUserId,
            type: didAddOrChangeNotes ? "info" : "success",
            message: { ar: arMsg, en: enMsg },
          });
        }
      } catch {
      }

      const record = await deps.doctorPortalRepository.findDoctorMedicalRecordWithRelations({
        id,
        doctorId: input.userId,
      });

      return {
        record: record
          ? {
              id: record.id,
              title: record.title || "Chest X-Ray",
              imageUrl: record.imageUrl || null,
              aiResult: record.aiResult || null,
              confidenceScore: record.confidenceScore || null,
              reviewedByDoctor: Boolean(record.reviewedByDoctor),
              doctorNotes: record.doctorNotes || null,
              createdAt: record.createdAt,
              patient: record.patient
                ? {
                    id: (record.patient as { id?: string }).id,
                    name: (record.patient as { fullName?: string }).fullName,
                    email: (record.patient as { email?: string }).email,
                  }
                : null,
              doctor:
                (record.doctor as { user?: Record<string, unknown>; userId?: string } | undefined)
                  ?.user
                  ? {
                      id: (record.doctor as { userId?: string }).userId,
                      name: ((record.doctor as { user?: Record<string, unknown> }).user || {})
                        .fullName || null,
                    }
                  : null,
            }
          : null,
      };
    },

    async getUnreadNotificationsCount(userId) {
      const cached = await getNotificationCache(userId);
      if (typeof cached === "number") return cached;

      const unread = await deps.doctorPortalRepository.countUnreadNotifications(userId);
      setNotificationCache(userId, unread);
      return unread;
    },

    async listNotifications(input) {
      const parsedTake = Number(input.take);
      const take = Number.isFinite(parsedTake) && parsedTake > 0
        ? Math.min(Math.floor(parsedTake), 100)
        : 20;
      const notifications = await deps.doctorPortalRepository.listNotifications({
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
        const existing = await deps.doctorPortalRepository.findNotificationById(id);
        if (!existing || existing.userId !== input.userId) {
          throw new AppError({ code: "not_found", message: "not_found", statusCode: 404 });
        }

        const isRead =
          typeof input.isRead === "boolean" ? input.isRead : Boolean(existing.isRead);
        const updated = await deps.doctorPortalRepository.updateNotificationRead({
          id,
          isRead,
        });

        clearNotificationCache(input.userId);
        return { success: true as const, updated };
      }

      const updatedCount = await deps.doctorPortalRepository.markAllNotificationsRead(input.userId);
      clearNotificationCache(input.userId);
      return { success: true as const, updatedCount };
    },

    async deleteNotifications(input) {
      const id = input.id ? String(input.id).trim() : "";

      if (id) {
        const existing = await deps.doctorPortalRepository.findNotificationById(id);
        if (!existing || existing.userId !== input.userId) {
          throw new AppError({ code: "not_found", message: "not_found", statusCode: 404 });
        }

        await deps.doctorPortalRepository.softDeleteNotificationById(id);
        clearNotificationCache(input.userId);
        return { success: true as const };
      }

      const deletedCount = await deps.doctorPortalRepository.softDeleteAllNotifications(input.userId);
      clearNotificationCache(input.userId);
      return { success: true as const, deletedCount };
    },

    async getMyProfile(userId) {
      const result = await deps.doctorPortalRepository.findDoctorProfileByUserId(userId);
      const doctor = result.doctor;
      if (!doctor) {
        throw new AppError({ code: "not_found", message: "Doctor not found", statusCode: 404 });
      }

      return {
        profile: {
          id: doctor.userId,
          name: result.user?.fullName || "",
          email: result.user?.email || "",
          phone: doctor.phone || "",
          specialty: doctor.specialty || "",
          bio: doctor.bio || "",
          licenseNumber: doctor.licenseNumber || "",
          status: doctor.status || "",
          createdAt: doctor.createdAt,
        },
      };
    },

    async listDoctors(input) {
      const doctors = await deps.doctorPortalRepository.listDoctorsPublic(input.includePending);
      return { doctors };
    },
  };
}
