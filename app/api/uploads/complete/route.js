import { uploadService } from "../../../../src/services/uploads";
import { AppError } from "../../../../src/lib/errors/appError";

export async function POST(req) {
  try {
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.toLowerCase().includes("application/json")) {
      return new Response(JSON.stringify({ error: "invalid_content_type" }), { status: 400 });
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return new Response(JSON.stringify({ error: "invalid_json" }), { status: 400 });
    }

    const result = await uploadService.completeUpload({
      chatId: body?.chatId,
      key: body?.key,
      filename: body?.filename,
      provider: body?.provider,
      bucket: body?.bucket,
      region: body?.region,
    });

    return new Response(JSON.stringify(result), { status: 200 });
  } catch (e) {
    if (e instanceof AppError) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: e.statusCode,
      });
    }

    console.error(e);
    return new Response(JSON.stringify({ error: "server_error" }), {
      status: 500,
    });
  }
}
