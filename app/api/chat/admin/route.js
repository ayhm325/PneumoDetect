import { NextResponse } from "next/server";
import { withRBAC } from "../../../../lib/auth/withRBAC";
import { rateLimit } from "../../../../lib/security/rateLimiter";
import { logAudit } from "../../../../lib/security/auditLogger";
import { AppError } from "../../../../src/lib/errors/appError";
import { chatPatientService } from "../../../../src/services/chat";

export function POST() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}

export const GET = withRBAC(
  async (request, user) => {
    const rl = await rateLimit(request);
    if (rl.limited) {
      logAudit({
        event: "rate_limit_exceeded",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: { endpoint: "GET /api/chat/admin" },
      });
      return NextResponse.json({ error: "rate_limit_exceeded" }, { status: 429 });
    }

    try {
      const result = await chatPatientService.listChatsForAdminUser(user.id);
      logAudit({
        event: "admin_chats_listed",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: { chatCount: result.chats.length },
      });
      return NextResponse.json(result);
    } catch (error) {
      if (error instanceof AppError) {
        return NextResponse.json({ error: error.message }, { status: error.statusCode });
      }

      logAudit({
        event: "admin_chats_list_error",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: { error: error instanceof Error ? error.message : String(error) },
      });
      return NextResponse.json({ error: "server_error" }, { status: 500 });
    }
  },
  ["admin"],
);
