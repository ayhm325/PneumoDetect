import { NextResponse } from "next/server";
import { withRBAC } from "../../../../../lib/auth/withRBAC.js";
import { rateLimit } from "../../../../../lib/security/rateLimiter.js";
import { logAudit } from "../../../../../lib/security/auditLogger.js";
import { AppError } from "../../../../../src/lib/errors/appError";
import { chatMessageService } from "../../../../../src/services/chat";

const CHAT_ROLES = ["doctor", "patient", "admin"];

function mapMessagesErrorCode(message) {
  if (message === "missing_chat_id") return "CH01";
  if (message === "chat_not_found") return "CH02";
  if (message === "unauthenticated") return "AUTH01";
  if (message === "forbidden") return "AUTH03";
  if (message === "empty_message") return "MSG01";
  if (message === "message_too_long") return "MSG02";
  return "SRV01";
}

export const GET = withRBAC(
  async (request, user, context) => {
    const rl = await rateLimit(request);
    if (rl.limited) {
      logAudit({
        event: "rate_limit_exceeded",
        userId: user?.id,
        ip: request.headers.get("x-forwarded-for"),
        details: { endpoint: "GET /api/chat/[chatId]/messages" },
      });
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    try {
      const params = context?.params;
      const resolvedParams = typeof params?.then === "function" ? await params : params;
      const chatId = String(resolvedParams?.chatId || "").trim();

      const result = await chatMessageService.listMessages({
        userId: user.id,
        role: user.role,
        chatId,
      });

      return NextResponse.json(result);
    } catch (error) {
      if (error instanceof AppError) {
        return NextResponse.json(
          { error: error.message, code: mapMessagesErrorCode(error.message) },
          { status: error.statusCode },
        );
      }

      logAudit({
        event: "chat_messages_get_error",
        userId: user?.id,
        ip: request.headers.get("x-forwarded-for"),
        details: { error: error instanceof Error ? error.message : String(error) },
      });
      return NextResponse.json({ error: "server_error", code: "SRV01" }, { status: 500 });
    }
  },
  CHAT_ROLES,
);

export const POST = withRBAC(
  async (request, user, context) => {
    const rl = await rateLimit(request);
    if (rl.limited) {
      logAudit({
        event: "rate_limit_exceeded",
        userId: user?.id,
        ip: request.headers.get("x-forwarded-for"),
        details: { endpoint: "POST /api/chat/[chatId]/messages" },
      });
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    try {
      const params = context?.params;
      const resolvedParams = typeof params?.then === "function" ? await params : params;
      const chatId = String(resolvedParams?.chatId || "").trim();
      const contentType = request.headers.get("content-type") || "";
      if (!contentType.toLowerCase().includes("application/json")) {
        return NextResponse.json({ error: "invalid_content_type", code: "SRV01" }, { status: 400 });
      }

      let body;
      try {
        body = await request.json();
      } catch {
        return NextResponse.json({ error: "invalid_json", code: "SRV01" }, { status: 400 });
      }

      const result = await chatMessageService.sendMessage({
        userId: user.id,
        role: user.role,
        chatId,
        text: body?.text,
        clientKey: body?.clientKey,
        fileUrl: body?.fileUrl,
        mimeType: body?.mimeType,
        fileName: body?.fileName,
      });

      return NextResponse.json(result, { status: result.existing ? 200 : 201 });
    } catch (error) {
      if (error instanceof AppError) {
        return NextResponse.json(
          { error: error.message, code: mapMessagesErrorCode(error.message) },
          { status: error.statusCode },
        );
      }

      logAudit({
        event: "chat_messages_post_error",
        userId: user?.id,
        ip: request.headers.get("x-forwarded-for"),
        details: { error: error instanceof Error ? error.message : String(error) },
      });
      return NextResponse.json({ error: "server_error", code: "SRV01" }, { status: 500 });
    }
  },
  ["doctor", "patient"],
);
