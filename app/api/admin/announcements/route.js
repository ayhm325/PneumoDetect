/**
 * API Route: POST /api/admin/announcements
 * الوصف:
 *  - إرسال إعلان إداري جماعي لمستخدمين حسب الأدوار
 *  - محمي بـ RBAC (للأدمن فقط)
 *  - محمي بـ Rate Limiting
 *  - يدعم الرسائل متعددة اللغات
 *  - يسجل جميع العمليات في Audit Log
 */

import { withRBAC } from "../../../../lib/auth/withRBAC";
import { rateLimit } from "../../../../lib/security/rateLimiter";
import { logAudit } from "../../../../lib/security/auditLogger";
import { AppError } from "../../../../src/lib/errors/appError";
import { adminMonitoringService } from "../../../../src/services/admin";

/**
 * Handler POST
 * يتم لف الدالة بـ withRBAC للتأكد أن المستخدم يمتلك صلاحية admin
 */
export const POST = withRBAC(
  async (request, user) => {
    /**
     * =========================
     * 1) Rate Limiting
     * =========================
     * حماية الـ API من الإغراق (Spam / Abuse)
     */
    const rl = await rateLimit(request);

    if (rl.limited) {
      // تسجيل محاولة تجاوز الحد المسموح
      logAudit({
        event: "rate_limit_exceeded",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: {
          endpoint: "POST /api/admin/announcements",
        },
      });

      return Response.json(
        { error: "Rate limit exceeded" },
        { status: 429 },
      );
    }

    try {
      const contentType = request.headers.get("content-type") || "";
      if (!contentType.toLowerCase().includes("application/json")) {
        return Response.json({ error: "invalid_content_type" }, { status: 400 });
      }

      /**
       * =========================
       * 2) قراءة وتحليل Body
       * =========================
       */
      const body = await request.json().catch(() => null);
      if (!body) {
        return Response.json({ error: "invalid_json" }, { status: 400 });
      }

      const result = await adminMonitoringService.broadcastAnnouncement({
        roles: body?.roles,
        type: body?.type,
        message: body?.message,
      });

      /**
       * =========================
       * 7) Audit Log للنجاح
       * =========================
       */
      logAudit({
        event: "admin_announcement_broadcast",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: {
          roles: result.roles,
          created: result.created,
        },
      });

      return Response.json({
        success: result.success,
        created: result.created,
      });
    } catch (error) {
      /**
       * =========================
       * 8) Audit Log للأخطاء
       * =========================
       */
      logAudit({
        event: "admin_announcement_error",
        userId: user?.id,
        ip: request.headers.get("x-forwarded-for"),
        details: {
          error: error instanceof Error ? error.message : String(error),
        },
      });

      if (error instanceof AppError) {
        return Response.json({ error: error.message }, { status: error.statusCode });
      }

      return Response.json(
        { error: "server_error" },
        { status: 500 },
      );
    }
  },
  /**
   * الأدوار المسموح لها باستدعاء هذا الـ API
   */
  ["admin"],
);

/**
 * ملاحظة:
 * يمكن لاحقًا إضافة:
 * - GET: لمعاينة الإعلانات
 * - DELETE: لإلغاء إعلان
 * - Pagination / Preview
 */
