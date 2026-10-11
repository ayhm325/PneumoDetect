// Security: جميع الـ API محمية بواسطة withRBAC() لتطبيق المصادقة وRBAC.
// Rate limiting و audit logging مطبّقة على جميع العمليات الحساسة للإدارة.

import { withRBAC } from "../../../../lib/auth/withRBAC";
import { rateLimit } from "../../../../lib/security/rateLimiter";
import { logAudit } from "../../../../lib/security/auditLogger";
import { AppError } from "../../../../src/lib/errors/appError";
import { adminSettingsService } from "../../../../src/services/admin";

/////////////////////////
// GET /api/admin/settings
// جلب الإعدادات الحالية
/////////////////////////
export const GET = withRBAC(
  async (request, user) => {
    const rl = await rateLimit(request);
    if (rl.limited)
      return Response.json({ error: "Rate limit exceeded" }, { status: 429 });

    try {
      const result = await adminSettingsService.getSettings();

      logAudit({
        event: "admin_settings_read",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
      });

      return Response.json(result);
    } catch (error) {
      if (error instanceof AppError) {
        return Response.json({ error: error.message }, { status: error.statusCode });
      }

      return Response.json({ error: "Failed to load settings" }, { status: 500 });
    }
  },
  ["admin"],
);

/////////////////////////
// PATCH /api/admin/settings
// تعديل الإعدادات المحددة فقط
/////////////////////////
export const PATCH = withRBAC(
  async (request, user) => {
    const rl = await rateLimit(request);
    if (rl.limited)
      return Response.json({ error: "Rate limit exceeded" }, { status: 429 });

    try {
      const contentType = request.headers.get("content-type") || "";
      if (!contentType.toLowerCase().includes("application/json")) {
        return Response.json({ error: "invalid_content_type" }, { status: 400 });
      }

      const body = await request.json().catch(() => null);
      if (!body) {
        return Response.json({ error: "invalid_json" }, { status: 400 });
      }

      const result = await adminSettingsService.updateSettings({ patch: body || {} });

      logAudit({
        event: "admin_settings_updated",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: { updatedKeys: result.updatedKeys },
      });

      return Response.json({ success: result.success, settings: result.settings });
    } catch (error) {
      logAudit({
        event: "admin_settings_update_error",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: { error: error instanceof Error ? error.message : String(error) },
      });

      if (error instanceof AppError) {
        return Response.json({ error: error.message }, { status: error.statusCode });
      }

      return Response.json(
        { error: "Failed to update settings" },
        { status: 500 },
      );
    }
  },
  ["admin"],
);
