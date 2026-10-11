import { prisma, type PrismaClientLike } from "../../db/prisma";
import { createNotificationBestEffort } from "../../../lib/notifications";

export interface AuthNotificationRepository {
  hasRecentSecurityLoginNotification(userId: string, since: Date): Promise<boolean>;
  createSecurityLoginNotification(input: {
    userId: string;
    ip: string | null;
  }): Promise<void>;
  createSecurityPasswordChangeNotification(input: {
    userId: string;
  }): Promise<void>;
  createSystemNotification(input: {
    userId: string;
    type?: string;
    messageAr: string;
    messageEn: string;
    meta?: Record<string, unknown>;
  }): Promise<void>;
}

export function createAuthNotificationRepository(
  db: PrismaClientLike = prisma,
): AuthNotificationRepository {
  return {
    async hasRecentSecurityLoginNotification(userId, since) {
      const existing = await db.notification.findFirst({
        where: {
          userId,
          isDeleted: false,
          createdAt: { gte: since },
          message: { contains: '"kind":"security_login"' },
        },
        select: { id: true },
      });
      return Boolean(existing);
    },

    async createSecurityLoginNotification(input) {
      await createNotificationBestEffort(db, {
        userId: input.userId,
        type: "warning",
        message: {
          ar: "تنبيه أمني: تم تسجيل الدخول إلى حسابك.",
          en: "Security alert: a login to your account was detected.",
          meta: { kind: "security_login", ip: input.ip },
        },
      });
    },

    async createSecurityPasswordChangeNotification(input) {
      await createNotificationBestEffort(db, {
        userId: input.userId,
        type: "warning",
        message: {
          ar: "تنبيه أمني: تم تغيير كلمة المرور الخاصة بحسابك.",
          en: "Security alert: your account password was changed.",
          meta: { kind: "security_password_change" },
        },
      });
    },

    async createSystemNotification(input) {
      await createNotificationBestEffort(db, {
        userId: input.userId,
        type: input.type || "info",
        message: {
          ar: input.messageAr,
          en: input.messageEn,
          ...(input.meta ? { meta: input.meta } : {}),
        },
      });
    },
  };
}
