import { withRBAC } from "../../../../lib/auth/withRBAC";
import { rateLimit } from "../../../../lib/security/rateLimiter";
import { logAudit } from "../../../../lib/security/auditLogger";
import { AppError } from "../../../../src/lib/errors/appError";
import { adminMonitoringService } from "../../../../src/services/admin";

/**
 * GET /api/admin/system-status
 * - يعرض معلومات عن حالة النظام والخادم:
 *   - مدة التشغيل
 *   - استهلاك الذاكرة
 *   - زمن استجابة قاعدة البيانات
 *   - حجم قاعدة البيانات
 */
export const GET = withRBAC(
  async (request, user) => {
    // =========================
    // التحقق من معدل الاستدعاءات (Rate Limit)
    // =========================
    const rl = await rateLimit(request);
    if (rl.limited) {
      logAudit({
        event: "rate_limit_exceeded",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: { endpoint: "GET /api/admin/system-status" },
      });
      return Response.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    try {
      const payload = await adminMonitoringService.getSystemStatus();

      // =========================
      // تسجيل النشاط في سجلات الأدمن
      // =========================
      logAudit({
        event: "admin_system_status_viewed",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: payload,
      });

      return Response.json(payload);
    } catch (error) {
      // =========================
      // تسجيل الخطأ وإرجاع رسالة مناسبة
      // =========================
      logAudit({
        event: "admin_system_status_error",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: { error: error instanceof Error ? error.message : String(error) },
      });

      if (error instanceof AppError) {
        return Response.json({ error: error.message }, { status: error.statusCode });
      }

      return Response.json(
        {
          error: "حدث خطأ أثناء جلب حالة النظام",
          ...(process.env.NODE_ENV !== "production"
            ? { details: String(error) }
            : {}),
        },
        { status: 500 }
      );
    }
  },
  ["admin"] // فقط للأدمن
);
