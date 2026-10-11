import { NextResponse } from "next/server";
import { withRBAC } from "../../../../lib/auth/withRBAC";
import { rateLimit } from "../../../../lib/security/rateLimiter";
import { logAudit } from "../../../../lib/security/auditLogger";
import { AppError } from "../../../../src/lib/errors/appError";
import { patientPortalService } from "../../../../src/services/patient";


// دالة مساعدة لتقليل التكرار: تحقق من rateLimit وسجل Audit
async function checkRateLimitAndAudit(request, user, endpoint) {
  const rl = await rateLimit(request);
  if (rl.limited) {
    logAudit({
      event: "rate_limit_exceeded",
      userId: user.id,
      ip: request.headers.get("x-forwarded-for"),
      details: { endpoint },
    });
    return true;
  }
  return false;
}

export const HEAD = withRBAC(
  async (request, user) => {
    if (await checkRateLimitAndAudit(request, user, "HEAD /api/patient/notifications")) {
      return new Response(null, {
        status: 429,
        headers: {
          "X-Unread-Count": "0",
          "Access-Control-Expose-Headers": "X-Unread-Count"
        },
      });
    }
    try {
      const unread = await patientPortalService.getUnreadNotificationsCount(user.id);
      return new Response(null, {
        status: 200,
        headers: {
          "X-Unread-Count": String(unread),
          "Access-Control-Expose-Headers": "X-Unread-Count"
        },
      });
    } catch (e) {
      logAudit({
        event: "patient_notifications_unread_error",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: { error: e instanceof Error ? e.message : String(e) },
      });
      return new Response(null, {
        status: 200,
        headers: {
          "X-Unread-Count": "0",
          "Access-Control-Expose-Headers": "X-Unread-Count"
        },
      });
    }
  },
  ["patient"],
);

export const GET = withRBAC(
  async (request, user) => {
    if (await checkRateLimitAndAudit(request, user, "GET /api/patient/notifications")) {
      return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    }
    try {
      const url = new URL(request.url);
      const cursor = url.searchParams.get("cursor");
      const take = Number(url.searchParams.get("take")) || 20;

      const result = await patientPortalService.listNotifications({
        userId: user.id,
        cursor,
        take,
      });

      logAudit({
        event: "patient_notifications_listed",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: { count: result.notifications.length },
      });

      return NextResponse.json(result, { status: 200 });
    } catch (e) {
      logAudit({
        event: "patient_notifications_list_error",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: { error: e instanceof Error ? e.message : String(e) },
      });

      if (e instanceof AppError) {
        return NextResponse.json({ error: e.message }, { status: e.statusCode });
      }

      return NextResponse.json({ error: "server_error" }, { status: 500 });
    }
  },
  ["patient"],
);

export const PUT = withRBAC(
  async (request, user) => {
    if (await checkRateLimitAndAudit(request, user, "PUT /api/patient/notifications")) {
      return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    }
    try {
      const hasIdParam = request.nextUrl.searchParams.has("id");
      const idValue = request.nextUrl.searchParams.get("id");
      const id = typeof idValue === "string" ? idValue.trim() : null;
      if (hasIdParam && !id) {
        return NextResponse.json(
          { error: "Invalid notification id" },
          { status: 400 },
        );
      }

      let body = {};
      const contentType = request.headers.get("content-type") || "";
      if (contentType.toLowerCase().includes("application/json")) {
        body = await request.json().catch(() => null);
        if (!body) {
          return NextResponse.json({ error: "invalid_json" }, { status: 400 });
        }
      }

      const nextIsRead =
        typeof body?.isRead === "boolean" ? body.isRead : undefined;
      const result = await patientPortalService.updateNotifications({
        userId: user.id,
        id,
        isRead: nextIsRead,
      });

      return NextResponse.json(result, { status: 200 });
    } catch (e) {
      logAudit({
        event: "patient_notifications_update_error",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: { error: e instanceof Error ? e.message : String(e) },
      });

      if (e instanceof AppError) {
        return NextResponse.json({ error: e.message }, { status: e.statusCode });
      }

      return NextResponse.json({ error: "server_error" }, { status: 500 });
    }
  },
  ["patient"],
);

export const DELETE = withRBAC(
  async (request, user) => {
    if (await checkRateLimitAndAudit(request, user, "DELETE /api/patient/notifications")) {
      return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    }
    try {
      const hasIdParam = request.nextUrl.searchParams.has("id");
      const idValue = request.nextUrl.searchParams.get("id");
      const id = typeof idValue === "string" ? idValue.trim() : null;
      if (hasIdParam && !id) {
        return NextResponse.json(
          { error: "Invalid notification id" },
          { status: 400 },
        );
      }

      const result = await patientPortalService.deleteNotifications({
        userId: user.id,
        id,
      });

      return NextResponse.json(result, { status: 200 });
    } catch (e) {
      logAudit({
        event: "patient_notifications_delete_error",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: { error: e instanceof Error ? e.message : String(e) },
      });

      if (e instanceof AppError) {
        return NextResponse.json({ error: e.message }, { status: e.statusCode });
      }

      return NextResponse.json({ error: "server_error" }, { status: 500 });
    }
  },
  ["patient"],
);
