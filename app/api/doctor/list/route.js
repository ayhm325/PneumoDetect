import { AppError } from "../../../../src/lib/errors/appError";
import { doctorPortalService } from "../../../../src/services/doctor";

export async function GET(request) {
  try {
    // دعم معامل استعلام لتضمين الأطباء المعلّقين أثناء التطوير
    // استخدم ?includePending=true لإرجاع الأطباء بحالة pending و active
    const url = new URL(request.url);
    const includePendingRequested = url.searchParams.get("includePending") === "true";
    const debugIncludePending = process.env.DEBUG_INCLUDE_PENDING === "true";
    const allowPendingInCurrentEnv = process.env.NODE_ENV !== "production" || debugIncludePending;
    const includePending = includePendingRequested && allowPendingInCurrentEnv;

    const result = await doctorPortalService.listDoctors({ includePending });
    return Response.json(result);
  } catch (error) {
    if (error instanceof AppError) {
      return Response.json({ error: error.message }, { status: error.statusCode });
    }

    return Response.json({ error: "فشل جلب قائمة الأطباء" }, { status: 500 });
  }
}
