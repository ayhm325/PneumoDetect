import type { Prisma } from "@prisma/client";
import { prisma, type PrismaClientLike } from "../../db/prisma";
import { AppError } from "../../lib/errors/appError";

export interface PatientPortalRepository {
  findPatientByUserId(userId: string): Promise<Prisma.PatientGetPayload<{}> | null>;
  findUserById(userId: string): Promise<Prisma.UserGetPayload<{}> | null>;
  countUpcomingAppointments(patientId: string): Promise<number>;
  listMedicalRecords(patientId: string): Promise<Array<Record<string, unknown>>>;
  countUnreadDoctorMessages(patientId: string): Promise<number>;
  countUnreadNotifications(userId: string): Promise<number>;
  listNotifications(input: {
    userId: string;
    cursor?: string | null;
    take: number;
  }): Promise<Array<Record<string, unknown>>>;
  findNotificationById(id: string): Promise<Prisma.NotificationGetPayload<{}> | null>;
  updateNotificationRead(input: {
    id: string;
    isRead: boolean;
    readAt: Date | null;
  }): Promise<Record<string, unknown>>;
  markAllNotificationsRead(userId: string): Promise<number>;
  softDeleteNotificationById(id: string): Promise<void>;
  softDeleteAllNotifications(userId: string): Promise<number>;
  findNotificationSettingsActivity(userId: string): Promise<Prisma.ActivityGetPayload<{}> | null>;
  updateNotificationSettingsActivity(id: string, meta: Record<string, unknown>): Promise<void>;
  createNotificationSettingsActivity(userId: string, meta: Record<string, unknown>): Promise<void>;
  updatePatientProfile(
    patientId: string,
    data: Prisma.PatientUncheckedUpdateInput,
  ): Promise<Prisma.PatientGetPayload<{}>>;
  updateUserProfile(userId: string, data: Prisma.UserUpdateInput): Promise<void>;
  findDoctorUser(doctorId: string): Promise<Prisma.UserGetPayload<{}> | null>;
  listMedicalRecordsWithDoctor(patientId: string): Promise<Array<Record<string, unknown>>>;
  listAppointmentsForPatient(patientId: string): Promise<Array<Record<string, unknown>>>;
  createAppointment(input: {
    doctorId: string;
    patientId: string;
    scheduledAt: Date;
    reason?: string | null;
    location?: string | null;
    phone?: string | null;
  }): Promise<Record<string, unknown>>;
  findDoctorByUserId(doctorId: string): Promise<Prisma.DoctorGetPayload<{ select: { user: { select: { fullName: true } } } }> | null>;
  findAppointmentById(id: string): Promise<Prisma.AppointmentGetPayload<{}> | null>;
  updateAppointmentById(id: string, data: Prisma.AppointmentUpdateInput): Promise<Record<string, unknown>>;
}

export function createPatientPortalRepository(
  db: PrismaClientLike = prisma,
): PatientPortalRepository {
  return {
    async findPatientByUserId(userId) {
      try {
        return await db.patient.findFirst({ where: { userId } });
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to find patient",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async findUserById(userId) {
      try {
        return await db.user.findUnique({ where: { id: userId } });
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to find user",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async countUpcomingAppointments(patientId) {
      try {
        return await db.appointment.count({
          where: {
            patientId,
            isDeleted: false,
            status: "scheduled",
            scheduledAt: { gte: new Date() },
          },
        });
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to count upcoming appointments",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async listMedicalRecords(patientId) {
      try {
        const records = await db.medicalRecord.findMany({
          where: { patientId },
        });
        return records as unknown as Array<Record<string, unknown>>;
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to list medical records",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async countUnreadDoctorMessages(patientId) {
      try {
        return await db.message.count({
          where: {
            chat: { patientId },
            status: { not: "read" },
            sender: "doctor",
          },
        });
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to count unread doctor messages",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async countUnreadNotifications(userId) {
      try {
        return await db.notification.count({
          where: { userId, isRead: false, isDeleted: false },
        });
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to count unread notifications",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async listNotifications(input) {
      try {
        const where = { userId: input.userId, isDeleted: false };
        const notifications = input.cursor
          ? await db.notification.findMany({
              where,
              orderBy: { createdAt: "desc" },
              take: input.take + 1,
              cursor: { id: input.cursor },
              skip: 1,
            })
          : await db.notification.findMany({
              where,
              orderBy: { createdAt: "desc" },
              take: input.take + 1,
            });

        return notifications as unknown as Array<Record<string, unknown>>;
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to list notifications",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async findNotificationById(id) {
      try {
        return await db.notification.findUnique({ where: { id } });
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to find notification",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async updateNotificationRead(input) {
      try {
        const updated = await db.notification.update({
          where: { id: input.id },
          data: { isRead: input.isRead, readAt: input.readAt },
        });
        return updated as unknown as Record<string, unknown>;
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to update notification read state",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async markAllNotificationsRead(userId) {
      try {
        const result = await db.notification.updateMany({
          where: { userId, isDeleted: false, isRead: false },
          data: { isRead: true, readAt: new Date() },
        });
        return result.count;
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to mark notifications as read",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async softDeleteNotificationById(id) {
      try {
        await db.notification.update({
          where: { id },
          data: { isDeleted: true, archivedAt: new Date() },
        });
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to delete notification",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async softDeleteAllNotifications(userId) {
      try {
        const result = await db.notification.updateMany({
          where: { userId, isDeleted: false },
          data: { isDeleted: true, archivedAt: new Date() },
        });
        return result.count;
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to delete notifications",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async findNotificationSettingsActivity(userId) {
      try {
        return await db.activity.findFirst({
          where: { userId, type: "notificationSettings" },
        });
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to find notification settings activity",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async updateNotificationSettingsActivity(id, meta) {
      try {
        await db.activity.update({
          where: { id },
          data: { meta },
        });
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to update notification settings activity",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async createNotificationSettingsActivity(userId, meta) {
      try {
        await db.activity.create({
          data: {
            userId,
            type: "notificationSettings",
            description: "User notification preferences",
            meta,
          },
        });
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to create notification settings activity",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async updatePatientProfile(patientId, data) {
      try {
        return await db.patient.update({ where: { id: patientId }, data });
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to update patient profile",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async updateUserProfile(userId, data) {
      try {
        await db.user.update({ where: { id: userId }, data });
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to update user profile",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async findDoctorUser(doctorId) {
      try {
        return await db.user.findUnique({ where: { id: doctorId } });
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to find doctor user",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async listMedicalRecordsWithDoctor(patientId) {
      try {
        const records = await db.medicalRecord.findMany({
          where: { patientId },
          include: {
            doctor: {
              select: {
                userId: true,
                clinic: true,
                user: { select: { id: true, fullName: true, email: true } },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        });

        return records as unknown as Array<Record<string, unknown>>;
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to list medical records with doctor",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async listAppointmentsForPatient(patientId) {
      try {
        const appointments = await db.appointment.findMany({
          where: { patientId, isDeleted: false },
          include: {
            doctor: {
              select: {
                userId: true,
                phone: true,
                clinic: true,
                user: {
                  select: {
                    id: true,
                    fullName: true,
                    email: true,
                  },
                },
              },
            },
            patient: { select: { id: true, fullName: true, phone: true } },
          },
          orderBy: { scheduledAt: "asc" },
        });

        return appointments as unknown as Array<Record<string, unknown>>;
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to list appointments",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async createAppointment(input) {
      try {
        const created = await db.appointment.create({
          data: {
            doctorId: input.doctorId,
            patientId: input.patientId,
            scheduledAt: input.scheduledAt,
            status: "scheduled",
            reason: input.reason || null,
            location: input.location || null,
            phone: input.phone || null,
          },
        });

        return created as unknown as Record<string, unknown>;
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to create appointment",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async findDoctorByUserId(doctorId) {
      try {
        return await db.doctor.findUnique({
          where: { userId: doctorId },
          select: { user: { select: { fullName: true } } },
        });
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to find doctor",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async findAppointmentById(id) {
      try {
        return await db.appointment.findUnique({ where: { id } });
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to find appointment",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async updateAppointmentById(id, data) {
      try {
        const updated = await db.appointment.update({ where: { id }, data });
        return updated as unknown as Record<string, unknown>;
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to update appointment",
          statusCode: 500,
          cause: error,
        });
      }
    },
  };
}
