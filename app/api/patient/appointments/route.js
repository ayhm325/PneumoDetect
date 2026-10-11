import { NextResponse } from "next/server";
import { withRBAC } from "../../../../lib/auth/withRBAC";
import { rateLimit } from "../../../../lib/security/rateLimiter";
import { logAudit } from "../../../../lib/security/auditLogger";
import { AppError } from "../../../../src/lib/errors/appError";
import { patientPortalService } from "../../../../src/services/patient";

export const GET = withRBAC(
  async (request, user) => {
    const rl = await rateLimit(request);
    if (rl.limited) {
      logAudit({
        event: "rate_limit_exceeded",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: { endpoint: "GET /api/patient/appointments" },
      });
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 },
      );
    }

    try {
      const result = await patientPortalService.listAppointments(user.id);

      logAudit({
        event: "patient_appointments_listed",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: { count: result.appointments.length },
      });

      return NextResponse.json(result, { status: 200 });
    } catch (err) {
      logAudit({
        event: "patient_appointments_list_error",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
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

export const POST = withRBAC(
  async (request, user) => {
    const rl = await rateLimit(request);
    if (rl.limited) {
      logAudit({
        event: "rate_limit_exceeded",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: { endpoint: "POST /api/patient/appointments" },
      });
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 },
      );
    }

    try {
      const contentType = request.headers.get("content-type") || "";
      if (!contentType.toLowerCase().includes("application/json")) {
        return NextResponse.json({ error: "invalid_content_type" }, { status: 400 });
      }

      let body;
      try {
        body = await request.json();
      } catch {
        return NextResponse.json({ error: "invalid_json" }, { status: 400 });
      }

      const result = await patientPortalService.createAppointment({
        userId: user.id,
        doctorId: body?.doctorId,
        scheduledAt: body?.scheduledAt,
        reason: body?.reason,
        location: body?.location,
        phone: body?.phone,
      });

      logAudit({
        event: "patient_appointment_created",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: { appointmentId: result.appointment?.id || null },
      });

      return NextResponse.json(result, { status: 201 });
    } catch (err) {
      logAudit({
        event: "patient_appointment_create_error",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
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
