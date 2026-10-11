import { NextResponse } from "next/server";
import { authenticateRequest } from "../../../../src/lib/auth/authRequestService";
import { AppError, toAppError } from "../../../../src/lib/errors/appError";
import { analysisHistoryService } from "../../../../src/services/analysis";

function appErrorToResponse(error) {
  const appError = toAppError(error);
  return NextResponse.json({ error: appError.code }, { status: appError.statusCode });
}

export async function GET(request) {
  try {
    const auth = await authenticateRequest(request);
    const records = await analysisHistoryService.getHistory(auth.user.id);
    return NextResponse.json({ success: true, data: records });
  } catch (error) {
    if (error instanceof AppError) {
      return appErrorToResponse(error);
    }

    console.error("/api/analysis/history GET error", error);
    if (process.env.NODE_ENV !== "production") {
      return NextResponse.json(
        { error: "server_error", message: error instanceof Error ? error.message : String(error) },
        { status: 500 },
      );
    }
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const auth = await authenticateRequest(request);

    const url = new URL(request.url);
    let id = (url.searchParams.get("id") || "").trim();
    const contentType = request.headers.get("content-type") || "";
    const shouldReadBody = !id && contentType.toLowerCase().includes("application/json");
    if (shouldReadBody) {
      const body = await request.json().catch(() => null);
      if (!body) {
        return NextResponse.json({ error: "invalid_json" }, { status: 400 });
      }
      id = typeof body?.id === "string" ? body.id.trim() : "";
    }

    const result = await analysisHistoryService.deleteHistoryItem(auth.user.id, id);
    return NextResponse.json({ success: true, deletedCount: result.count });
  } catch (error) {
    if (error instanceof AppError) {
      return appErrorToResponse(error);
    }

    console.error("/api/analysis/history DELETE error", error);
    if (process.env.NODE_ENV !== "production") {
      return NextResponse.json(
        { error: "server_error", message: error instanceof Error ? error.message : String(error) },
        { status: 500 },
      );
    }

    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
