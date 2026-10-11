import { NextResponse } from "next/server";
import { authenticateRequest } from "../../../../src/lib/auth/authRequestService";
import { AppError, toAppError } from "../../../../src/lib/errors/appError";
import { analysisService } from "../../../../src/services/analysis";

function parseWithHeatmap(form) {
  const raw = form.get("with_heatmap");
  if (raw === null) return false;
  const value = String(raw).trim().toLowerCase();
  return value === "true" || value === "on" || value === "1" || value === "yes";
}

function appErrorToResponse(error) {
  const appError = toAppError(error);
  const body = { error: appError.code };

  if (
    appError.code === "file_too_large" ||
    appError.code === "invalid_file_type" ||
    appError.code === "validation_error"
  ) {
    body.message = appError.message;
  }

  return NextResponse.json(body, { status: appError.statusCode });
}

export async function POST(request) {
  try {
    const auth = await authenticateRequest(request);
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.toLowerCase().includes("multipart/form-data")) {
      throw new AppError({
        code: "validation_error",
        message: "Request must be multipart/form-data",
        statusCode: 400,
      });
    }

    const form = await request.formData();
    const file = form.get("image");

    if (!file || typeof file.arrayBuffer !== "function") {
      throw new AppError({
        code: "missing_file",
        message: "Image file is required",
        statusCode: 400,
      });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await analysisService.analyzeXray({
      userId: auth.user.id,
      image: {
        name: file.name || "upload",
        type: file.type || "application/octet-stream",
        buffer,
        withHeatmap: parseWithHeatmap(form),
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AppError) {
      return appErrorToResponse(error);
    }

    console.error("/api/analysis/analyze error", error);

    if (process.env.NODE_ENV !== "production") {
      return NextResponse.json(
        {
          error: "server_error",
          message: error instanceof Error ? error.message : String(error),
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
