import { withRBAC } from "../../../../../lib/auth/withRBAC";
import { AppError } from "../../../../../src/lib/errors/appError";
import { adminDoctorService } from "../../../../../src/services/admin";

/* =========================================================================
   PATCH: تعديل بيانات الطبيب
   - تحديث بيانات المستخدم (User)
   - تحديث بيانات الطبيب (Doctor)
   - مزامنة حالة الدخول isActive مع حالة الطبيب الرسمية status
   - تسجيل النشاط في Activity
   ========================================================================= */
export const PATCH = withRBAC(async (request, _user, context) => {
  const resolvedParams =
    typeof context?.params?.then === "function"
      ? await context.params
      : context?.params;
  const id = String(resolvedParams?.id || "").trim();
  if (!id) {
    return Response.json({ error: "missing_doctor_id" }, { status: 400 });
  }

  try {
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.toLowerCase().includes("application/json")) {
      return Response.json({ error: "invalid_content_type" }, { status: 400 });
    }

    const data = await request.json().catch(() => null);
    if (!data) {
      return Response.json({ error: "invalid_json" }, { status: 400 });
    }

    const result = await adminDoctorService.updateDoctorByUserId({
      userId: id,
      fullName: data?.fullName,
      email: data?.email,
      phone: data?.phone,
      licenseNumber: data?.licenseNumber,
      clinic: typeof data?.clinic === "undefined" ? undefined : data.clinic,
      status: data?.status,
    });

    return Response.json(result);
  } catch (error) {
    if (error instanceof AppError) {
      return Response.json({ error: error.message }, { status: error.statusCode });
    }

    return Response.json(
      { error: "حدث خطأ أثناء تعديل بيانات الطبيب" },
      { status: 500 },
    );
  }
}, ["admin"]);

/* =========================================================================
   DELETE: حظر الطبيب (Soft Block)
   - لا يتم الحذف من قاعدة البيانات
   - تغيير الحالة إلى banned
   - تعطيل تسجيل الدخول للمستخدم
   - تسجيل النشاط
   ========================================================================= */
export const DELETE = withRBAC(async (_request, _user, context) => {
  const resolvedParams =
    typeof context?.params?.then === "function"
      ? await context.params
      : context?.params;
  const id = String(resolvedParams?.id || "").trim();
  if (!id) {
    return Response.json({ error: "missing_doctor_id" }, { status: 400 });
  }

  try {
    const result = await adminDoctorService.blockDoctorByUserId({ userId: id });
    return Response.json(result);
  } catch (error) {
    if (error instanceof AppError) {
      return Response.json({ error: error.message }, { status: error.statusCode });
    }

    return Response.json(
      { error: "حدث خطأ أثناء حظر الطبيب" },
      { status: 500 },
    );
  }
}, ["admin"]);
