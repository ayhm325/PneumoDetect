import { formatDateTimeForLocale } from "../../../lib/notifications";
import { AppError } from "../../lib/errors/appError";
import type { AppointmentReminderRepository } from "../../repositories/cron/appointmentReminderRepository";

const REMINDER_WINDOWS = [
  { key: "1h", fromMs: 55 * 60 * 1000, toMs: 65 * 60 * 1000 },
  { key: "24h", fromMs: 23 * 60 * 60 * 1000, toMs: 25 * 60 * 60 * 1000 },
];

export interface AppointmentReminderService {
  runReminders(input?: { now?: Date }): Promise<{
    created: number;
    details: Array<{ appointmentId: string; window: string; patientUserId: string }>;
    now: string;
  }>;
}

export function createAppointmentReminderService(deps: {
  appointmentReminderRepository: AppointmentReminderRepository;
}): AppointmentReminderService {
  const { appointmentReminderRepository } = deps;

  return {
    async runReminders(input = {}) {
      const now = input.now instanceof Date ? input.now : new Date();
      if (Number.isNaN(now.getTime())) {
        throw new AppError({
          code: "validation_error",
          message: "invalid_now",
          statusCode: 400,
        });
      }

      const nowMs = now.getTime();
      const details: Array<{ appointmentId: string; window: string; patientUserId: string }> = [];
      let created = 0;

      for (const window of REMINDER_WINDOWS) {
        const from = new Date(nowMs + window.fromMs);
        const to = new Date(nowMs + window.toMs);

        const appointments = await appointmentReminderRepository.listAppointmentsForWindow({
          key: window.key,
          from,
          to,
        });

        for (const appt of appointments) {
          const appointmentId = String(appt?.id || "").trim();
          const patientUserId = String((appt?.patient as Record<string, unknown> | undefined)?.userId || "").trim();
          const doctorName = String(
            ((appt?.doctor as Record<string, unknown> | undefined)?.user as Record<string, unknown> | undefined)
              ?.fullName || "",
          ).trim();
          const scheduledAt = (appt?.scheduledAt instanceof Date
            ? appt.scheduledAt
            : new Date(String(appt?.scheduledAt || ""))) as Date;

          if (!appointmentId || !patientUserId || Number.isNaN(scheduledAt.getTime())) {
            continue;
          }

          const alreadySent = await appointmentReminderRepository.hasRecentReminder({
            patientUserId,
            appointmentId,
            windowKey: window.key,
            dedupeSince: new Date(nowMs - 30 * 60 * 60 * 1000),
          });

          if (alreadySent) {
            continue;
          }

          const messageAr = `تذكير: لديك موعد${
            doctorName ? ` مع د. ${doctorName}` : ""
          } بتاريخ ${formatDateTimeForLocale(scheduledAt, "ar")}.`;
          const messageEn = `Reminder: you have an appointment${
            doctorName ? ` with Dr. ${doctorName}` : ""
          } on ${formatDateTimeForLocale(scheduledAt, "en")}.`;

          await appointmentReminderRepository.createReminderNotification({
            patientUserId,
            messageAr,
            messageEn,
            appointmentId,
            windowKey: window.key,
          });

          created += 1;
          details.push({
            appointmentId,
            window: window.key,
            patientUserId,
          });
        }
      }

      return {
        created,
        details,
        now: now.toISOString(),
      };
    },
  };
}
