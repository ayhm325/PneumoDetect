import { withRBAC } from "../../../../lib/auth/withRBAC";
import { rateLimit } from "../../../../lib/security/rateLimiter";
import { logAudit } from "../../../../lib/security/auditLogger";
import { AppError } from "../../../../src/lib/errors/appError";
import { adminDoctorService } from "../../../../src/services/admin";

/* ============================================================================
   GET /api/admin/doctors
   - جلب جميع الأطباء مع بيانات المستخدم المرتبطة
   - مخصص للأدمن فقط
   - مع Rate Limiting + Audit Log
============================================================================ */
export const GET = withRBAC(
  async (request, user) => {
    const rl = await rateLimit(request);
    if (rl.limited) {
      logAudit({
        event: "rate_limit_exceeded",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: { endpoint: "GET /api/admin/doctors" },
      });
      return Response.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    try {
      const doctors = await adminDoctorService.listDoctors();

      logAudit({
        event: "admin_doctors_listed",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: { count: doctors.length },
      });

      return Response.json({ doctors });
    } catch (error) {
      logAudit({
        event: "admin_doctors_list_error",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: { error: error instanceof Error ? error.message : String(error) },
      });

      if (error instanceof AppError) {
        return Response.json({ error: error.message }, { status: error.statusCode });
      }

      return Response.json(
        { error: "حدث خطأ أثناء جلب الأطباء" },
        { status: 500 },
      );
    }
  },
  ["admin"],
);

/* ============================================================================
   POST /api/admin/doctors
   - إنشاء طبيب جديد
   - إنشاء User + Doctor
   - تفعيل الحساب مباشرة
============================================================================ */
export const POST = withRBAC(
  async (request, user) => {
    const rl = await rateLimit(request);
    if (rl.limited) {
      logAudit({
        event: "rate_limit_exceeded",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: { endpoint: "POST /api/admin/doctors" },
      });
      return Response.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    try {
      const contentType = request.headers.get("content-type") || "";
      if (!contentType.toLowerCase().includes("application/json")) {
        return Response.json({ error: "invalid_content_type" }, { status: 400 });
      }

      const body = await request.json().catch(() => null);
      if (!body) {
        return Response.json({ error: "invalid_json" }, { status: 400 });
      }

      const doctor = await adminDoctorService.createDoctor({
        name: body?.name,
        email: body?.email,
        phone: body?.phone,
        licenseNumber: body?.licenseNumber,
        password: body?.password,
      });

      logAudit({
        event: "admin_doctor_created",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: { doctorId: doctor.userId },
      });

      return Response.json({ doctor });
    } catch (error) {
      logAudit({
        event: "admin_doctor_create_error",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: { error: error instanceof Error ? error.message : String(error) },
      });

      if (error instanceof AppError) {
        return Response.json({ error: error.message }, { status: error.statusCode });
      }

      return Response.json(
        { error: "حدث خطأ أثناء إضافة الطبيب" },
        { status: 500 },
      );
    }
  },
  ["admin"],
);

/* ============================================================================
   PATCH /api/admin/doctors
   - تغيير حالة الطبيب (active / banned / pending)
   - مزامنة حالة الدخول isActive
   - إشعار الطبيب
============================================================================ */
export const PATCH = withRBAC(
  async (request, user) => {
    const rl = await rateLimit(request);
    if (rl.limited) {
      logAudit({
        event: "rate_limit_exceeded",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: { endpoint: "PATCH /api/admin/doctors" },
      });
      return Response.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    try {
      const contentType = request.headers.get("content-type") || "";
      if (!contentType.toLowerCase().includes("application/json")) {
        return Response.json({ error: "invalid_content_type" }, { status: 400 });
      }

      const body = await request.json().catch(() => null);
      if (!body) {
        return Response.json({ error: "invalid_json" }, { status: 400 });
      }

      const id = body?.id;
      const status = body?.status;

      await adminDoctorService.updateDoctorStatus({ id, status });

      logAudit({
        event: "admin_doctor_status_updated",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: { doctorId: id, status },
      });

      return Response.json({ success: true });
    } catch (error) {
      logAudit({
        event: "admin_doctor_status_update_error",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: { error: error instanceof Error ? error.message : String(error) },
      });

      if (error instanceof AppError) {
        return Response.json({ error: error.message }, { status: error.statusCode });
      }

      return Response.json(
        { error: "حدث خطأ أثناء التحديث" },
        { status: 500 },
      );
    }
  },
  ["admin"],
);
