import { NextResponse } from "next/server";
import { AppError } from "../../../../src/lib/errors/appError";
import { sessionService } from "../../../../src/services/auth";
import { jsonNoStore } from "../../../../src/lib/http/jsonResponse";

export async function GET(request) {
  try {
    const result = await sessionService.whoAmI(request);
    return jsonNoStore(result);
  } catch (error) {
    if (error instanceof AppError) {
      return jsonNoStore({ error: error.code }, { status: error.statusCode });
    }

    console.error("/api/auth/whoami error", error);
    return jsonNoStore({ error: "server_error" }, { status: 500 });
  }
}
