# Test Specification

> ⚠️ **Warning:** `.pipeline/surface.json` was not found. The API surface below was
> derived from the "Surface contract" section of `.pipeline/tasks.md` and the approved
> spec. The endpoint/route totals should be reconciled against `surface.json` once it
> is generated.

## Coverage summary
- Total cases: 74
- API endpoints covered: 21 / 21 (derived from tasks.md surface contract; surface.json absent)
- User journeys covered: 9

## API tests

Conventions: all `/api/**` routes except `POST /api/auth/signup`, `POST /api/auth/login`,
`GET /api/health`, `GET /api/health/deep` require a valid `Authorization: Bearer <jwt>`.
"Admin token" = JWT for a seeded/created ADMIN; "User token" = JWT for a USER role account.
Missing/expired/malformed token → **401**. Authenticated-but-wrong-role → **403**.

### `POST /api/auth/signup`
- **Happy path**: `{ name, email, password }` with a unique email → **201/200** with `{ token, user }`; `user.role === "USER"` (signup never creates ADMIN); response omits `passwordHash`.
- **Validation failures**: missing `email`/`password`/`name`, malformed email, empty password → **400** (Zod). Duplicate email (already registered) → **409** (or 400).
- **Auth failures**: n/a (public route).
- **Idempotency / edge cases**: signing up a second account still yields role `USER`; token is a decodable JWT carrying `{ userId, role }`.

### `POST /api/auth/login`
- **Happy path**: seeded `admin@bizbook.test` correct password → **200** `{ token, user }` with `user.role === "ADMIN"`; seeded `user@bizbook.test` → `role === "USER"`.
- **Validation failures**: missing email or password → **400**.
- **Auth failures**: unknown email → **401**; correct email + wrong password → **401**; error body must not reveal which field was wrong.
- **Idempotency / edge cases**: token decodes to `{ userId, role }`; two logins issue independently valid tokens.

### `POST /api/auth/logout`
- **Happy path**: with valid token → **204**, empty body (server is stateless; client discards token).
- **Validation failures**: n/a.
- **Auth failures**: no token → **401** (route is behind requireAuth) — assert actual guard behavior.
- **Idempotency / edge cases**: previously issued token still validates server-side afterward (logout is client-side discard only).

### `GET /api/auth/me`
- **Happy path**: valid token → **200** current user `{ id, name, email, role }`, no `passwordHash`.
- **Validation failures**: n/a.
- **Auth failures**: no token → **401**; malformed/expired token → **401**.
- **Idempotency / edge cases**: returned `id`/`role` match the token payload.

### `GET /api/clients`
- **Happy path**: admin token → **200** array of clients sorted by `name` ascending.
- **Validation failures**: n/a.
- **Auth failures**: user token → **403**; no token → **401**.
- **Idempotency / edge cases**: empty DB → **200** with `[]`.

### `POST /api/clients`
- **Happy path**: admin token + `{ name, phone, email?, notes? }` → **201** created client with `id` + `createdAt`.
- **Validation failures**: missing `name` or `phone`, malformed `email` → **400**.
- **Auth failures**: user token → **403**; no token → **401**.
- **Idempotency / edge cases**: optional `email`/`notes` omitted → still succeeds.

### `PATCH /api/clients/:id`
- **Happy path**: admin token updates `name`/`phone`/`notes` → **200** with updated fields persisted.
- **Validation failures**: invalid field types / empty required field → **400**; nonexistent `id` → **404**.
- **Auth failures**: user token → **403**; no token → **401**.
- **Idempotency / edge cases**: partial update leaves unspecified fields unchanged.

### `DELETE /api/clients/:id`
- **Happy path**: admin token → **200/204**; subsequent `GET` no longer lists the client.
- **Validation failures**: nonexistent `id` → **404**.
- **Auth failures**: user token → **403**; no token → **401**.
- **Idempotency / edge cases**: deleting a client referenced by an appointment — assert observed behavior (either FK error 400/409 or cascade); document actual outcome.

### `GET /api/services`
- **Happy path**: admin token → **200** array sorted by `name` ascending.
- **Validation failures**: n/a.
- **Auth failures**: user token → **403**; no token → **401**.
- **Idempotency / edge cases**: empty DB → `[]`.

### `POST /api/services`
- **Happy path**: admin token + `{ name, durationMinutes, price }` → **201** created service; `durationMinutes` is Int, `price` numeric.
- **Validation failures**: missing any field, non-integer `durationMinutes`, negative/non-numeric `price` → **400**.
- **Auth failures**: user token → **403**; no token → **401**.
- **Idempotency / edge cases**: price of `0` accepted (or rejected) — assert actual rule.

### `PATCH /api/services/:id`
- **Happy path**: admin token updates `price`/`durationMinutes`/`name` → **200** persisted.
- **Validation failures**: bad types → **400**; nonexistent `id` → **404**.
- **Auth failures**: user token → **403**; no token → **401**.
- **Idempotency / edge cases**: partial update preserves other fields.

### `DELETE /api/services/:id`
- **Happy path**: admin token → **200/204**; no longer listed.
- **Validation failures**: nonexistent `id` → **404**.
- **Auth failures**: user token → **403**; no token → **401**.
- **Idempotency / edge cases**: deleting a service used by an appointment — document FK/cascade behavior.

### `GET /api/appointments`
- **Happy path**: any auth token → **200** array; each row includes joined `client` and `service` objects.
- **Validation failures**: `?status=` with an invalid enum, malformed `?date=` → assert 400 or documented no-op filtering.
- **Auth failures**: no token → **401**.
- **Idempotency / edge cases**: `?date=YYYY-MM-DD` returns only that day's appointments; `?status=booked` filters by status; `?clientId=` filters by client; combined filters AND together.

### `POST /api/appointments`
- **Happy path**: user OR admin token + `{ clientId, serviceId, startTime(future) }` → **201** with `status === "booked"`, `createdById` = caller, joined client+service returned.
- **Validation failures**: missing/invalid `clientId`/`serviceId`, nonexistent client or service → **400/404**; `startTime` in the past or not a valid datetime → **400**.
- **Auth failures**: no token → **401**.
- **Idempotency / edge cases**: no double-booking enforcement (per spec) — two appointments for same slot both succeed.

### `PATCH /api/appointments/:id/status`
- **Happy path (complete)**: admin token + `{ status: "completed" }` → **200**, status persisted `completed`.
- **Happy path (cancel)**: booker (creator) OR admin + `{ status: "cancelled" }` → **200**, status `cancelled`.
- **Validation failures**: invalid status value → **400**; nonexistent `id` → **404**.
- **Auth failures**: user token attempting `completed` → **403**; a non-booker non-admin USER attempting `cancelled` on someone else's appointment → **403**; no token → **401**.
- **Idempotency / edge cases**: completing an already-cancelled (or vice versa) appointment — document allowed transitions.

### `GET /api/dashboard/today`
- **Happy path**: any auth token → **200** `{ appointments: [...], remainingCount }`; appointments are today's only, joined with client+service, sorted by `startTime` ascending.
- **Validation failures**: n/a.
- **Auth failures**: no token → **401**.
- **Idempotency / edge cases**: `remainingCount` = count of `booked` appointments with `startTime >= now`; completed/cancelled/past-booked excluded; no appointments today → `[]` and `remainingCount === 0`.

### `GET /api/revenue`
- **Happy path**: admin token → **200** `{ week, month }` numeric totals summing `Service.price` over `completed` appointments; week = Mon–Sun (UTC) of now, month = current calendar month (UTC).
- **Validation failures**: n/a.
- **Auth failures**: user token → **403**; no token → **401**.
- **Idempotency / edge cases**: only `completed` counted (booked/cancelled excluded); appointment completed this week increases both `week` and `month`; no completed appointments → `{ week: 0, month: 0 }`.

### `GET /api/health`
- **Happy path**: no auth needed → **200**.
- **Validation failures**: n/a.
- **Auth failures**: n/a (public).
- **Idempotency / edge cases**: responds even if DB is under load (no DB dependency).

### `GET /api/health/deep`
- **Happy path**: no auth needed → **200** after a trivial Prisma query succeeds.
- **Validation failures**: n/a.
- **Auth failures**: n/a (public).
- **Idempotency / edge cases**: returns non-200 (e.g. 503) when the DB is unreachable.

### `GET /api/admin/settings`
- **Happy path**: admin token → **200** list of backing-service keys (`postgresql`, `minio`) each with masked value + `configured` boolean.
- **Validation failures**: n/a.
- **Auth failures**: user token → **403**; no token → **401**.
- **Idempotency / edge cases**: unset keys report `configured: false`; secret values are masked, never returned in clear text.

### `PATCH /api/admin/settings`
- **Happy path**: admin token + `{ key, value }` (or key/value map) → **200/204**; subsequent `GET` shows `configured: true`.
- **Validation failures**: unknown key or missing value → **400**.
- **Auth failures**: user token → **403**; no token → **401**.
- **Idempotency / edge cases**: re-PATCHing an existing key upserts (updates `updatedAt`, no duplicate row).

## UI / journey tests

### Journey: Signup → land on Today
- **Steps**: navigate `/signup`; fill name/email/password; submit.
- **Expected outcomes**: redirect to `/today`; header shows **"BizBook"**; JWT stored in `localStorage`; new account has USER role (admin-only nav links hidden).
- **Negative path**: duplicate email or weak/empty fields → inline error shown, stays on `/signup`, no token stored.

### Journey: Login (admin & user)
- **Steps**: navigate `/login`; enter seeded admin creds; submit. Repeat with seeded user creds.
- **Expected outcomes**: both redirect to `/today`; admin sees nav for Clients/Services/Revenue/Admin Settings; user does NOT see admin-only nav links.
- **Negative path**: wrong password → error banner, remains on `/login`, no token stored.

### Journey: Route guards & role enforcement
- **Steps**: (a) while logged out, directly visit `/today`, `/clients`, `/revenue`. (b) as USER, directly visit `/clients`, `/services`, `/revenue`, `/admin/settings`.
- **Expected outcomes**: (a) unauthenticated → redirected to `/login`. (b) USER → redirected to `/today`.
- **Negative path**: admin visiting the same admin routes loads them normally (no redirect).

### Journey: Today dashboard
- **Steps**: log in; land on `/today`.
- **Expected outcomes**: heading **"Front Desk — Today"**; today's appointments listed time-ordered with client + service; remaining-count badge equals booked future appointments.
- **Negative path**: no appointments today → empty-state message; API error → error state (not a blank crash).

### Journey: Clients CRUD (admin)
- **Steps**: as admin go to `/clients`; open `/clients?modal=new`; create client (name+phone); then `/clients?modal=edit&id=:id` to edit; then delete.
- **Expected outcomes**: new client appears in table; edit persists and reflects updated values; delete removes row; modal state is driven by query params (deep-linkable).
- **Negative path**: submit with missing required field → validation error in modal, no row created.

### Journey: Services CRUD (admin)
- **Steps**: as admin go to `/services`; create service (name/duration/price) via `?modal=new`; edit via `?modal=edit&id=:id`; delete.
- **Expected outcomes**: service appears in list; edits persist; delete removes it.
- **Negative path**: non-numeric price / missing duration → validation error, no create.

### Journey: Appointments book → complete → cancel
- **Steps**: open `/appointments?modal=book`; select client + service + future datetime; submit. As admin, mark an appointment completed. As booker, cancel a booked appointment. Use status filter chips (`?status=booked`, `?status=completed`).
- **Expected outcomes**: booked appointment shows status `booked`; admin "mark completed" sets `completed`; cancel sets `cancelled`; filter chips update `?status=` in URL and filter the list.
- **Negative path**: booking a past datetime → error, no appointment created; USER does not see/allow the "mark completed" action (or it 403s).

### Journey: Revenue (admin)
- **Steps**: as admin visit `/revenue` after completing an appointment.
- **Expected outcomes**: week and month totals display and include the completed appointment's service price.
- **Negative path**: USER redirected away; API error → error state; no completed appointments → totals show 0.

### Journey: Admin settings + deep-link refresh
- **Steps**: as admin visit `/admin/settings`; observe `postgresql` + `minio` badges; save a credential via the form. Separately, directly navigate/refresh deep links: `/clients?modal=new`, `/appointments?status=completed`, `/services?modal=edit&id=:id`.
- **Expected outcomes**: each service shows configured/unconfigured badge; banner "The following need credentials to activate: [list]" appears while any is unconfigured and clears once configured; PATCH persists and flips the badge. All deep links render the correct modal/filter state directly on load/refresh (no redirect-to-blank).
- **Negative path**: USER hitting `/admin/settings` → redirected to `/today`.

## Data integrity tests
- After `POST /api/appointments`: exactly one `Appointment` row exists with `status="booked"`, valid FKs to existing `Client` and `Service`, and `createdById` = the authenticated caller.
- Appointment `startTime` is stored as a DateTime and always in the future at creation time.
- `PATCH .../status` transitions only mutate `status` (no other fields altered); persisted value is one of `booked` / `completed` / `cancelled`.
- Revenue = SUM of `Service.price` over appointments with `status="completed"` within the UTC week/month windows; booked/cancelled never contribute.
- `User.email` is unique — a second signup/seed with the same email does not create a duplicate row.
- Seed is idempotent: running `seed.ts` twice yields exactly one `admin@bizbook.test` and one `user@bizbook.test` (upsert, not insert).
- Passwords are stored only as bcrypt hashes; `passwordHash` never appears in any API response.
- `SystemSetting` upsert keyed on `key @id` updates the existing row (updates `updatedAt`) rather than inserting duplicates.

## Seed / infra tests
- Running the seed script prints a line beginning `SEED_CREDS_JSON=` whose remainder is valid JSON containing both `admin` and `user` objects with usable credentials.
- The credentials printed by seed successfully authenticate via `POST /api/auth/login` for both roles.
- SPA fallback: a GET to a non-`/api` unknown path (e.g. `/some/client/route`) returns `index.html`, while `/api/**` unknown paths do NOT get the HTML fallback (return JSON 404) — confirms `/api` routers mount before the catch-all.

## Out of scope
- **Double-booking prevention**: spec explicitly states no double-booking enforcement is required; overlapping appointments are allowed and not tested as a failure.
- **Actual PostgreSQL / MinIO backing-service behavior**: `/api/admin/settings` stores credentials, but no feature exercises Postgres or object storage (open question in tasks.md); only the settings CRUD/badge surface is tested, not live connectivity to those services.
- **Third-party integrations**: spec resolves integrations to "None"; no external API contract tests.
- **Token/session revocation**: logout is client-side token discard; server-side token invalidation is not implemented and not tested.
- **Timezone variants for revenue**: only UTC week/month boundaries are asserted (per spec's deterministic UTC choice); locale/timezone-specific totals are out of scope.
- **Multi-container / volume persistence across redeploys**: data persistence depends on a mounted `data/` volume (deploy concern); not verified by functional tests here.

Wrote .pipeline/test_spec.md (74 cases across 21 endpoints / 9 journeys).
