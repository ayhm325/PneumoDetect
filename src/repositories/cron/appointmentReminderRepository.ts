import { prisma, type PrismaClientLike } from "../../db/prisma";
import { createNotificationBestEffort } from "../../../lib/notifications";
import { AppError } from "../../lib/errors/appError";

export interface ReminderWindow {
  key: string;
  from: Date;
  to: Date;
}

export interface AppointmentReminderRepository {
  listAppointmentsForWindow(window: ReminderWindow): Promise<Array<Record<string, unknown>>>;
  hasRecentReminder(input: {
    patientUserId: string;
    appointmentId: string;
    windowKey: string;
    dedupeSince: Date;
  }): Promise<boolean>;
  createReminderNotification(input: {
    patientUserId: string;
    messageAr: string;
    messageEn: string;
    appointmentId: string;
    windowKey: string;
  }): Promise<void>;
}

export function createAppointmentReminderRepository(
  db: PrismaClientLike = prisma,
): AppointmentReminderRepository {
  return {
    async listAppointmentsForWindow(window) {
      try {
        const appointments = await db.appointment.findMany({
          where: {
            isDeleted: false,
            status: "scheduled",
            scheduledAt: {
              gte: window.from,
              lt: window.to,
            },
          },
          include: {
            patient: {
              select: {
                userId: true,
                fullName: true,
              },
            },
            doctor: {
              select: {
                userId: true,
                user: {
                  select: { fullName: true },
                },
              },
            },
          },
        });

        return appointments as unknown as Array<Record<string, unknown>>;
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to list appointments for reminder window",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async hasRecentReminder(input) {
      try {
        const existingNotification = await db.notification.findFirst({
          where: {
            userId: input.patientUserId,
            isDeleted: false,
            createdAt: { gte: input.dedupeSince },
            AND: [
              { message: { contains: '"kind":"appointment_reminder"' } },
              { message: { contains: `"appointmentId":"${input.appointmentId}"` } },
              { message: { contains: `"window":"${input.windowKey}"` } },
            ],
          },
          select: { id: true },
        });

        return Boolean(existingNotification);
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to check existing reminder notification",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async createReminderNotification(input) {
      try {
        await createNotificationBestEffort(db, {
          userId: input.patientUserId,
          type: "info",
          message: {
            ar: input.messageAr,
            en: input.messageEn,
            meta: {
              kind: "appointment_reminder",
              appointmentId: input.appointmentId,
              window: input.windowKey,
            },
          },
        });
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to create reminder notification",
          statusCode: 500,
          cause: error,
        });
      }
    },
  };
}
