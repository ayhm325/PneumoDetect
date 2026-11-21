# Phase 0 — Baseline & Migration Mapping

**Date**: 2026-11-22  
**Branch**: `refactor/standalone-react-client`  
**Initial HEAD SHA**: `bcd697add9862329a7373e29d5aabe1c612aefbb` (from `main`)

---

## 1. Baseline Checks

| Check | Command | Result | Details |
|---|---|---|---|
| Jest Unit/Auth Tests | `npm test` | **PASS** | 4 suites, 12 tests passed (`auth-revocation-failclosed`, `analysis-correctness`, `revocation`, `socket-authorization`) |
| ESLint | `npm run lint` | **FAIL (1 error)** | Existing JSX parsing error in `app/components/HeroSection.js:130:14` (`Expected corresponding JSX closing tag for <p>`) |
| PostgreSQL 17 | `node test-db.js` | **PASS** | Local PostgreSQL 17 running on `localhost:5432`, database `pneumodetect`, 14 Prisma migrations applied |
| Python AI Server | `npm run check:model` | **RUNNING** | FastAPI + DenseNet121 running on `http://0.0.0.0:8000` (`ai/models/best_densenet121_xray.pth`) |

---

## 2. Original Architecture Inventory

### 2.1 Frontend (Next.js 16 App Router + `next-intl`)
- **Root & Public Pages (`app/[locale]/`)**:
  - `/` (`page.js`), `/about`, `/blog`, `/contact`, `/faq`, `/privacy`, `/services`, `/terms`, `/holo-demo`
  - Auth: `/login`, `/signup`, `/forgot-password`
- **Patient Portal (`app/[locale]/patient/`)**:
  - `dashboard`, `analysis` (X-ray upload & AI analysis), `analysis/history`, `results`, `appointments`, `chat`, `notifications`, `profile`, `logout`
- **Doctor Portal (`app/[locale]/doctor/`)**:
  - `dashboard`, `patients`, `upload-xray`, `results`, `analytics`, `appointments`, `chat`, `notifications`, `settings`, `logout`
  - Feature components in `app/[locale]/doctor/components/` (with CSS Modules)
- **Admin Portal (`app/[locale]/admin/`)**:
  - `dashboard`, `doctors`, `patients`, `users`, `doctor-change-requests-page`, `notifications`, `settings`, `logout`
- **Shared UI & Features**:
  - `app/components/` (Navbar, Footer, HeroSection, patient/, admin/, ui/, layouts/)
  - `src/components/` (`ui/`, `layouts/`, `shared/`), `src/features/auth/`, `src/hooks/useAuth.ts`, `src/lib/api.ts`
  - `messages/` / `i18n/request.ts` (`ar` RTL and `en` LTR via `next-intl`)

### 2.2 Backend (Next.js Route Handlers + Domain Services/Repositories)
- **API Routes (`app/api/`)**: 50+ route handlers across:
  - Auth: `/api/login`, `/api/auth/logout`, `/api/auth/whoami`, `/api/auth/token`, `/api/auth/is-revoked`
  - Admin: `/api/admin/{announcements,dashboard-stats,doctor-change-requests,doctors,doctors/[id],notifications,notifications-unread,patients,patients/[id],recent-activities,settings,system-status,users,users/[id]}`
  - Doctor: `/api/doctor`, `/api/doctor/{me,list,patients,results,appointments,appointments/[id],notifications,change-password}`
  - Patient: `/api/patient`, `/api/patient/{profile,dashboard-stats,results,appointments,appointments/[id],notifications,change-password}`
  - Analysis & AI: `/api/predict`, `/api/analysis/analyze`, `/api/analysis/history`
  - Chat: `/api/chat/{admin,doctor,patient,[chatId],[chatId]/messages,[chatId]/upload}`
  - Uploads & Misc: `/api/uploads/{init,complete,local-upload}`, `/api/doctor-change-requests`, `/api/cron/appointment-reminders`
- **Domain Layer (`src/`)**:
  - `src/services/{admin,analysis,auth,chat,cron,doctor,patient,predict,uploads}/`
  - `src/repositories/{admin,analysis,auth,chat,cron,doctor,patient}/`
  - `src/lib/{auth/authRequestService.ts,errors/appError.ts,http/jsonResponse.ts}`
  - `src/db/prisma.ts`, `lib/prismaClient.js`, `lib/auth/{jwtSecret.js,jwtClaims.js,revocation.server.js,withRBAC.js}`

### 2.3 Realtime & AI Infrastructure
- **Socket.IO**: `scripts/socket-server.js` (Express + Socket.IO on port `4000`, optional Redis adapter, JWT auth via cookie/handshake, room authorization, message persistence, presence, typing, delivery/read ACKs).
- **AI Inference**: `python_model/predict_server.py` (FastAPI + PyTorch DenseNet121 on port `8000`, `/predict` endpoint, heatmap generation in `python_model/static/heatmaps/`) + `ai/inference/` Node client.
- **Database**: `prisma/schema.prisma` (PostgreSQL, 14 migrations in `prisma/migrations/`).

---

## 3. Next.js Dependency Map

| Dependency / Pattern | Scope | Migration Target |
|---|---|---|
| `next/navigation` (`useRouter`, `usePathname`, `useSearchParams`, `redirect`) | `app/**`, `src/features/auth/**` | `react-router-dom` (`useNavigate`, `useLocation`, `useSearchParams`, `Navigate`) |
| `next/link` (`Link`) | `app/**`, `src/features/auth/**` | `react-router-dom` `Link` |
| `next/image` (`Image`) | `app/**` | Standard `<img>` with lazy loading & explicit dimensions |
| `next-intl` (`useTranslations`, `useLocale`, `NextIntlClientProvider`) | `app/**`, `i18n/request.ts` | `i18next` + `react-i18next` |
| `next/server` (`NextResponse`, `NextRequest`) | `app/api/**`, `src/lib/http/jsonResponse.ts`, `lib/auth/withRBAC.js`, `proxy.js` | Express 5 `Request` / `Response` |
| `next/headers` (`cookies`, `headers`) | `app/api/**`, `app/[locale]/patient/results/page.server.js` | Express `req.cookies` / `req.headers` |
| `next/font/google` (`app/fonts.js`) | `app/layout.js` | Google Fonts `<link>` in `apps/web/index.html` + CSS variables |

---

## 4. Risks & Mitigation

1. **Auth & Cookie/CSRF Boundary**: Separate origins (`localhost:5173` -> `localhost:4000` in dev) require `credentials: 'include'`, strict `CORS` origin allowlist, `SameSite=Lax`, and double-submit or origin/header CSRF protection.
2. **Prisma & Existing Data**: Keep `prisma/schema.prisma` and `prisma/migrations/` untouched; move ownership to `apps/api` and point to the same PostgreSQL `pneumodetect` database.
3. **Socket.IO + Express Coexistence**: Integrate Socket.IO directly onto the Express 5 HTTP server on port `4000` (preserving `SOCKET_PORT=4000` and all existing events/auth/Redis adapter).
4. **Zero-Downtime Incremental Migration**: Keep the existing Next.js app intact until Stage 6 verification passes, then remove Next.js in Stage 7.
