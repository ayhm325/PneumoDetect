import { withRBAC } from "../../../../lib/auth/withRBAC";
import { rateLimit } from "../../../../lib/security/rateLimiter";
import { logAudit } from "../../../../lib/security/auditLogger";
import { AppError } from "../../../../src/lib/errors/appError";
import { adminMonitoringService } from "../../../../src/services/admin";

/* ============================================================================
   GET /api/admin/notifications-unread
   - جلب عدد الإشعارات غير المقروءة
   - حساب Badge للأدمن: مجموع الإشعارات + طلبات موافقة الأطباء + طلبات تغيير الطبيب المعلقة
============================================================================ */
export const GET = withRBAC(
  async (request, user) => {
    // =========================
    // التحكم بعدد الطلبات (Rate Limiting)
    // =========================
    const rl = await rateLimit(request);
    if (rl.limited) {
      logAudit({
        event: "rate_limit_exceeded",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: { endpoint: "GET /api/admin/notifications-unread" },
      });
      return Response.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    try {
      const result = await adminMonitoringService.getNotificationsUnread({
        userId: user.id,
      });

      return Response.json(result);
    } catch (error) {
      // تسجيل أي خطأ في سجل التدقيق
      logAudit({
        event: "admin_notifications_unread_error",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: { error: error instanceof Error ? error.message : String(error) },
      });

      if (error instanceof AppError) {
        return Response.json({ error: error.message }, { status: error.statusCode });
      }

      return Response.json({ error: "Internal error" }, { status: 500 });
    }
  },
  ["admin"], // صلاحية الوصول: الأدمن فقط
);
