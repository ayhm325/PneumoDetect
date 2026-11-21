# Phase 4 — React Client Migration (`apps/web`)

- **Stack**: React 19, Vite 6, TypeScript, React Router 7, TanStack Query 5, React Hook Form + Zod (`@pneumodetect/contracts`), i18next / react-i18next (`ar` RTL & `en` LTR), Socket.IO Client, Tailwind CSS v4.
- **Auth Security**: HttpOnly cookie session via `/api/auth/whoami` and `/api/login` (`credentials: "include"`). No tokens in `localStorage`.
- **Pages Migrated**:
  - Public: `/`, `/about`, `/services`, `/blog`, `/faq`, `/contact`, `/privacy`, `/terms`
  - Auth: `/login`, `/signup`, `/forgot-password`
  - Patient: `/patient/{dashboard,analysis,analysis/history,results,appointments,chat,notifications,profile}`
  - Doctor: `/doctor/{dashboard,patients,upload-xray,results,appointments,chat,notifications,settings}`
  - Admin: `/admin/{dashboard,users,doctors,patients,doctor-change-requests,notifications,settings}`
- **SEO Strategy**: Public pages include semantic HTML and meta tags in `apps/web/index.html`; static/prerendered HTML can be added at build time if public-search indexing is required.
- **Verification**: `tsc --noEmit` 0 errors, `vite build` succeeded (2.56s), `http://localhost:5173/` -> `200`, `/api/health` proxy -> `200 OK`.
