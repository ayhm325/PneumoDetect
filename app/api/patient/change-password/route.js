import { NextResponse } from "next/server";
import { AppError } from "../../../../src/lib/errors/appError";
import { passwordService } from "../../../../src/services/auth";

export async function POST(request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.toLowerCase().includes("application/json")) {
      return NextResponse.json({ error: "invalid_content_type" }, { status: 400 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "invalid_json" }, { status: 400 });
    }

    const result = await passwordService.changePasswordForAuthenticatedUser({
      request,
      oldPassword: body?.oldPassword,
      newPassword: body?.newPassword,
      tokenFallback: body?.token,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    console.error("/api/patient/change-password error", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
