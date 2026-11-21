import type { Prisma } from "@prisma/client";
import { prisma, type PrismaClientLike } from "../../db/prisma";
import { AppError } from "../../lib/errors/appError";

type RecentActivity = Prisma.ActivityGetPayload<{
  include: {
    user: {
      select: {
        id: true;
        fullName: true;
        email: true;
      };
    };
  };
}>;

export interface AdminMonitoringRepository {
  listNotificationsForUser(userId: string, take: number): Promise<Array<Record<string, unknown>>>;
  findNotificationById(id: string): Promise<{ id: string; userId: string; isRead: boolean } | null>;
  updateNotificationReadState(id: string, isRead: boolean): Promise<Record<string, unknown>>;
  markAllNotificationsRead(userId: string): Promise<void>;
  countUnreadNotifications(userId: string): Promise<number>;
  countPendingDoctorApprovals(): Promise<number>;
  countPendingDoctorChangeRequests(): Promise<number>;
  listRecentActivities(take: number): Promise<RecentActivity[]>;
  createActivity(input: {
    type: string;
    description: string;
    userId?: string | null;
    meta?: Prisma.InputJsonValue | null;
  }): Promise<Record<string, unknown>>;
  pingDatabase(): Promise<void>;
  getDatabaseSizeBytes(): Promise<number>;
  countUsersTotal(): Promise<number>;
  countUsersByRole(role: string): Promise<number>;
  countMedicalRecordsInRange(input: { start: Date; end: Date }): Promise<number>;
  countMedicalRecordsTotal(): Promise<number>;
  listUsersSnapshot(role?: string): Promise<Array<Record<string, unknown>>>;
  listMedicalRecordsSnapshot(): Promise<Array<Record<string, unknown>>>;
  listActiveUserIdsByRoles(roles: string[]): Promise<string[]>;
  createManyNotifications(input: {
    userIds: string[];
    type: string;
    message: string;
  }): Promise<number>;
}

export function createAdminMonitoringRepository(
  db: PrismaClientLike = prisma,
): AdminMonitoringRepository {
  return {
    async listNotificationsForUser(userId, take) {
      try {
        const notifications = await db.notification.findMany({
          where: { userId, isDeleted: false },
          orderBy: { createdAt: "desc" },
          take,
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
        return await db.notification.findUnique({
          where: { id },
          select: { id: true, userId: true, isRead: true },
        });
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to find notification",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async updateNotificationReadState(id, isRead) {
      try {
        const updated = await db.notification.update({
          where: { id },
          data: { isRead },
        });
        return updated as unknown as Record<string, unknown>;
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to update notification",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async markAllNotificationsRead(userId) {
      try {
        await db.notification.updateMany({
          where: { userId, isDeleted: false, isRead: false },
          data: { isRead: true },
        });
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to mark notifications as read",
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

    async countPendingDoctorApprovals() {
      try {
        return await db.doctor.count({ where: { status: "pending" } });
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to count pending doctor approvals",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async countPendingDoctorChangeRequests() {
      try {
        return await db.changeRequest.count({
          where: {
            type: "doctor_change",
            status: "pending",
            isDeleted: false,
          },
        });
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to count pending doctor change requests",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async listRecentActivities(take) {
      try {
        return await db.activity.findMany({
          orderBy: { createdAt: "desc" },
          take,
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        });
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to list recent activities",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async createActivity(input) {
      try {
        const activity = await db.activity.create({
          data: {
            type: input.type,
            description: input.description,
            userId: input.userId || null,
            meta: input.meta ?? null,
          },
        });

        return activity as unknown as Record<string, unknown>;
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to create activity",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async pingDatabase() {
      try {
        await db.$queryRaw`SELECT 1`;
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to ping database",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async getDatabaseSizeBytes() {
      try {
        const result = (await db.$queryRawUnsafe(
          "SELECT pg_database_size(current_database()) as size",
        )) as Array<{ size?: unknown }>;

        const size = result?.[0]?.size;
        const numeric = Number(size);
        return Number.isFinite(numeric) ? numeric : 0;
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to get database size",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async countUsersTotal() {
      try {
        return await db.user.count();
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to count users",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async countUsersByRole(role) {
      try {
        return await db.user.count({ where: { role } });
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to count users by role",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async countMedicalRecordsInRange(input) {
      try {
        return await db.medicalRecord.count({
          where: {
            createdAt: {
              gte: input.start,
              lte: input.end,
            },
          },
        });
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to count medical records in range",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async countMedicalRecordsTotal() {
      try {
        return await db.medicalRecord.count();
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to count medical records",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async listUsersSnapshot(role) {
      try {
        const users = await db.user.findMany({
          where: role ? { role } : undefined,
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            isActive: true,
            isDeleted: true,
            createdAt: true,
          },
        });

        return users as unknown as Array<Record<string, unknown>>;
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to list users snapshot",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async listMedicalRecordsSnapshot() {
      try {
        const records = await db.medicalRecord.findMany();
        return records as unknown as Array<Record<string, unknown>>;
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to list medical records snapshot",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async listActiveUserIdsByRoles(roles) {
      try {
        const users = await db.user.findMany({
          where: {
            role: { in: roles },
            isDeleted: false,
          },
          select: { id: true },
        });

        return users.map((user: { id: string }) => user.id);
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to list announcement recipients",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async createManyNotifications(input) {
      try {
        if (!input.userIds.length) return 0;

        const CHUNK_SIZE = 500;
        let created = 0;

        for (let index = 0; index < input.userIds.length; index += CHUNK_SIZE) {
          const chunk = input.userIds.slice(index, index + CHUNK_SIZE);
          const result = await db.notification.createMany({
            data: chunk.map((userId) => ({
              userId,
              type: input.type,
              message: input.message,
              isRead: false,
              isDeleted: false,
            })),
          });

          created += result.count || 0;
        }

        return created;
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to create announcement notifications",
          statusCode: 500,
          cause: error,
        });
      }
    },
  };
}
