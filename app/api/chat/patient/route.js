import { NextResponse } from "next/server";
import { withRBAC } from "../../../../lib/auth/withRBAC";
import { rateLimit } from "../../../../lib/security/rateLimiter";
import { logAudit } from "../../../../lib/security/auditLogger";
import { AppError } from "../../../../src/lib/errors/appError";
import { chatPatientService } from "../../../../src/services/chat";

function mapChatErrorCode(message, fallback) {
  if (message === "patient_not_found") return "PT01";
  if (message === "missing_patient_id") return "PT02";
  if (message === "no_doctor_linked") return "PT03";
  if (message === "patient_inactive") return "PT04";
  if (message === "forbidden") return "AUTH01";
  return fallback;
}


// جلب جميع محادثات المريض مع آخر رسالة وعدد الرسائل غير المقروءة
export const GET = withRBAC(
  async (request, user) => {
    const rl = await rateLimit(request);
    if (rl.limited) {
      logAudit({
        event: "rate_limit_exceeded",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: { endpoint: "GET /api/chat/patient" },
      });
      return NextResponse.json({ error: "rate_limit_exceeded", code: "RL01" }, { status: 429 });
    }

    try {
      const result = await chatPatientService.listChatsForPatientUser(user.id);

      logAudit({
        event: "patient_chats_listed",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: { chatCount: result.chats.length },
      });

      return NextResponse.json(result);
    } catch (error) {
      if (error instanceof AppError) {
        const errorCode = mapChatErrorCode(error.message, "SRV01");
        return NextResponse.json(
          { error: error.message, code: errorCode },
          { status: error.statusCode },
        );
      }

      logAudit({
        event: "patient_chats_list_error",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: { error: error instanceof Error ? error.message : String(error) },
      });

      return NextResponse.json({ error: "server_error", code: "SRV01" }, { status: 500 });
    }
  },
  ["patient"],
);

// إنشاء أو جلب محادثة بين الطبيب والمريض مع إرسال إشعار
export const POST = withRBAC(
  async (request, user) => {
    const rl = await rateLimit(request);
    if (rl.limited) {
      logAudit({
        event: "rate_limit_exceeded",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: { endpoint: "POST /api/chat/patient" },
      });
      return NextResponse.json({ error: "rate_limit_exceeded", code: "RL02" }, { status: 429 });
    }

    try {
      const contentType = request.headers.get("content-type") || "";
      if (!contentType.toLowerCase().includes("application/json")) {
        return NextResponse.json({ error: "invalid_content_type", code: "SRV02" }, { status: 400 });
      }

      let body;
      try {
        body = await request.json();
      } catch {
        return NextResponse.json({ error: "invalid_json", code: "SRV02" }, { status: 400 });
      }

      const result = await chatPatientService.createOrGetChat({
        userId: user.id,
        role: user.role,
        patientId: body?.patientId,
      });

      logAudit({
        event:
          user.role === "doctor"
            ? "doctor_chat_created_or_reused"
            : "patient_chat_created_or_reused",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: {
          chatId: result.chat?.id || null,
          patientId: body?.patientId || null,
          created: Boolean(result.created),
        },
      });

      return NextResponse.json(result, { status: result.created ? 201 : 200 });
    } catch (error) {
      if (error instanceof AppError) {
        const errorCode = mapChatErrorCode(error.message, "SRV02");
        return NextResponse.json(
          { error: error.message, code: errorCode },
          { status: error.statusCode },
        );
      }

      logAudit({
        event: "chat_patient_post_error",
        userId: user?.id,
        ip: request.headers.get("x-forwarded-for"),
        details: { error: error instanceof Error ? error.message : String(error) },
      });

      return NextResponse.json({ error: "server_error", code: "SRV02" }, { status: 500 });
    }
  },
  ["doctor", "patient"],
);
