import { NextResponse } from "next/server";
import { withRBAC } from "../../../../lib/auth/withRBAC";
import { rateLimit } from "../../../../lib/security/rateLimiter";
import { logAudit } from "../../../../lib/security/auditLogger";
import { AppError } from "../../../../src/lib/errors/appError";
import { adminDoctorChangeRequestService } from "../../../../src/services/admin";

export const GET = withRBAC(
  async (request, user) => {
    const rl = await rateLimit(request);
    if (rl.limited) {
      logAudit({
        event: "rate_limit_exceeded",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: {
          endpoint: "GET /api/admin/doctor-change-requests",
        },
      });
      return NextResponse.json(
        { success: false, error: "Rate limit exceeded" },
        { status: 429 },
      );
    }

    try {
      const all = request?.nextUrl?.searchParams?.get("all") === "1";
      const result = await adminDoctorChangeRequestService.listRequests({ all });

      logAudit({
        event: "admin_doctor_change_requests_viewed",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: { count: result.requests.length },
      });

      return NextResponse.json(result);
    } catch (error) {
      logAudit({
        event: "admin_doctor_change_requests_view_error",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: { error: error instanceof Error ? error.message : String(error) },
      });

      if (error instanceof AppError) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: error.statusCode },
        );
      }

      return NextResponse.json(
        { success: false, error: "Server error" },
        { status: 500 },
      );
    }
  },
  ["admin"],
);

export const PATCH = withRBAC(
  async (request, user) => {
    const rl = await rateLimit(request);
    if (rl.limited) {
      logAudit({
        event: "rate_limit_exceeded",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: {
          endpoint: "PATCH /api/admin/doctor-change-requests",
        },
      });
      return NextResponse.json(
        { success: false, error: "Rate limit exceeded" },
        { status: 429 },
      );
    }

    let id = "";
    let action = "";

    try {
      const contentType = request.headers.get("content-type") || "";
      if (!contentType.toLowerCase().includes("application/json")) {
        return NextResponse.json(
          { success: false, error: "invalid_content_type" },
          { status: 400 },
        );
      }

      const body = await request.json().catch(() => null);
      if (!body) {
        return NextResponse.json(
          { success: false, error: "invalid_json" },
          { status: 400 },
        );
      }

      id = String(body?.id || "").trim();
      action = String(body?.action || "").trim();

      const result = await adminDoctorChangeRequestService.actOnRequest({
        id,
        action,
      });

      if (action === "approve") {
        const patientId =
          result && typeof result === "object" && "request" in result
            ? (result.request?.details?.patientId ?? null)
            : null;
        const requestedDoctorId =
          result && typeof result === "object" && "request" in result
            ? (result.request?.details?.requestedDoctorId ?? null)
            : null;

        logAudit({
          event: "admin_doctor_change_request_approved",
          userId: user.id,
          ip: request.headers.get("x-forwarded-for"),
          details: {
            id,
            patientId,
            requestedDoctorId,
          },
        });
      } else if (action === "reject") {
        logAudit({
          event: "admin_doctor_change_request_rejected",
          userId: user.id,
          ip: request.headers.get("x-forwarded-for"),
          details: { id },
        });
      }

      return NextResponse.json(result);
    } catch (error) {
      if (error instanceof AppError) {
        if (error.message.includes("not pending")) {
          logAudit({
            event: "admin_doctor_change_request_non_pending",
            userId: user.id,
            ip: request.headers.get("x-forwarded-for"),
            details: {
              id,
              action,
              ...(error.details || {}),
            },
          });
        }

        return NextResponse.json(
          {
            success: false,
            error: error.message,
            ...(error.details || {}),
          },
          { status: error.statusCode },
        );
      }

      logAudit({
        event: "admin_doctor_change_request_action_error",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: { error: error instanceof Error ? error.message : String(error) },
      });

      return NextResponse.json(
        { success: false, error: "Server error" },
        { status: 500 },
      );
    }
  },
  ["admin"],
);
