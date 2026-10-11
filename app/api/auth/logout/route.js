import { NextResponse } from "next/server";
import { AppError } from "../../../../src/lib/errors/appError";
import { sessionService } from "../../../../src/services/auth";
import { jsonNoStore } from "../../../../src/lib/http/jsonResponse";

export async function POST(request) {
  try {
    const result = await sessionService.logout(request);
    const response = jsonNoStore(result);

    const isProd = process.env.NODE_ENV === "production";
    response.cookies.set("token", "", {
      httpOnly: true,
      path: "/",
      maxAge: 0,
      sameSite: isProd ? "none" : "lax",
      secure: isProd,
    });

    return response;
  } catch (error) {
    if (error instanceof AppError) {
      return jsonNoStore({ error: error.message }, { status: error.statusCode });
    }

    console.error("/api/auth/logout error", error);
    return jsonNoStore({ error: "server_error" }, { status: 500 });
  }
}
