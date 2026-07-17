# Architecture

Requested stack: `backend`, `web` (fixed by the platform for this project).
Project directory was empty (only `README.md` and `.github/workflows/colossus-deploy.yml`
existed) — both platforms were newly scaffolded from `template-backend` and `template-web`.

## Layout

- **`backend/`** — NestJS + Prisma + PostgreSQL REST API (from `template-backend`).
  Listens on port `3000`, global prefix `/api/v1`. JWT auth, role-based guards
  (`admin`/`user`), Swagger docs at `/api`. This is the canonical, single backend
  service for the project — build all API features (clients, services,
  appointments, dashboard, revenue, health) here.
- **`web/`** — Angular 17 standalone SPA (from `template-web/frontend`). Served by
  nginx in production; `web/nginx.conf` proxies `/api/` to the `backend` service on
  port `3000`, preserving the `/api/v1` prefix. `web/Dockerfile` builds and serves
  the static app. Dev proxy config at `web/proxy.conf.json` points `ng serve` at
  `http://localhost:3000`.
- Note: `template-web` on disk also ships its own bundled NestJS backend
  (`template-web/backend/`) for standalone use. It was **not** copied — since this
  project's stack also includes `backend`, `template-backend` (the fuller template,
  with Swagger + tests) was used as the single source of truth for the API instead
  of the lighter one bundled with the web template.

## Next steps

1. **Backend:** review/edit `backend/.env` (`DATABASE_URL`, `JWT_SECRET`, `JWT_EXP`,
   `FRONTEND_URL`) — a placeholder local Postgres URL was written; point it at the
   real database before running migrations.
   - `cd backend && pnpm install`
   - `npx prisma migrate dev --name init`
   - `pnpm run start:dev`
2. **Web:** `cd web && npm install && npm start` (dev server on `:4200`, proxies
   `/api` to `:3000` via `proxy.conf.json`).
3. Implement the BizBook feature set (clients, services, appointments, Front
   Desk — Today dashboard, weekly/monthly revenue) as REST endpoints on the Nest
   backend and Angular pages/components on the frontend, per the technical plan —
   the plan's original Express/SQLite proposal was superseded by this platform's
   fixed NestJS/Prisma/Postgres + Angular stack.
4. `.colossus-acceptance.json` seeds `ready_testid: "app-ready"` (already present
   as a `data-testid` on `<app-root>` in `web/src/app/app.component.ts` — do not
   remove it) and placeholder `reject_signatures` for the stub Login/Home pages;
   update `expect_text` once the real BizBook front page content is built.
5. `colossus.yaml` declares the build: Angular app at `web/` (output
   `web/dist/frontend/browser`, `web/Dockerfile`, `web/nginx.conf`) plus the NestJS
   backend at `backend/` (port 3000). No changes needed unless paths move.

## Template sources

- `template-backend` → `backend/`
- `template-web/frontend` + `template-web/nginx.conf` → `web/`
