import { withRBAC } from "../../../../../lib/auth/withRBAC";
import { rateLimit } from "../../../../../lib/security/rateLimiter";
import { logAudit } from "../../../../../lib/security/auditLogger";
import { AppError } from "../../../../../src/lib/errors/appError";
import { adminPatientService } from "../../../../../src/services/admin";

/* ============================================================================
   PATCH /api/admin/patients/[id]
   - تعديل بيانات المريض والمستخدم المرتبط
   - تحديث الطبيب المعين للمريض (Doctor)
   - تحديث حالة المريض وعكسها على isActive للمستخدم
   - إشعار الطبيب الجديد عند تغييره (best-effort)
============================================================================ */
export const PATCH = withRBAC(
  async (request, user, context) => {
    const rl = await rateLimit(request);
    if (rl.limited) {
      logAudit({
        event: "rate_limit_exceeded",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: { endpoint: "PATCH /api/admin/patients/[id]" },
      });
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded" }),
        { status: 429 }
      );
    }

    const resolvedParams =
      typeof context?.params?.then === "function"
        ? await context.params
        : context?.params;
    const id = String(resolvedParams?.id || "").trim();
    if (!id) {
      return new Response(JSON.stringify({ error: "Missing patient id" }), {
        status: 400,
      });
    }

    try {
      const contentType = request.headers.get("content-type") || "";
      if (!contentType.toLowerCase().includes("application/json")) {
        return new Response(JSON.stringify({ error: "invalid_content_type" }), {
          status: 400,
        });
      }

      const body = await request.json().catch(() => null);
      if (!body) {
        return new Response(JSON.stringify({ error: "invalid_json" }), {
          status: 400,
        });
      }

      const patient = await adminPatientService.updatePatientById({
        id,
        name: body?.name,
        email: body?.email,
        phone: body?.phone,
        gender: body?.gender,
        doctorId: body?.doctorId,
        status: body?.status,
        bloodType: body?.bloodType,
        birthDate: body?.birthDate,
        medicalId: body?.medicalId,
      });

      logAudit({
        event: "admin_patient_updated",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: { patientId: id },
      });

      return new Response(JSON.stringify(patient), { status: 200 });
    } catch (error) {
      logAudit({
        event: "admin_patient_update_error",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: {
          patientId: id,
          error: error instanceof Error ? error.message : String(error),
        },
      });

      if (error instanceof AppError) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: error.statusCode,
        });
      }

      return new Response(JSON.stringify({ error: "Server error" }), {
        status: 500,
      });
    }
  },
  ["admin"],
);
