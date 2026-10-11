import { NextResponse } from "next/server";
import { extractBearerToken } from "../../../../src/lib/auth/authRequestService";
import { sessionService } from "../../../../src/services/auth";
import { jsonNoStore } from "../../../../src/lib/http/jsonResponse";

export async function POST(request) {
  try {
    let token = extractBearerToken(request);
    if (!token) {
      const contentType = request.headers.get("content-type") || "";
      if (contentType.toLowerCase().includes("application/json")) {
        const body = await request.json().catch(() => null);
        if (!body) {
          return jsonNoStore({ error: "invalid_json" }, { status: 400 });
        }
        token = typeof body?.token === "string" ? body.token.trim() : null;
      }
    }

    const revoked = await sessionService.isRevoked(token);
    return jsonNoStore({ revoked: Boolean(revoked) });
  } catch (e) {
    console.error("/api/auth/is-revoked error", e);
    return jsonNoStore({ revoked: false }, { status: 500 });
  }
}
