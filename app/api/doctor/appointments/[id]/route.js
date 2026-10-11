import { NextResponse } from "next/server";
import { withRBAC } from "../../../../../lib/auth/withRBAC";
import { rateLimit } from "../../../../../lib/security/rateLimiter";
import { logAudit } from "../../../../../lib/security/auditLogger";
import { AppError } from "../../../../../src/lib/errors/appError";
import { doctorPortalService } from "../../../../../src/services/doctor";

export const PATCH = withRBAC(
  async (request, user, paramsArg) => {
    const rl = await rateLimit(request);
    if (rl.limited) {
      logAudit({
        event: "rate_limit_exceeded",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: { endpoint: "PATCH /api/doctor/appointments/[id]" },
      });
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 },
      );
    }

    try {
      let params =
        typeof paramsArg?.then === "function" ? await paramsArg : paramsArg;
      if (params && params.params) params = params.params;
      const id = String(params?.id || "").trim();
      if (!id) {
        return NextResponse.json({ error: "Missing id" }, { status: 400 });
      }

      const contentType = request.headers.get("content-type") || "";
      if (!contentType.toLowerCase().includes("application/json")) {
        return NextResponse.json({ error: "invalid_content_type" }, { status: 400 });
      }

      const body = await request.json().catch(() => null);
      if (!body) {
        return NextResponse.json({ error: "invalid_json" }, { status: 400 });
      }

      const action = body?.action || body?.status;

      const result = await doctorPortalService.patchAppointment({
        userId: user.id,
        id,
        action,
        scheduledAt: body?.scheduledAt,
        newScheduledAt: body?.newScheduledAt,
      });

      if (action === "cancel" || action === "cancelled") {
        logAudit({
          event: "doctor_appointment_cancelled",
          userId: user.id,
          ip: request.headers.get("x-forwarded-for"),
          details: { appointmentId: id },
        });
      } else if (["confirm", "confirmed", "complete", "completed"].includes(String(action || ""))) {
        logAudit({
          event: "doctor_appointment_completed",
          userId: user.id,
          ip: request.headers.get("x-forwarded-for"),
          details: { appointmentId: id },
        });
      } else if (action === "reschedule") {
        logAudit({
          event: "doctor_appointment_rescheduled",
          userId: user.id,
          ip: request.headers.get("x-forwarded-for"),
          details: { appointmentId: id, scheduledAt: body?.scheduledAt || body?.newScheduledAt || null },
        });
      }

      return NextResponse.json(result, { status: 200 });
    } catch (err) {
      logAudit({
        event: "doctor_appointment_patch_error",
        userId: user?.id,
        ip: request.headers.get("x-forwarded-for"),
        details: { error: err instanceof Error ? err.message : String(err) },
      });

      if (err instanceof AppError) {
        return NextResponse.json({ error: err.message }, { status: err.statusCode });
      }

      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
  },
  ["doctor"],
);

export const DELETE = withRBAC(
  async (request, user, paramsArg) => {
    const rl = await rateLimit(request);
    if (rl.limited) {
      logAudit({
        event: "rate_limit_exceeded",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: { endpoint: "DELETE /api/doctor/appointments/[id]" },
      });
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 },
      );
    }

    try {
      let params =
        typeof paramsArg?.then === "function" ? await paramsArg : paramsArg;
      if (params && params.params) params = params.params;

      const id = params?.id;
      if (!id) {
        return NextResponse.json({ error: "Missing id" }, { status: 400 });
      }

      const result = await doctorPortalService.deleteAppointment({
        userId: user.id,
        id,
      });

      logAudit({
        event: "doctor_appointment_deleted",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: { appointmentId: id || null },
      });

      return NextResponse.json(result, { status: 200 });
    } catch (err) {
      logAudit({
        event: "doctor_appointment_delete_error",
        userId: user?.id,
        ip: request.headers.get("x-forwarded-for"),
        details: { error: err instanceof Error ? err.message : String(err) },
      });

      if (err instanceof AppError) {
        return NextResponse.json({ error: err.message }, { status: err.statusCode });
      }

      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
  },
  ["doctor"],
);
