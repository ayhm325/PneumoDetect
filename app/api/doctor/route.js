import { authService } from "../../../src/services/auth";
import { AppError } from "../../../src/lib/errors/appError";

export async function POST(request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.toLowerCase().includes("application/json")) {
      return Response.json({ error: "invalid_content_type" }, { status: 400 });
    }

    let data;
    try {
      data = await request.json();
    } catch {
      return Response.json({ error: "invalid_json" }, { status: 400 });
    }

    const result = await authService.registerDoctor({
      email: data?.email,
      password: data?.password,
      fullName: data?.fullName,
      licenseNumber: data?.licenseNumber,
      phone: data?.phone,
    });

    return Response.json(result);
  } catch (error) {
    if (error instanceof AppError) {
      const details = error.details;
      const errorCode =
        details && typeof details === "object" && "errorCode" in details
          ? details.errorCode
          : undefined;

      const payload = errorCode
        ? { errorCode, error: error.message }
        : { error: error.message };

      return Response.json(payload, { status: error.statusCode });
    }

    console.error("تفاصيل الخطأ أثناء تسجيل الطبيب:", error);
    return Response.json({ error: "حدث خطأ أثناء التسجيل" }, { status: 500 });
  }
}
