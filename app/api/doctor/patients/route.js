import { withRBAC } from "../../../../lib/auth/withRBAC";
import { rateLimit } from "../../../../lib/security/rateLimiter";
import { logAudit } from "../../../../lib/security/auditLogger";
import { AppError } from "../../../../src/lib/errors/appError";
import { doctorPortalService } from "../../../../src/services/doctor";

// GET /api/doctor/patients
export const GET = withRBAC(
  async (request, user) => {
    const rl = await rateLimit(request);
    if (rl.limited) {
      logAudit({
        event: "rate_limit_exceeded",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: { endpoint: "GET /api/doctor/patients" },
      });
      return Response.json({ error: "Rate limit exceeded" }, { status: 429 });
    }
    try {
      const shaped = await doctorPortalService.listPatients(user.id);
      logAudit({
        event: "doctor_patients_listed",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: { count: shaped.length },
      });
      return Response.json(shaped);
    } catch (error) {
      logAudit({
        event: "doctor_patients_list_error",
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
  ["doctor"],
);
