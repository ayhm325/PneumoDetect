/**
 * API Route
 * GET /api/admin/dashboard-stats
 *
 * الغرض:
 *  - إرجاع إحصائيات لوحة تحكم الأدمن
 *  - محمي بـ RBAC (admin فقط)
 *  - محمي بـ Rate Limiting
 *  - جميع العمليات مسجلة في Audit Log
 */

import { withRBAC } from "../../../../lib/auth/withRBAC";
import { rateLimit } from "../../../../lib/security/rateLimiter";
import { logAudit } from "../../../../lib/security/auditLogger";
import { NextResponse } from "next/server";
import { AppError } from "../../../../src/lib/errors/appError";
import { adminMonitoringService } from "../../../../src/services/admin";

/**
 * =========================
 * GET Handler
 * =========================
 * يتم تغليف الدالة بـ withRBAC لضمان أن المستخدم يمتلك دور admin
 */
export const GET = withRBAC(
  async (request, user) => {
    /**
     * =========================
     * 1) Rate Limiting
     * =========================
     * حماية الـ API من الطلبات المتكررة أو الهجمات
     */
    const rl = await rateLimit(request);

    if (rl.limited) {
      // تسجيل محاولة تجاوز الحد المسموح
      logAudit({
        event: "rate_limit_exceeded",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: {
          endpoint: "GET /api/admin/dashboard-stats",
        },
      });

      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 },
      );
    }

    try {
      const stats = await adminMonitoringService.getDashboardStats();

      /**
       * =========================
       * 4) تسجيل العملية في Audit Log
       * =========================
       * لتتبع استخدام الأدمن للـ Dashboard
       */
      logAudit({
        event: "admin_dashboard_stats",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: stats,
      });

      /**
       * =========================
       * 5) إرجاع البيانات للواجهة
       * =========================
       */
      return NextResponse.json(stats);
    } catch (error) {
      /**
       * =========================
       * 6) التعامل مع الأخطاء
       * =========================
       * - تسجيل الخطأ في Audit Log
       * - عدم تسريب تفاصيل تقنية للمستخدم
       */
      logAudit({
        event: "admin_dashboard_stats_error",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: {
          error: error instanceof Error ? error.message : String(error),
        },
      });

      if (error instanceof AppError) {
        return NextResponse.json({ error: error.message }, { status: error.statusCode });
      }

      return NextResponse.json(
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
