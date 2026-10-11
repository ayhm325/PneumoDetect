import { timingSafeEqual } from "crypto";
import { AppError } from "../../../../src/lib/errors/appError";
import { appointmentReminderService } from "../../../../src/services/cron";

/**
 * التحقق من أن الطلب مصرح له باستخدام CRON_SECRET
 * - يدعم Authorization Header
 * - أو token في query string
 */
function isAuthorized(request) {
  const secret = String(process.env.CRON_SECRET || "").trim();
  if (!secret) return false;

  const matchesSecret = (candidate) => {
    const value = String(candidate || "").trim();
    if (!value) return false;
    const secretBuffer = Buffer.from(secret);
    const valueBuffer = Buffer.from(value);
    if (secretBuffer.length !== valueBuffer.length) return false;
    return timingSafeEqual(secretBuffer, valueBuffer);
  };

  // 1️⃣ التحقق من Authorization Header
  const authHeader =
    request.headers.get("authorization") ||
    request.headers.get("Authorization") ||
    "";

  if (authHeader.startsWith("Bearer ") && matchesSecret(authHeader.slice(7))) {
    return true;
  }

  // 2️⃣ التحقق من token في query string
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get("token");
    if (matchesSecret(token)) return true;
  } catch {
    // في حال كان URL غير صالح — نتجاهل
  }

  return false;
}

/**
 * GET endpoint
 * - يستخدم من CRON أو استدعاء يدوي
 */
export async function GET(request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const result = await appointmentReminderService.runReminders();

    return Response.json({
      ok: true,
      now: result.now,
      created: result.created,
      details: result.details,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return Response.json(
        {
          ok: false,
          error: error.message,
        },
        { status: error.statusCode },
      );
    }

    return Response.json(
      {
        ok: false,
        error: error?.message || "server_error",
      },
      { status: 500 },
    );
  }
}

/**
 * POST → يعاد توجيهه إلى GET
 * لتسهيل التكامل مع CRON providers
 */
export async function POST(request) {
  return GET(request);
}
