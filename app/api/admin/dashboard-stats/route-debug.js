/**
 * API Route (Debug Only)
 * GET /api/admin/dashboard-stats/route-debug
 *
 * الغرض:
 *  - جلب إحصائيات لوحة تحكم الأدمن
 *  - endpoint مخصص للتطوير فقط (غير متاح في production)
 *  - محمي بـ RBAC (admin فقط)
 *  - محمي بـ Rate Limiting
 *  - جميع العمليات مسجلة في Audit Log
 */

import { withRBAC } from "../../../../lib/auth/withRBAC";
import { rateLimit } from "../../../../lib/security/rateLimiter";
import { logAudit } from "../../../../lib/security/auditLogger";
import { AppError } from "../../../../src/lib/errors/appError";
import { adminMonitoringService } from "../../../../src/services/admin";

/**
 * =========================
 * GET Handler
 * =========================
 * يتم لف الدالة بـ withRBAC لضمان أن المستخدم Admin
 */
export const GET = withRBAC(
  async (request, user) => {
    /**
     * =========================
     * 1) تعطيل الـ Endpoint في Production
     * =========================
     * هذا المسار مخصص للتطوير/debug فقط
     * لمنع تسريب بيانات حساسة في بيئة الإنتاج
     */
    if (process.env.NODE_ENV === "production") {
      return Response.json(
        { error: "Not Found" },
        { status: 404 },
      );
    }

    /**
     * =========================
     * 2) Rate Limiting
     * =========================
     * حماية المسار من الاستدعاءات المفرطة
     */
    const rl = await rateLimit(request);

    if (rl.limited) {
      // تسجيل محاولة تجاوز الحد المسموح
      logAudit({
        event: "rate_limit_exceeded",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: {
          endpoint: "GET /api/admin/dashboard-stats/route-debug",
        },
      });

      return Response.json(
        { error: "Rate limit exceeded" },
        { status: 429 },
      );
    }

    try {
      const result = await adminMonitoringService.getDashboardStatsDebug();

      /**
       * =========================
       * 4) تسجيل العملية في Audit Log
       * =========================
       * لتتبع استخدام الأدمن للمسارات الحساسة
       */
      logAudit({
        event: "admin_dashboard_stats_debug",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: {
          totalUsers: result.totalUsers,
          doctors: result.doctors,
          patients: result.patients,
          todayScans: result.todayScans,
        },
      });

      /**
       * =========================
       * 5) إرجاع البيانات
       * =========================
       */
      return Response.json(result);
    } catch (error) {
      /**
       * =========================
       * 6) تسجيل الخطأ
       * =========================
       * لا يتم تسريب تفاصيل تقنية للمستخدم
       */
      logAudit({
        event: "admin_dashboard_stats_debug_error",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: {
          error: error instanceof Error ? error.message : String(error),
        },
      });

      if (error instanceof AppError) {
        return Response.json({ error: error.message }, { status: error.statusCode });
      }

      return Response.json(
        { error: "حدث خطأ أثناء جلب الإحصائيات" },
        { status: 500 },
      );
    }
  },

  /**
   * =========================
   * الأدوار المسموح لها
   * =========================
   */
  ["admin"],
);
