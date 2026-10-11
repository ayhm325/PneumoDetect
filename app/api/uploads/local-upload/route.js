import { uploadService } from "../../../../src/services/uploads";
import { AppError } from "../../../../src/lib/errors/appError";

// نقطة دخول PUT لمعالجة رفع الملفات محليًا
export async function PUT(req) {
  try {
    const url = new URL(req.url);
    const rel = url.searchParams.get("path");
    if (!rel) {
      return new Response(JSON.stringify({ error: "missing_path" }), {
        status: 400,
      });
    }

    const data = await req.arrayBuffer();

    const result = await uploadService.saveLocalUpload({
      relativePath: rel,
      data,
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
