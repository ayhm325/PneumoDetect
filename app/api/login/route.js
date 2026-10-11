import { NextResponse } from "next/server";
import { AppError } from "../../../src/lib/errors/appError";
import { authService } from "../../../src/services/auth";
import { jsonNoStore } from "../../../src/lib/http/jsonResponse";

export async function POST(request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.toLowerCase().includes("application/json")) {
      return jsonNoStore({ error: "invalid_content_type" }, { status: 400 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return jsonNoStore({ error: "invalid_json" }, { status: 400 });
    }

    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("host") ||
      null;

    const result = await authService.login({
      email: body?.email,
      password: body?.password,
      ip,
    });

    const responseBody = { user: result.user };
    if (result.tokenForDev) responseBody.tokenForDev = result.tokenForDev;

    const response = NextResponse.json(responseBody, { status: 200 });
    response.headers.set("Cache-Control", "no-store");
    const isProd = process.env.NODE_ENV === "production";

    response.cookies.set("token", result.token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      path: "/",
      maxAge: 60 * 60 * 2,
    });

    return response;
  } catch (error) {
    if (error instanceof AppError) {
      return jsonNoStore({ error: error.message }, { status: error.statusCode });
    }

    console.error("[LOGIN ERROR]", error);
    return jsonNoStore({ error: "حدث خطأ في الخادم" }, { status: 500 });
  }
}
