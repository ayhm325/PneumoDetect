import { withRBAC } from "../../../../lib/auth/withRBAC";
import { rateLimit } from "../../../../lib/security/rateLimiter";
import { logAudit } from "../../../../lib/security/auditLogger";
import { AppError } from "../../../../src/lib/errors/appError";
import { adminUserService } from "../../../../src/services/admin";

export const GET = withRBAC(
  async (request, user) => {
    const rl = await rateLimit(request);
    if (rl.limited) {
      logAudit({
        event: "rate_limit_exceeded",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: { endpoint: "GET /api/admin/users" },
      });
      return Response.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    try {
      const users = await adminUserService.listUsers();

      logAudit({
        event: "admin_users_listed",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: { count: users.length },
      });

      return Response.json(users);
    } catch (error) {
      logAudit({
        event: "admin_users_list_error",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: { error: error instanceof Error ? error.message : String(error) },
      });

      if (error instanceof AppError) {
        return Response.json({ error: error.message }, { status: error.statusCode });
      }

      return Response.json({ error: "Internal error" }, { status: 500 });
    }
  },
  ["admin"],
);

export const POST = withRBAC(
  async (request, user) => {
    const rl = await rateLimit(request);
    if (rl.limited) {
      logAudit({
        event: "rate_limit_exceeded",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: { endpoint: "POST /api/admin/users" },
      });
      return Response.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    try {
      const contentType = request.headers.get("content-type") || "";
      if (!contentType.toLowerCase().includes("application/json")) {
        return Response.json({ error: "invalid_content_type" }, { status: 400 });
      }

      const body = await request.json().catch(() => null);
      if (!body) {
        return Response.json({ error: "invalid_json" }, { status: 400 });
      }

      const createdUser = await adminUserService.createAdminUser({
        name: body?.name,
        email: body?.email,
        password: body?.password,
        status: body?.status,
      });

      logAudit({
        event: "admin_user_created",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: {
          createdUserId:
            createdUser && typeof createdUser === "object" && "id" in createdUser
              ? createdUser.id
              : null,
        },
      });

      return Response.json(createdUser, { status: 201 });
    } catch (error) {
      logAudit({
        event: "admin_user_create_error",
        userId: user.id,
        ip: request.headers.get("x-forwarded-for"),
        details: { error: error instanceof Error ? error.message : String(error) },
      });

      if (error instanceof AppError) {
        return Response.json({ error: error.message }, { status: error.statusCode });
      }

      return Response.json({ error: "Internal error" }, { status: 500 });
    }
  },
  ["admin"],
);
