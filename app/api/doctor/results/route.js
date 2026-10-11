import { withRBAC } from "../../../../lib/auth/withRBAC";
import { rateLimit } from "../../../../lib/security/rateLimiter";
import { logAudit } from "../../../../lib/security/auditLogger";
import { AppError } from "../../../../src/lib/errors/appError";
import { doctorPortalService } from "../../../../src/services/doctor";

// GET /api/doctor/results
export const GET = withRBAC(
  async (request, user) => {
    const rl = await rateLimit(request);
    if (rl.limited) {
      logAudit({
        event: "rate_limit_exceeded",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: { endpoint: "GET /api/doctor/results" },
      });
      return Response.json({ error: "Rate limit exceeded" }, { status: 429 });
    }
    try {
      const { searchParams } = new URL(request.url);
      const patientId = (searchParams.get("patientId") || "").trim();
      const result = await doctorPortalService.listResults({
        userId: user.id,
        ...(patientId ? { patientId } : {}),
      });
      logAudit({
        event: "doctor_results_viewed",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: { count: result.records.length },
      });
      return Response.json(result, { status: 200 });
    } catch (err) {
      logAudit({
        event: "doctor_results_view_error",
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

// PATCH /api/doctor/results
// Body: { id: string, reviewedByDoctor?: boolean, doctorNotes?: string|null }
export const PATCH = withRBAC(
  async (request, user) => {
    const rl = await rateLimit(request);
    if (rl.limited) {
      logAudit({
        event: "rate_limit_exceeded",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: { endpoint: "PATCH /api/doctor/results" },
      });
      return Response.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    let requestBody = {};
    try {
      const contentType = request.headers.get("content-type") || "";
      if (!contentType.toLowerCase().includes("application/json")) {
        return Response.json({ error: "invalid_content_type" }, { status: 400 });
      }

      requestBody = await request.json().catch(() => null);
      if (!requestBody) {
        return Response.json({ error: "invalid_json" }, { status: 400 });
      }

      const result = await doctorPortalService.updateResult({
        userId: user.id,
        id: requestBody?.id,
        reviewedByDoctor: requestBody?.reviewedByDoctor,
        doctorNotes: requestBody?.doctorNotes,
        clinicalStatus: requestBody?.clinicalStatus,
      });

      logAudit({
        event: "doctor_results_updated",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: {
          id: requestBody?.id || null,
          reviewedByDoctor: Boolean(requestBody?.reviewedByDoctor),
          hasNotes: Boolean(requestBody?.doctorNotes),
        },
      });

      return Response.json(result, { status: 200 });
    } catch (err) {
      if (err instanceof AppError && err.message === "not_found") {
        logAudit({
          event: "doctor_results_update_denied",
          userId: user.id,
          ip: request.headers.get("x-forwarded-for"),
          details: { id: requestBody?.id || null },
        });
      }

      logAudit({
        event: "doctor_results_update_error",
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
