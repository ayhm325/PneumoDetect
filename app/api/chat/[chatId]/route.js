import { NextResponse } from "next/server";
import { withRBAC } from "../../../../lib/auth/withRBAC";
import { rateLimit } from "../../../../lib/security/rateLimiter";
import { logAudit } from "../../../../lib/security/auditLogger";
import { AppError } from "../../../../src/lib/errors/appError";
import { chatPatientService } from "../../../../src/services/chat";

function mapDeleteChatError(message) {
  if (message === "missing_chat_id") return "CH01";
  if (message === "chat_not_found") return "CH02";
  if (message === "unauthenticated") return "AUTH01";
  if (message === "forbidden_doctor") return "AUTH03";
  if (message === "forbidden_patient") return "AUTH04";
  if (message === "forbidden_role") return "AUTH05";
  return "SRV01";
}

export const DELETE = withRBAC(
  async (request, user, context) => {
    const rl = await rateLimit(request);
    if (rl.limited) {
      logAudit({
        event: "rate_limit_exceeded",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: { endpoint: "DELETE /api/chat/[chatId]" },
      });
      return NextResponse.json({ error: "rate_limit_exceeded" }, { status: 429 });
    }

    try {
      const params = context?.params;
      const resolvedParams = typeof params?.then === "function" ? await params : params;
      const chatId = String(resolvedParams?.chatId || "").trim();

      const result = await chatPatientService.deleteChatById({
        userId: user.id,
        role: user.role,
        chatId,
      });

      logAudit({
        event: "chat_deleted",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: { chatId: chatId || null },
      });

      return NextResponse.json(result);
    } catch (error) {
      if (error instanceof AppError) {
        return NextResponse.json(
          { error: error.message, code: mapDeleteChatError(error.message) },
          { status: error.statusCode },
        );
      }

      logAudit({
        event: "chat_delete_error",
        userId: user?.id,
        ip: request.headers.get("x-forwarded-for"),
        details: { error: error instanceof Error ? error.message : String(error) },
      });
      return NextResponse.json({ error: "server_error", code: "SRV01" }, { status: 500 });
    }
  },
  ["doctor", "patient", "admin"],
);
