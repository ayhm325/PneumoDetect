import { AppError } from "../../../../src/lib/errors/appError";
import { passwordService } from "../../../../src/services/auth";

export async function POST(request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.toLowerCase().includes("application/json")) {
      return Response.json({ error: "invalid_content_type" }, { status: 400 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "invalid_json" }, { status: 400 });
    }

    const result = await passwordService.changePasswordByEmail({
      email: body?.email,
      currentPassword: body?.currentPassword,
      newPassword: body?.newPassword,
    });

    return Response.json(result);
  } catch (error) {
    if (error instanceof AppError) {
      return Response.json({ error: error.message }, { status: error.statusCode });
    }

    console.error("doctor change-password error", error);
    return Response.json({ error: "server_error" }, { status: 500 });
  }
}
