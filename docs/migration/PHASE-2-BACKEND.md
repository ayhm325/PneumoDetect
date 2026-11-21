# Phase 2 — Backend Extraction (`apps/api`)

**Status**: Verified (`tsc --noEmit` 0 errors, `GET /api/health` -> `200 OK` with `database: "ok"`, `ai: "ok"`).

## Architecture
- `apps/api/src/config/env.ts` — Centralized environment loading & validation.
- `apps/api/src/bootstrap/createApp.ts` — Express 5 app with Helmet, credentialed CORS, cookie-parser, JSON/urlencoded parsing, static `/uploads` & `/static/heatmaps`, and centralized error handler.
- `apps/api/src/middleware/` — `requireAuth`, `requireRole`, `withRateLimit`, `errorHandler`.
- `apps/api/src/routes/` — Domain routers (`health`, `auth`, `analysis`, `patient`, `doctor`, `admin`, `chat`, `uploads`, `cron`).
- `apps/api/src/services/` & `apps/api/src/repositories/` — Preserved domain services and repositories.
- `apps/api/prisma/` — Exclusive Prisma schema & 14 migrations ownership.

## API Migration Matrix

| Domain | Endpoints Migrated | Auth / Role |
|---|---|---|
| Health | `GET /api/health` | Public |
| Auth | `POST /api/login`, `POST /api/auth/logout`, `GET /api/auth/whoami`, `GET /api/auth/token`, `POST /api/auth/is-revoked` | Public / Cookie+Bearer JWT |
| Analysis & AI | `POST /api/predict`, `POST /api/analysis/analyze`, `GET /api/analysis/history`, `DELETE /api/analysis/history` | `requireAuth` |
| Patient | `GET /api/patient`, `GET/PUT /api/patient/profile`, `GET /api/patient/dashboard-stats`, `GET /api/patient/results`, `GET/POST /api/patient/appointments`, `PATCH/DELETE /api/patient/appointments/:id`, `HEAD/GET/PATCH/DELETE /api/patient/notifications`, `POST /api/patient/change-password`, `GET/POST /api/doctor-change-requests` | `requireAuth` + `requireRole("patient")` |
| Doctor | `GET /api/doctor/me`, `GET /api/doctor/list`, `GET /api/doctor/patients`, `GET/PATCH /api/doctor/results`, `GET/POST /api/doctor/appointments`, `PATCH/DELETE /api/doctor/appointments/:id`, `HEAD/GET/PATCH/DELETE /api/doctor/notifications`, `POST /api/doctor/change-password` | `requireAuth` + `requireRole("doctor")` (except `/list`) |
| Admin | `GET /api/admin/{dashboard-stats,system-status,recent-activities,notifications,notifications-unread,users,doctors,patients,doctor-change-requests,settings}`, `POST /api/admin/{recent-activities,announcements,users,doctors,patients}`, `PATCH /api/admin/{notifications,users/:id,doctors,doctors/:id,patients/:id,doctor-change-requests,settings}`, `DELETE /api/admin/doctors/:id` | `requireAuth` + `requireRole("admin")` |
| Chat | `GET/POST /api/chat/patient`, `GET/POST /api/chat/doctor`, `GET /api/chat/admin`, `DELETE /api/chat/:chatId`, `GET/POST /api/chat/:chatId/messages`, `POST /api/chat/:chatId/upload` | `requireAuth` + role/ownership |
| Uploads | `POST /api/uploads/init`, `POST /api/uploads/complete`, `PUT /api/uploads/local-upload` | `requireAuth` |
| Cron | `POST /api/cron/appointment-reminders` | Internal / Cron |
