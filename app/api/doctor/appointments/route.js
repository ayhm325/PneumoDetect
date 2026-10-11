import { withRBAC } from "../../../../lib/auth/withRBAC";
import { rateLimit } from "../../../../lib/security/rateLimiter";
import { logAudit } from "../../../../lib/security/auditLogger";
import { AppError } from "../../../../src/lib/errors/appError";
import { doctorPortalService } from "../../../../src/services/doctor";

// GET /api/doctor/appointments
export const GET = withRBAC(
  async (request, user) => {
    const rl = await rateLimit(request);
    if (rl.limited) {
      logAudit({
        event: "rate_limit_exceeded",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: { endpoint: "GET /api/doctor/appointments" },
      });
      return Response.json({ error: "Rate limit exceeded" }, { status: 429 });
    }
    try {
      const result = await doctorPortalService.listAppointments(user.id);
      logAudit({
        event: "doctor_appointments_listed",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: { count: result.appointments.length },
      });
      return Response.json(result, { status: 200 });
    } catch (err) {
      logAudit({
        event: "doctor_appointments_list_error",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: { error: err instanceof Error ? err.message : String(err) },
      });

      if (err instanceof AppError) {
        return Response.json({ error: err.message }, { status: err.statusCode });
      }

      return Response.json({ error: "Server error" }, { status: 500 });
    }
  },
  ["doctor"],
);

// POST /api/doctor/appointments
export const POST = withRBAC(
  async (request, user) => {
    const rl = await rateLimit(request);
    if (rl.limited) {
      logAudit({
        event: "rate_limit_exceeded",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: { endpoint: "POST /api/doctor/appointments" },
      });
      return Response.json({ error: "Rate limit exceeded" }, { status: 429 });
    }
    try {
      const contentType = request.headers.get("content-type") || "";
      if (!contentType.toLowerCase().includes("application/json")) {
        return Response.json({ error: "invalid_content_type" }, { status: 400 });
      }

      let body;
      try {
        body = await request.json();
      } catch {
        return Response.json({ error: "invalid_json" }, { status: 400 });
      }

      const result = await doctorPortalService.createAppointment({
        userId: user.id,
        patientId: body?.patientId,
        scheduledAt: body?.scheduledAt,
        reason: body?.reason,
        location: body?.location,
        type: body?.type,
      });

      logAudit({
        event: "doctor_appointment_created",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: {
          appointmentId: result.appointment?.id || null,
          patientId: body?.patientId || null,
        },
      });

      return Response.json(result, { status: 201 });
    } catch (err) {
      logAudit({
        event: "doctor_appointment_create_error",
        userId: user?.id,
        ip: request?.headers?.get("x-forwarded-for"),
        details: { error: err instanceof Error ? err.message : String(err) },
      });

      if (err instanceof AppError) {
        return Response.json({ error: err.message }, { status: err.statusCode });
      }

      return Response.json({ error: "Server error" }, { status: 500 });
    }
  },
  ["doctor"],
);
