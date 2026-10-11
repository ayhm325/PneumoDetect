import { prisma, type PrismaClientLike } from "../../db/prisma";
import { createNotificationBestEffort } from "../../../lib/notifications";

export interface NotificationRepository {
  createBestEffort(params: {
    userId: string;
    type: "info" | "warning" | "alert" | "success";
    message: unknown;
  }): Promise<unknown | null>;
}

export function createNotificationRepository(
  db: PrismaClientLike = prisma,
): NotificationRepository {
  return {
    async createBestEffort(params) {
      return createNotificationBestEffort(db, params);
    },
  };
}
