import os from "os";
import type { Prisma } from "@prisma/client";
import { serializeLocalizedMessage } from "../../../lib/notifications";
import { AppError } from "../../lib/errors/appError";
import type { AdminMonitoringRepository } from "../../repositories/admin/adminMonitoringRepository";

export interface AdminMonitoringService {
  listNotifications(input: { userId: string }): Promise<{ notifications: Array<Record<string, unknown>> }>;
  updateNotifications(input: {
    userId: string;
    notificationId?: string | null;
    isRead?: boolean;
  }): Promise<{ success: true; updated?: Record<string, unknown> }>;
  getNotificationsUnread(input: { userId: string }): Promise<{ unread: number; badge: number }>;
  listRecentActivities(): Promise<{ activities: Array<Record<string, unknown>> }>;
  createRecentActivity(input: {
    type?: string;
    description?: string;
    userId?: string | null;
    meta?: unknown;
  }): Promise<{ activity: Record<string, unknown> }>;
  getSystemStatus(): Promise<{
    serverUptime: string;
    responseTime: string;
    memoryUsage: string;
    dbSize: string;
  }>;
  getDashboardStats(): Promise<{
    totalUsers: number;
    doctors: number;
    patients: number;
    todayScans: number;
    totalScans: number;
  }>;
  getDashboardStatsDebug(): Promise<{
    totalUsers: number;
    doctors: number;
    patients: number;
    todayScans: number;
    totalScans: number;
    debug: {
      allUsers: Array<Record<string, unknown>>;
      allDoctors: Array<Record<string, unknown>>;
      allPatients: Array<Record<string, unknown>>;
      allAnalysis: Array<Record<string, unknown>>;
    };
  }>;
  broadcastAnnouncement(input: {
    roles?: string[];
    type?: string;
    message: string | Record<string, unknown>;
  }): Promise<{ success: true; created: number; roles: string[] }>;
}

export function createAdminMonitoringService(deps: {
  adminMonitoringRepository: AdminMonitoringRepository;
}): AdminMonitoringService {
  return {
    async listNotifications(input) {
      const userId = String(input.userId || "").trim();
      if (!userId) {
        throw new AppError({
          code: "validation_error",
          message: "Unauthorized",
          statusCode: 401,
        });
      }

      const notifications = await deps.adminMonitoringRepository.listNotificationsForUser(
        userId,
        50,
      );
      return { notifications };
    },

    async updateNotifications(input) {
      const userId = String(input.userId || "").trim();
      if (!userId) {
        throw new AppError({
          code: "validation_error",
          message: "Unauthorized",
          statusCode: 401,
        });
      }

      const notificationId = input.notificationId ? String(input.notificationId).trim() : "";

      if (notificationId) {
        const existing = await deps.adminMonitoringRepository.findNotificationById(notificationId);
        if (!existing || existing.userId !== userId) {
          throw new AppError({
            code: "not_found",
            message: "not_found",
            statusCode: 404,
          });
        }

        const isRead =
          typeof input.isRead === "boolean" ? input.isRead : Boolean(existing.isRead);

        const updated = await deps.adminMonitoringRepository.updateNotificationReadState(
          notificationId,
          isRead,
        );

        return { success: true as const, updated };
      }

      await deps.adminMonitoringRepository.markAllNotificationsRead(userId);
      return { success: true as const };
    },

    async getNotificationsUnread(input) {
      const userId = String(input.userId || "").trim();
      if (!userId) {
        throw new AppError({
          code: "validation_error",
          message: "Unauthorized",
          statusCode: 401,
        });
      }

      const [unread, pendingDoctorApprovals, pendingDoctorChangeRequests] =
        await Promise.all([
          deps.adminMonitoringRepository.countUnreadNotifications(userId),
          deps.adminMonitoringRepository.countPendingDoctorApprovals(),
          deps.adminMonitoringRepository.countPendingDoctorChangeRequests(),
        ]);

      return {
        unread,
        badge: unread + pendingDoctorApprovals + pendingDoctorChangeRequests,
      };
    },

    async listRecentActivities() {
      const activities = await deps.adminMonitoringRepository.listRecentActivities(10);
      return {
        activities: activities as unknown as Array<Record<string, unknown>>,
      };
    },

    async createRecentActivity(input) {
      const type = String(input.type || "").trim();
      const description = String(input.description || "").trim();
      const userId = input.userId ? String(input.userId).trim() : null;

      if (!type || !description) {
        throw new AppError({
          code: "validation_error",
          message: "type_and_description_required",
          statusCode: 400,
        });
      }

      const meta =
        input.meta === undefined || input.meta === null || typeof input.meta === "object"
          ? (input.meta as Record<string, unknown> | null | undefined)
          : undefined;

      if (input.meta !== undefined && meta === undefined) {
        throw new AppError({
          code: "validation_error",
          message: "invalid_meta",
          statusCode: 400,
        });
      }

      const activity = await deps.adminMonitoringRepository.createActivity({
        type,
        description,
        userId,
        meta: (meta ?? null) as Prisma.InputJsonValue | null,
      });

      return { activity };
    },

    async getSystemStatus() {
      const uptimeSeconds = process.uptime();
      const uptimeHours = Math.floor(uptimeSeconds / 3600);
      const uptimeMinutes = Math.floor((uptimeSeconds % 3600) / 60);
      const uptime = `${uptimeHours}h ${uptimeMinutes}m`;

      const memoryUsage = process.memoryUsage();
      const usedMB = (memoryUsage.rss / 1024 / 1024).toFixed(1);
      const totalMB = (os.totalmem() / 1024 / 1024).toFixed(1);
      const memoryPercent = ((memoryUsage.rss / os.totalmem()) * 100).toFixed(1) + "%";

      const start = Date.now();
      await deps.adminMonitoringRepository.pingDatabase();
      const responseTime = `${Date.now() - start}ms`;

      const dbSizeBytes = await deps.adminMonitoringRepository.getDatabaseSizeBytes();
      const dbSize = (dbSizeBytes / 1024 / 1024).toFixed(2) + " MB";

      return {
        serverUptime: uptime,
        responseTime,
        memoryUsage: `${usedMB}MB / ${totalMB}MB (${memoryPercent})`,
        dbSize,
      };
    },

    async getDashboardStats() {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);

      const [totalUsers, doctors, patients, todayScans, totalScans] = await Promise.all([
        deps.adminMonitoringRepository.countUsersTotal(),
        deps.adminMonitoringRepository.countUsersByRole("doctor"),
        deps.adminMonitoringRepository.countUsersByRole("patient"),
        deps.adminMonitoringRepository.countMedicalRecordsInRange({
          start: startOfToday,
          end: endOfToday,
        }),
        deps.adminMonitoringRepository.countMedicalRecordsTotal(),
      ]);

      return {
        totalUsers,
        doctors,
        patients,
        todayScans,
        totalScans,
      };
    },

    async getDashboardStatsDebug() {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);

      const [stats, allUsers, allDoctors, allPatients, allAnalysis] = await Promise.all([
        Promise.all([
          deps.adminMonitoringRepository.countUsersTotal(),
          deps.adminMonitoringRepository.countUsersByRole("doctor"),
          deps.adminMonitoringRepository.countUsersByRole("patient"),
          deps.adminMonitoringRepository.countMedicalRecordsInRange({
            start: startOfToday,
            end: endOfToday,
          }),
          deps.adminMonitoringRepository.countMedicalRecordsTotal(),
        ]).then(([totalUsers, doctors, patients, todayScans, totalScans]) => ({
          totalUsers,
          doctors,
          patients,
          todayScans,
          totalScans,
        })),
        deps.adminMonitoringRepository.listUsersSnapshot(),
        deps.adminMonitoringRepository.listUsersSnapshot("doctor"),
        deps.adminMonitoringRepository.listUsersSnapshot("patient"),
        deps.adminMonitoringRepository.listMedicalRecordsSnapshot(),
      ]);

      return {
        ...stats,
        debug: {
          allUsers,
          allDoctors,
          allPatients,
          allAnalysis,
        },
      };
    },

    async broadcastAnnouncement(input) {
      if (
        !input.message ||
        (typeof input.message !== "string" && typeof input.message !== "object")
      ) {
        throw new AppError({
          code: "validation_error",
          message: "missing_message",
          statusCode: 400,
        });
      }

      const roles =
        Array.isArray(input.roles) && input.roles.length > 0
          ? input.roles
          : ["patient", "doctor"];

      const type = input.type || "info";
      const serializedMessage = serializeLocalizedMessage({
        ...(typeof input.message === "string"
          ? { ar: input.message, en: input.message }
          : input.message),
        meta: {
          kind: "admin_announcement",
        },
      });

      const userIds = await deps.adminMonitoringRepository.listActiveUserIdsByRoles(roles);
      const created = await deps.adminMonitoringRepository.createManyNotifications({
        userIds,
        type,
        message: serializedMessage,
      });

      return {
        success: true,
        created,
        roles,
      };
    },
  };
}
