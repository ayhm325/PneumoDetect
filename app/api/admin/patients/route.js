import { withRBAC } from "../../../../lib/auth/withRBAC";
import { rateLimit } from "../../../../lib/security/rateLimiter";
import { logAudit } from "../../../../lib/security/auditLogger";
import { AppError } from "../../../../src/lib/errors/appError";
import { adminPatientService } from "../../../../src/services/admin";

/* ============================================================================
   GET /api/admin/patients
   - جلب قائمة المرضى مع بيانات المستخدم والطبيب المرتبط وعدد المواعيد والسجلات الطبية
============================================================================ */
export const GET = withRBAC(
  async (request, user) => {
    const rl = await rateLimit(request);
    if (rl.limited) {
      logAudit({
        event: "rate_limit_exceeded",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: { endpoint: "GET /api/admin/patients" },
      });
      return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
        status: 429,
      });
    }

    try {
      const patients = await adminPatientService.listPatients();

      logAudit({
        event: "admin_patients_listed",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: { count: patients.length },
      });

      return new Response(JSON.stringify(patients), { status: 200 });
    } catch (error) {
      logAudit({
        event: "admin_patients_list_error",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: { error: error instanceof Error ? error.message : String(error) },
      });

      if (error instanceof AppError) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: error.statusCode,
        });
      }

      return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
    }
  },
  ["admin"],
);

/* ============================================================================
   POST /api/admin/patients
   - إضافة مريض جديد مع إنشاء مستخدم مرتبط
   - ربط المريض بطبيب عند وجود doctorId
   - إشعار الطبيب الجديد (best-effort)
============================================================================ */
export const POST = withRBAC(
  async (request, user) => {
    const rl = await rateLimit(request);
    if (rl.limited) {
      logAudit({
        event: "rate_limit_exceeded",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: { endpoint: "POST /api/admin/patients" },
      });
      return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
        status: 429,
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

      const patient = await adminPatientService.createPatient({
        name: body?.name,
        email: body?.email,
        phone: body?.phone,
        gender: body?.gender,
        bloodType: body?.bloodType,
        birthDate: body?.birthDate,
        status: body?.status,
        medicalId: body?.medicalId,
        doctorId: body?.doctorId,
        password: body?.password,
      });

      logAudit({
        event: "admin_patient_created",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: { patientId: patient.id },
      });

      return new Response(JSON.stringify(patient), { status: 201 });
    } catch (error) {
      logAudit({
        event: "admin_patient_create_error",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: { error: error instanceof Error ? error.message : String(error) },
      });

      if (error instanceof AppError) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: error.statusCode,
        });
      }

      return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
    }
  },
  ["admin"],
);
