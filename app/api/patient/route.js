import { NextResponse } from "next/server";
import { AppError } from "../../../src/lib/errors/appError";
import { authService } from "../../../src/services/auth";

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

    const result = await authService.registerPatient({
      email: body?.email,
      password: body?.password,
      fullName: body?.fullName,
      phone: body?.phone,
      doctorId: body?.doctorId,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
