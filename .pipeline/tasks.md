# Pipeline Task Decomposition

## Summary
BizBook is a single-container business-management SPA: a React + TypeScript (Vite) front end served by a Node/Express + Prisma API, with JWT role-based auth (ADMIN/USER). It provides admin CRUD for clients and services, appointment booking with a status lifecycle (booked → completed/cancelled), a "Front Desk — Today" dashboard for both roles, and an admin-only weekly/monthly revenue summary that sums the price of completed appointments.

## Surface contract

### Auth model
`full_auth` — roles `ADMIN` and `USER`. First user via signup becomes ADMIN, subsequent signups become USER (admin also seeded). Public: `/login`, `/signup`, `/api/health`, `/api/health/deep`.

### API routes
- `POST /api/auth/signup` — create USER, return token + user.
- `POST /api/auth/login` — verify creds, return token + user.
- `POST /api/auth/logout` — 204 (client discards token).
- `GET /api/auth/me` — current user (requireAuth).
- `GET/POST /api/clients`, `PATCH/DELETE /api/clients/:id` — ADMIN only.
- `GET/POST /api/services`, `PATCH/DELETE /api/services/:id` — ADMIN only.
- `GET /api/appointments` (filters `?date=`, `?status=`, `?clientId=`), `POST /api/appointments` (any auth), `PATCH /api/appointments/:id/status` (complete = ADMIN; cancel = booker/admin).
- `GET /api/dashboard/today` — today's appointments (client+service joined) sorted by startTime asc + `remainingCount`.
- `GET /api/revenue` — ADMIN only, `{ week, month }` sums of completed appointment service prices.
- `GET /api/health`, `GET /api/health/deep` (DB ping).
- `GET /api/admin/settings`, `PATCH /api/admin/settings` — ADMIN only (backing-service credential config).

### Client routes / screens
- `/login`, `/signup` (public).
- `/today` (landing, both roles) — "Front Desk — Today".
- `/clients`, `/clients?modal=new`, `/clients?modal=edit&id=:id` (ADMIN).
- `/services`, `/services?modal=new`, `/services?modal=edit&id=:id` (ADMIN).
- `/appointments` (filters `?status=`, `?date=`), `/appointments?modal=book` (any auth).
- `/revenue` (ADMIN).
- `/admin/settings` (ADMIN) — backing-service credential config.

### Entities
- `User(id, name, email @unique, passwordHash, role: UserRole, createdAt)`.
- `Client(id, name, phone, email?, notes?, createdAt)`.
- `Service(id, name, durationMinutes, price, createdAt)`.
- `Appointment(id, clientId→Client, serviceId→Service, startTime, status @default("booked"), createdById→User, createdAt)`.
- `SystemSetting(key @id, value, updatedAt)`.

## db_agent tasks
- [ ] Create `server/prisma/schema.prisma` with SQLite provider and the Prisma client generator.
- [ ] Define `enum UserRole { ADMIN USER }` and `User` model with `role UserRole @default(USER)`, fields `id, name, email @unique, passwordHash, role, createdAt`.
- [ ] Define `Client` model: `id, name, phone, email?, notes?, createdAt`.
- [ ] Define `Service` model: `id, name, durationMinutes Int, price, createdAt`.
- [ ] Define `Appointment` model: `id, clientId→Client, serviceId→Service, startTime DateTime, status String @default("booked"), createdById→User, createdAt`, with relations to Client, Service, and User.
- [ ] Define `SystemSetting` model: `key String @id`, `value String`, `updatedAt DateTime @updatedAt` (backing-service credential storage).
- [ ] Create the initial Prisma migration and ensure `server/src/db.ts` exports a Prisma client singleton.
- [ ] Author `server/prisma/seed.ts` — idempotently upsert one ADMIN (`admin@bizbook.test`) and one USER (`user@bizbook.test`) with bcrypt-hashed passwords, then print `SEED_CREDS_JSON={"admin":{...},"user":{...}}` to stdout.

## backend_agent tasks
- [ ] Implement `server/src/auth.ts` — bcrypt password hashing, JWT sign/verify (`JWT_SECRET`, 12h expiry, payload `{ userId, role }`), `requireAuth` and `requireRole('ADMIN')` middleware.
- [ ] Implement `server/src/routes/auth.ts` — `POST /api/auth/signup` (creates USER), `POST /api/auth/login`, `POST /api/auth/logout` (204), `GET /api/auth/me` (requireAuth). Admin created via seed only, not signup.
- [ ] Implement `server/src/routes/clients.ts` — Zod-validated CRUD (`GET/POST/PATCH/DELETE`) all guarded by `requireRole('ADMIN')`, list sorted by name.
- [ ] Implement `server/src/routes/services.ts` — Zod-validated CRUD (`GET/POST/PATCH/DELETE`) all guarded by `requireRole('ADMIN')`, list sorted by name.
- [ ] Implement `server/src/routes/appointments.ts` — `GET` with `?date=`/`?status=`/`?clientId=` filters returning joined client+service; `POST` (any auth, validate client+service exist and `startTime` in future, default status `booked`); `PATCH /:id/status` (complete requires ADMIN, cancel allowed to booker or admin).
- [ ] Implement `server/src/routes/dashboard.ts` — `GET /api/dashboard/today` returning today's appointments (client+service joined) sorted by `startTime` asc plus `remainingCount` (booked appointments with `startTime >= now`).
- [ ] Implement `server/src/routes/revenue.ts` — `GET /api/revenue` (ADMIN only) summing `Service.price` of `completed` appointments for current week (Mon–Sun, UTC) and current calendar month; return `{ week, month }`.
- [ ] Implement `server/src/routes/health.ts` — `GET /api/health` (200) and `GET /api/health/deep` (trivial Prisma query for DB connectivity).
- [ ] Implement `server/src/index.ts` — Express bootstrap, JSON middleware, mount all `/api` routers before serving `client/dist` statically with SPA fallback (`*` → index.html for non-`/api` paths). Listen on `PORT` (default 8080).
- [ ] Create `server/src/lib/config.ts` with `resolveConfig(key: string): string | null` — reads `process.env[key]` first; if value equals `PLACEHOLDER_CONFIGURE_IN_SETTINGS` or absent, reads the matching `SystemSetting` DB row; returns null if neither set.
- [ ] Implement admin settings API — `GET /api/admin/settings` (list backing-service keys for `postgresql` and `minio` with masked values + configured status) and `PATCH /api/admin/settings` (upsert key/value pairs), both `requireRole('ADMIN')`.
- [ ] Author `Dockerfile` (multi-stage build of client+server) and root `package.json`/`.env.example`/`.dockerignore` wiring — final stage runs migrations + seed, then `node server/dist/index.js`; ensure persisted `data/` path for the SQLite file.

## ui_agent tasks
- [ ] Build `client/src/App.tsx` + `components/Layout.tsx` — React Router routes and app shell header rendering **"BizBook"** with role-aware nav (admin links + `/admin/settings` visible only to admins).
- [ ] Build `client/src/auth/AuthContext.tsx` (JWT persisted in `localStorage`, `me` hydration, login/logout) and route guards `RequireAuth.tsx` + `RequireAdmin.tsx` (unauthenticated → `/login`, non-admin → `/today`).
- [ ] Build `pages/Login.tsx` and `pages/Signup.tsx` — forms posting to auth API, redirect to `/today` on success, with loading/error states.
- [ ] Build `pages/Today.tsx` — heading **"Front Desk — Today"**, time-ordered list of today's appointments (client + service) with a remaining-count badge, plus empty/loading/error states.
- [ ] Build `pages/Clients.tsx` — table with query-param-driven create/edit modals (`?modal=new`, `?modal=edit&id=:id`) and delete, with empty/loading/error states.
- [ ] Build `pages/Services.tsx` — table with query-param-driven create/edit modals and delete, with empty/loading/error states.
- [ ] Build `pages/Appointments.tsx` — list with status filter chips and `?status=`/`?date=` bound to query params, book modal (`?modal=book`: client select + service select + datetime), row actions to mark completed (admin) / cancelled.
- [ ] Build `pages/Revenue.tsx` — week and month completed-revenue totals, with loading/error states.
- [ ] Build shared `components/Modal.tsx` and form field components used by the CRUD/book modals.
- [ ] Build `pages/AdminSettings.tsx` at `/admin/settings` — list `postgresql` and `minio` each with a configured/unconfigured badge and per-service credential form; show a prominent banner "The following need credentials to activate: [list]" whenever any listed service is unconfigured.

## service_agent tasks
- [ ] Implement `client/src/api.ts` — fetch wrapper attaching the JWT bearer token, base-URL handling, and JSON/error normalization.
- [ ] Wire the auth data layer (signup/login/logout/me) consumed by `AuthContext`.
- [ ] Wire clients + services CRUD calls (list/create/update/delete) to their pages.
- [ ] Wire appointments calls (list with filters, book, status patch) and the `/api/dashboard/today` call to their pages.
- [ ] Wire the revenue (`/api/revenue`) and admin settings (`GET`/`PATCH /api/admin/settings`) calls to their pages.

## tester tasks
- [ ] Auth/roles: seeded admin logs in → lands on `/today`; USER redirected away from `/clients`/`/services`/`/revenue`/`/admin/settings`; anonymous access blocked by guards.
- [ ] Seed: run seed script, assert a parseable `SEED_CREDS_JSON=` line with both roles.
- [ ] Clients: create client (name+phone) → appears in list; edit and delete round-trip.
- [ ] Services: create service (name/duration/price) → appears in list.
- [ ] Appointments: book client+service at a future time → status `booked`; admin marks completed → status `completed`; cancel path works for booker.
- [ ] Today dashboard: appointments appear under "Front Desk — Today" sorted by time; remaining count reflects booked future appointments.
- [ ] Revenue: after completing an appointment, weekly and monthly totals include that service's price.
- [ ] Health: `/api/health` returns 200; `/api/health/deep` confirms DB connectivity.
- [ ] Deep-links: each route including `?modal=` and `?status=`/`?date=` filters loads correctly on direct navigation/refresh.
- [ ] Admin settings: `/admin/settings` lists postgresql + minio with badges; unconfigured banner appears; PATCH persists and toggles configured status.

## Open questions
- Spec assumptions declare SQLite/Prisma, but `<spec_deployments>` provisions `postgresql` and `minio`. Tasks follow the spec's SQLite implementation while adding the required admin-settings surface for the provisioned services; confirm whether the deploy should switch the Prisma provider to PostgreSQL and whether MinIO is actually used by any feature (no spec scenario references object storage).
- `<spec_integrations>` resolves to "None (no third-party APIs or external services)"; no integration client modules were generated. Confirm none are expected.
- Spec states no double-booking enforcement is required — left unimplemented per spec.
