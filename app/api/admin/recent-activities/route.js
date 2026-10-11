import { withRBAC } from "../../../../lib/auth/withRBAC";
import { rateLimit } from "../../../../lib/security/rateLimiter";
import { logAudit } from "../../../../lib/security/auditLogger";
import { AppError } from "../../../../src/lib/errors/appError";
import { adminMonitoringService } from "../../../../src/services/admin";

/**
 * GET /api/admin/activities
 * - جلب أحدث 10 نشاطات من جدول Activity
 * - يستخدم Prisma ORM للوصول للبيانات
 */
export const GET = withRBAC(
  async (req, user) => {
    const rl = await rateLimit(req);
    if (rl.limited) {
      logAudit({
        event: "rate_limit_exceeded",
        userId: user.id,
        ip: req.headers.get("x-forwarded-for"),
        details: { endpoint: "GET /api/admin/recent-activities" },
      });

      return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
        status: 429,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const { activities } = await adminMonitoringService.listRecentActivities();

      logAudit({
        event: "admin_recent_activities_viewed",
        userId: user.id,
        ip: req.headers.get("x-forwarded-for"),
        details: { count: activities.length },
      });

      return new Response(JSON.stringify({ activities }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      logAudit({
        event: "admin_recent_activities_view_error",
        userId: user.id,
        ip: req.headers.get("x-forwarded-for"),
        details: { error: error instanceof Error ? error.message : String(error) },
      });

      if (error instanceof AppError) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: error.statusCode,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(
        JSON.stringify({ error: "حدث خطأ أثناء جلب النشاطات" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  },
  ["admin"],
);

export const POST = withRBAC(
  async (req, user) => {
    const rl = await rateLimit(req);
    if (rl.limited) {
      logAudit({
        event: "rate_limit_exceeded",
        userId: user.id,
        ip: req.headers.get("x-forwarded-for"),
        details: { endpoint: "POST /api/admin/recent-activities" },
      });

      return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
        status: 429,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const contentType = req.headers.get("content-type") || "";
      if (!contentType.toLowerCase().includes("application/json")) {
        return new Response(JSON.stringify({ error: "invalid_content_type" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const body = await req.json().catch(() => null);
      if (!body) {
        return new Response(JSON.stringify({ error: "invalid_json" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const { activity } = await adminMonitoringService.createRecentActivity({
        type: body.type,
        description: body.description,
        userId: body.userId,
        meta: body.meta,
      });

      logAudit({
        event: "admin_recent_activity_created",
        userId: user.id,
        ip: req.headers.get("x-forwarded-for"),
        details: {
          activityId: activity?.id || null,
          type: activity?.type || null,
          targetUserId: body?.userId || null,
        },
      });

      return new Response(JSON.stringify({ activity }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      logAudit({
        event: "admin_recent_activity_create_error",
        userId: user.id,
        ip: req.headers.get("x-forwarded-for"),
        details: { error: error instanceof Error ? error.message : String(error) },
      });

      if (error instanceof AppError) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: error.statusCode,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "حدث خطأ أثناء إضافة النشاط" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
  ["admin"],
);
