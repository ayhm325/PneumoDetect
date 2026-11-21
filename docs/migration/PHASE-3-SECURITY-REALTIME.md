# Phase 3 — Security & Realtime (`Socket.IO`)

## Authentication & Session Security
- **HttpOnly Cookie**: `token` cookie set with `httpOnly: true`, `sameSite: isProd ? "none" : "lax"`, `secure: isProd`, `path: "/"`, `maxAge: 2h`.
- **Fail-Closed Revocation**: `authenticateRequest` checks `isTokenRevoked(token)` before verifying JWT; unavailable revocation store rejects with `401 revocation_check_unavailable`.
- **CORS**: Explicit allowlist (`env.corsOrigins`), `credentials: true`, `exposedHeaders: ["X-Unread-Count"]`.
- **Error Safety**: `errorHandler` maps `AppError` and `ZodError` cleanly and never leaks stack traces or SQL errors.

## Socket.IO Migration (`apps/api/src/socket/setupSocket.ts`)
- Integrated onto the Express 5 `http.Server` on port `4000`.
- **Handshake Auth**: Reads `socket.handshake.auth.token` or `token` cookie, verifies revocation (`isTokenRevoked`) and JWT signature (`getJwtSecret()`).
- **Events Preserved**: `whoami` -> `me`, `join`, `leave`, `typing`, `message` (rate-limited 10 msgs / 10s, idempotent `clientKey`, Prisma persistence), `delivered_ack`, `read_ack`, `presence` (global + per-room), `disconnect`.
- **Redis Adapter**: Automatically enabled when `REDIS_URL` is configured.
