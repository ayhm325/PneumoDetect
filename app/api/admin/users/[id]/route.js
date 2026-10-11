import { withRBAC } from "../../../../../lib/auth/withRBAC.js";
import { rateLimit } from "../../../../../lib/security/rateLimiter";
import { logAudit } from "../../../../../lib/security/auditLogger";
import { AppError } from "../../../../../src/lib/errors/appError";
import { adminUserService } from "../../../../../src/services/admin";

/**
 * DELETE /api/admin/users/[id]
 * - الحذف الفيزيائي معطل لتجنب مشاكل العلاقات (FK)
 * - استخدام PATCH لتفعيل/تعطيل المستخدم
 */
export const DELETE = withRBAC(
  async (request, user) => {
    const rl = await rateLimit(request);
    if (rl.limited) {
      logAudit({
        event: "rate_limit_exceeded",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: { endpoint: "DELETE /api/admin/users/[id]" },
      });
      return Response.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    logAudit({
      event: "admin_user_delete_attempt_disabled",
      userId: user.id,
      ip: request.headers.get("x-forwarded-for"),
      details: { note: "Deletes disabled; use PATCH to toggle active/banned" },
    });

    return Response.json(
      {
        error:
          "Deletes are disabled. Use PATCH /api/admin/users/:id to toggle active/banned.",
      },
      { status: 405 },
    );
  },
  ["admin"]
);

/**
 * PATCH /api/admin/users/[id]
 * - تفعيل أو تعطيل المستخدم
 * - يعكس الحالة في جدول User وأيضاً في Doctor/Patient إذا كان مرتبط
 */
export const PATCH = withRBAC(
  async (request, user, context) => {
    const rl = await rateLimit(request);
    if (rl.limited) {
      logAudit({
        event: "rate_limit_exceeded",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: { endpoint: "PATCH /api/admin/users/[id]" },
      });
      return Response.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const resolvedParams =
      typeof context?.params?.then === "function"
        ? await context.params
        : context?.params;
    const id = String(resolvedParams?.id || "").trim();
    if (!id) {
      return Response.json({ error: "missing_user_id" }, { status: 400 });
    }

    try {
      const contentType = request.headers.get("content-type") || "";
      if (!contentType.toLowerCase().includes("application/json")) {
        return Response.json({ error: "invalid_content_type" }, { status: 400 });
      }

      const body = await request.json().catch(() => null);
      if (!body) {
        return Response.json({ error: "invalid_json" }, { status: 400 });
      }

      const result = await adminUserService.toggleUserState({
        id,
        isActive: body?.isActive,
        status: body?.status,
      });

      // =========================
      // تسجيل النشاط
      // =========================
      logAudit({
        event: "admin_user_toggled_active",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: {
          targetUserId: id,
          isActive:
            typeof body?.isActive === "boolean"
              ? body.isActive
              : body?.status === "active",
        },
      });

      return Response.json(result);
    } catch (error) {
      logAudit({
        event: "admin_user_toggle_error",
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
  ["admin"],
);
