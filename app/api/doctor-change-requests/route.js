import { NextResponse } from "next/server";
import { withRBAC } from "../../../lib/auth/withRBAC";
import { rateLimit } from "../../../lib/security/rateLimiter";
import { logAudit } from "../../../lib/security/auditLogger";
import { AppError } from "../../../src/lib/errors/appError";
import { patientDoctorChangeRequestService } from "../../../src/services/patient";

// ==============================
// GET /api/doctor-change-requests
// ==============================
// هذا المسار يستخدمه المريض لجلب قائمة الأطباء (النشطين أو المعلقين)
// ليختار طبيبًا جديدًا عند طلب تغيير الطبيب
export const GET = withRBAC(
  async (request, user) => {
    // تطبيق Rate Limiting لمنع إساءة الاستخدام
    const rl = await rateLimit(request);
    if (rl.limited) {
      // تسجيل محاولة تجاوز الحد في سجل التدقيق
      logAudit({
        event: "rate_limit_exceeded",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: { endpoint: "GET /api/doctor-change-requests" },
      });

      // إرجاع خطأ 429 عند تجاوز الحد
      return NextResponse.json(
        { success: false, error: "Rate limit exceeded" },
        { status: 429 },
      );
    }

    try {
      const result = await patientDoctorChangeRequestService.listDoctorsForPatientChange(
        user.id,
      );

      // تسجيل عملية جلب قائمة الأطباء في سجل التدقيق
      logAudit({
        event: "doctor_change_doctors_listed",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: { count: result.doctors.length },
      });

      // إرجاع القائمة بنجاح
      return NextResponse.json(result);
    } catch (error) {
      if (error instanceof AppError) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: error.statusCode },
        );
      }

      // تسجيل أي خطأ يحدث أثناء جلب البيانات
      logAudit({
        event: "doctor_change_doctors_list_error",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: { error: error instanceof Error ? error.message : String(error) },
      });

      // إرجاع خطأ عام من الخادم
      return NextResponse.json(
        { success: false, error: "Server error" },
        { status: 500 },
      );
    }
  },
  // السماح فقط للمستخدمين بدور "patient"
  ["patient"],
);

// ===============================
// POST /api/doctor-change-requests
// ===============================
// هذا المسار يستخدمه المريض لإرسال طلب تغيير الطبيب الحالي
export const POST = withRBAC(
  async (request, user) => {
    // تطبيق Rate Limiting
    const rl = await rateLimit(request);
    if (rl.limited) {
      // تسجيل تجاوز الحد
      logAudit({
        event: "rate_limit_exceeded",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: { endpoint: "POST /api/doctor-change-requests" },
      });

      return NextResponse.json(
        { success: false, error: "Rate limit exceeded" },
        { status: 429 },
      );
    }

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

      const result = await patientDoctorChangeRequestService.createDoctorChangeRequest({
        userId: user.id,
        requestedDoctorId: body.requestedDoctorId,
        newDoctorId: body.newDoctorId,
        newDoctor: body.newDoctor,
        reason: body.reason,
      });

      // تسجيل عملية إنشاء الطلب في سجل التدقيق
      logAudit({
        event: "doctor_change_requested",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: {
          requestId: result.request?.id || null,
          requestedDoctorId:
            body.requestedDoctorId || body.newDoctorId || body.newDoctor || null,
        },
      });

      // إرجاع الطلب الذي تم إنشاؤه بنجاح
      return NextResponse.json(result, { status: 201 });
    } catch (error) {
      if (error instanceof AppError) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: error.statusCode },
        );
      }

      // تسجيل أي خطأ غير متوقع
      logAudit({
        event: "doctor_change_request_error",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: { error: error instanceof Error ? error.message : String(error) },
      });

      // إرجاع الخطأ
      return NextResponse.json(
        { success: false, error: "Server error" },
        { status: 500 },
      );
    }
  },
  // السماح فقط للمريض بإرسال الطلب
  ["patient"],
);
