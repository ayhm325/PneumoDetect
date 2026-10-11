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
        details: { endpoint: "GET /api/patient/dashboard-stats" },
      });
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 },
      );
    }
    try {
      const result = await patientPortalService.getDashboardStats(user.id);

      logAudit({
        event: "patient_dashboard_stats_viewed",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: { userId: user.id },
      });

      return NextResponse.json(result, { status: 200 });
    } catch (err) {
      logAudit({
        event: "patient_dashboard_stats_error",
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
