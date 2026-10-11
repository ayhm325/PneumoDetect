import { NextResponse } from "next/server";
import { withRBAC } from "../../../../../lib/auth/withRBAC.js";
import { rateLimit } from "../../../../../lib/security/rateLimiter.js";
import { logAudit } from "../../../../../lib/security/auditLogger.js";
import { AppError } from "../../../../../src/lib/errors/appError";
import { chatUploadService } from "../../../../../src/services/chat";

function mapUploadErrorCode(message) {
  if (message === "missing_chat_id") return "CH01";
  if (message === "chat_not_found") return "CH02";
  if (message === "unauthenticated") return "AUTH01";
  if (message === "forbidden") return "AUTH03";
  if (message === "upload_missing_file") return "UP01";
  if (message === "upload_file_too_large") return "UP02";
  if (message === "upload_invalid_file_type") return "UP04";
  return "UP03";
}

export const POST = withRBAC(
  async (req, user, context) => {
    const rl = await rateLimit(req);
    if (rl.limited) {
      logAudit({
        event: "rate_limit_exceeded",
        userId: user.id,
        ip: req.headers.get("x-forwarded-for"),
        details: { endpoint: "POST /api/chat/[chatId]/upload" },
      });
      return NextResponse.json({ error: "rate_limit_exceeded" }, { status: 429 });
    }

    try {
      const params = context?.params;
      const resolved = typeof params?.then === "function" ? await params : params;
      const chatId = String(resolved?.chatId || "").trim();

      const contentType = req.headers.get("content-type") || "";
      if (!contentType.toLowerCase().includes("multipart/form-data")) {
        return NextResponse.json({ error: "invalid_content_type", code: "UP03" }, { status: 400 });
      }

      const formData = await req.formData();
      const file = formData.get("file");
      const result = await chatUploadService.uploadFile({
        userId: user.id,
        role: user.role,
        chatId,
        file: file && typeof file.arrayBuffer === "function" ? file : null,
      });

      return NextResponse.json(result, { status: 200 });
    } catch (error) {
      if (error instanceof AppError) {
        return NextResponse.json(
          { error: error.message, code: mapUploadErrorCode(error.message) },
          { status: error.statusCode },
        );
      }

      logAudit({
        event: "chat_upload_error",
        userId: user?.id,
        ip: req.headers.get("x-forwarded-for"),
        details: { error: error instanceof Error ? error.message : String(error) },
      });
      return NextResponse.json({ error: "server_error", code: "UP03" }, { status: 500 });
    }
  },
  ["doctor", "patient", "admin"],
);
