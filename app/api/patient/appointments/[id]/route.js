import { NextResponse } from "next/server";
import { withRBAC } from "../../../../../lib/auth/withRBAC";
import { rateLimit } from "../../../../../lib/security/rateLimiter";
import { logAudit } from "../../../../../lib/security/auditLogger";
import { AppError } from "../../../../../src/lib/errors/appError";
import { patientPortalService } from "../../../../../src/services/patient";

export const PATCH = withRBAC(
  async (request, user, paramsArg) => {
    const rl = await rateLimit(request);
    if (rl.limited) {
      logAudit({
        event: "rate_limit_exceeded",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: { endpoint: "PATCH /api/patient/appointments/[id]" },
      });
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 },
      );
    }

    try {
      let params =
        typeof paramsArg?.then === "function" ? await paramsArg : paramsArg;
      if (params?.params) params = params.params;

      const id = String(params?.id || "").trim();
      if (!id) {
        return NextResponse.json({ error: "missing_id" }, { status: 400 });
      }

      const contentType = request.headers.get("content-type") || "";
      if (!contentType.toLowerCase().includes("application/json")) {
        return NextResponse.json({ error: "invalid_content_type" }, { status: 400 });
      }

      const body = await request.json().catch(() => null);
      if (!body) {
        return NextResponse.json({ error: "invalid_json" }, { status: 400 });
      }

      const result = await patientPortalService.patchAppointment({
        userId: user.id,
        appointmentId: id,
        action: body?.action || body?.status,
        patientReason: body?.patientReason,
        reason: body?.reason,
      });

      const action = String(body?.action || body?.status || "").trim();
      if (action === "confirm" || action === "confirmed") {
        logAudit({
          event: "patient_appointment_confirmed",
          userId: user.id,
          ip: request.headers.get("x-forwarded-for"),
          details: { appointmentId: id },
        });
      } else if (action === "cancel" || action === "cancelled") {
        logAudit({
          event: "patient_appointment_cancelled",
          userId: user.id,
          ip: request.headers.get("x-forwarded-for"),
          details: { appointmentId: id, patientReason: body?.patientReason || body?.reason || null },
        });
      } else if (action === "delete" || action === "remove") {
        logAudit({
          event: "patient_appointment_deleted",
          userId: user.id,
          ip: request.headers.get("x-forwarded-for"),
          details: { appointmentId: id },
        });
      }

      return NextResponse.json(result, { status: 200 });
    } catch (err) {
      logAudit({
        event: "patient_appointment_patch_error",
        userId: user?.id,
        ip: request.headers.get("x-forwarded-for"),
        details: {
          error: err instanceof Error ? err.message : String(err),
          stack: err instanceof Error ? err.stack : undefined,
        },
      });

      const isProd = process.env.NODE_ENV === "production";
      if (err instanceof AppError) {
        return NextResponse.json(
          isProd
            ? { error: err.message }
            : {
                error: err.message,
                debug: {
                  message: err.message,
                  details: err.details || null,
                },
              },
          { status: err.statusCode },
        );
      }

      return NextResponse.json(
        isProd
          ? { error: "Server error" }
          : {
              error: "Server error",
              debug: {
                message: err instanceof Error ? err.message : String(err),
                stack: err instanceof Error ? err.stack : null,
              },
            },
        { status: 500 },
      );
    }
  },
  ["patient"],
);

export const DELETE = withRBAC(
  async (_request, user, paramsArg) => {
    const rl = await rateLimit(_request);
    if (rl.limited) {
      logAudit({
        event: "rate_limit_exceeded",
        userId: user.id,
        ip: _request.headers.get("x-forwarded-for"),
        details: { endpoint: "DELETE /api/patient/appointments/[id]" },
      });
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 },
      );
    }

    try {
      let params =
        typeof paramsArg?.then === "function" ? await paramsArg : paramsArg;
      if (params?.params) params = params.params;

      const id = String(params?.id || "");
      const result = await patientPortalService.deleteAppointment({
        userId: user.id,
        appointmentId: id,
      });

      logAudit({
        event: "patient_appointment_deleted",
        userId: user.id,
        ip: _request.headers.get("x-forwarded-for"),
        details: { appointmentId: id },
      });

      return NextResponse.json(result, { status: 200 });
    } catch (err) {
      logAudit({
        event: "patient_appointment_delete_error",
        userId: user?.id,
        ip: _request.headers.get("x-forwarded-for"),
        details: { error: err instanceof Error ? err.message : String(err) },
      });

      if (err instanceof AppError) {
        return NextResponse.json({ error: err.message }, { status: err.statusCode });
      }

      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
  },
  ["patient"],
);
