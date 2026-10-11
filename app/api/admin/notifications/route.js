import { NextResponse } from "next/server";
import { withRBAC } from "../../../../lib/auth/withRBAC";
import { rateLimit } from "../../../../lib/security/rateLimiter";
import { logAudit } from "../../../../lib/security/auditLogger";
import { AppError } from "../../../../src/lib/errors/appError";
import { adminMonitoringService } from "../../../../src/services/admin";

/* ============================================================================
   GET /api/admin/notifications
   - جلب آخر إشعارات الأدمن
   - بحد أقصى 50 إشعار
   - لا يجلب المحذوف (isDeleted = false)
============================================================================ */
export const GET = withRBAC(
  async (request, user) => {
    // =========================
    // Rate Limiting
    // =========================
    const rl = await rateLimit(request);
    if (rl.limited) {
      logAudit({
        event: "rate_limit_exceeded",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: { endpoint: "GET /api/admin/notifications" },
      });
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 },
      );
    }

    try {
      const result = await adminMonitoringService.listNotifications({
        userId: user.id,
      });

      return NextResponse.json(result);
    } catch (error) {
      // تسجيل الخطأ في سجل التدقيق
      logAudit({
        event: "admin_notifications_list_error",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: { error: error instanceof Error ? error.message : String(error) },
      });

      if (error instanceof AppError) {
        return NextResponse.json({ error: error.message }, { status: error.statusCode });
      }

      return NextResponse.json(
        { error: "Internal error" },
        { status: 500 },
      );
    }
  },
  ["admin"],
);

/* ============================================================================
   PUT /api/admin/notifications
   - حالتان:
     1) تحديث إشعار واحد (isRead)
     2) تعليم جميع إشعارات الأدمن كمقروءة
============================================================================ */
export const PUT = withRBAC(
  async (request, user) => {
    // =========================
    // Rate Limiting
    // =========================
    const rl = await rateLimit(request);
    if (rl.limited) {
      logAudit({
        event: "rate_limit_exceeded",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: { endpoint: "PUT /api/admin/notifications" },
      });
      return NextResponse.json(
        { error: "rate_limited" },
        { status: 429 },
      );
    }

    try {
      // قراءة ID من query string (اختياري)
      const id = request.nextUrl.searchParams.get("id");

      // قراءة body إن وجد (بأمان)
      let body = {};
      const contentType = request.headers.get("content-type") || "";
      if (contentType.toLowerCase().includes("application/json")) {
        body = await request.json().catch(() => null);
        if (!body) {
          return NextResponse.json({ error: "invalid_json" }, { status: 400 });
        }
      }

      // تحديد قيمة isRead الجديدة إن وُجدت
      const nextIsRead =
        typeof body?.isRead === "boolean" ? body.isRead : undefined;
      const result = await adminMonitoringService.updateNotifications({
        userId: user.id,
        notificationId: id,
        isRead: nextIsRead,
      });

      return NextResponse.json(result, { status: 200 });
    } catch (error) {
      // تسجيل أي خطأ غير متوقع
      logAudit({
        event: "admin_notifications_update_error",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: { error: error instanceof Error ? error.message : String(error) },
      });

      if (error instanceof AppError) {
        return NextResponse.json({ error: error.message }, { status: error.statusCode });
      }

      return NextResponse.json(
        { error: "server_error" },
        { status: 500 },
      );
    }
  },
  ["admin"],
);
