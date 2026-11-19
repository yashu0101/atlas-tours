# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status & fix tracker

**`PROJECT_AUDIT.md` is the source of truth for open issues and project status.** Every issue has an ID (`A-01`, `B-05`, …), severity, status and owner. When you fix something, update its row, the progress table and the changelog there. When you find something new, add it with the next free ID. As of 2026-11-18 every item that needs no client decision is done; G-02/N-10 (Resend email) and N-8 (multi-admin, all equal) are built on provisional answers awaiting client sign-off; the 5 remaining items (G-04, G-08, G-09, N-2, N-3) are blocked on client decisions (marked ⏸ in the file). Non-numbered launch checks (V-1…V-4) and client questions (Q-x) are in its §2; the `dev` → `master` release is PR #8.

## Commands

```bash
npm run dev          # Next.js dev server (http://localhost:3000)
npm run build        # production build
npm start            # serve the production build
npx tsc --noEmit     # type check
npm run lint         # ESLint (flat config)
npm test             # Vitest unit + route tests (tests/unit, tests/routes)
npx vitest run tests/unit/api.test.ts   # a single test file
npm run test:e2e     # Playwright (tests/e2e) — starts its own dev server on :3150
```

Before finishing a change, run `npx tsc --noEmit`, `npm run lint` and `npm test`; run `npm run test:e2e` when touching pages, components or the admin UI. If your own `npm run dev` is already running, `next dev` refuses a second instance in the same project — build and run the suite against `next start` instead, with test-only `JWT_SECRET` (≥32 chars), `ADMIN_EMAIL`, `ADMIN_PASSWORD` set, because production mode fails closed without them.

**Tests never touch `data/db.json`.** `vitest.config.mts` forces `DATABASE_URL=""`; DB-backed tests use `tests/helpers/temp-db.ts`, which points `JSON_DB_PATH` at a fresh temp file seeded from `src/lib/seed-data.ts`. Route tests call handlers directly with `new NextRequest(...)` and mock `next/headers` cookies (see `tests/routes/packages.test.ts`). Playwright's `webServer` also uses a temp `JSON_DB_PATH`. Vitest is pinned to 4.x because 5.x requires `@types/node` ≥ 22.

**Manual testing against `npm run dev` does mutate `data/db.json`, which is git-tracked.** After manual POST/PATCH/DELETE testing, run `git checkout -- data/db.json` (or start the dev server with `JSON_DB_PATH` pointing at a scratch file). Public form endpoints, login and `/api/seed` are rate-limited (in memory unless Upstash is configured), so repeated curl testing can return `429` until the dev server restarts or the window passes.

Seeding Postgres (after `DATABASE_URL` is set) runs the schema migrations (v1–v6, see `db-schema.ts`), creates the tables **and** inserts the default content from `src/lib/seed-data.ts`. It is idempotent and non-destructive (`ON CONFLICT (id) DO NOTHING`; never updates/deletes; never seeds bookings/enquiries). Response: `{ "tables": "ok", "inserted": { "packages": n, … } }`. Pass `"content": false` to only create tables. In JSON mode it returns 400 (the JSON file seeds itself when missing). Rate-limited to 5 requests / 15 min per IP (429).

```bash
curl -X POST http://host/api/seed -H 'Content-Type: application/json' -d '{"secret":"<SEED_SECRET>"}'
```

## Environment

In **development** every var is optional and the fallbacks below apply. In **production** (`NODE_ENV=production`) the auth fallbacks are never used: missing values make the app **fail closed** (login always 401, `verifySession()` always unauthenticated, `/api/seed` returns 503) and log which variable is missing. Secrets are resolved lazily at request time, so `next build` works without them.

| Var | Dev fallback | Production | Effect |
|---|---|---|---|
| `DATABASE_URL` | unset | should be set | **Its presence is the storage switch** (see below) |
| `JWT_SECRET` | `atlas-tours-default-secret` | required, ≥ 32 chars | admin session signing |
| `ADMIN_EMAIL` | `admin@atlastours.com` | required | admin login |
| `ADMIN_PASSWORD` | `admin123` | required unless `ADMIN_PASSWORD_HASH` set | plaintext, compared in constant time |
| `ADMIN_PASSWORD_HASH` | unset | optional, preferred | bcrypt hash; wins over `ADMIN_PASSWORD` |
| `SEED_SECRET` | `atlas-seed-2024` | required to use `/api/seed` | guards `/api/seed` |
| `SESSION_VERSION` | `"1"` | optional | embedded in session tokens; change it to log every admin out |
| `NEXT_PUBLIC_SITE_URL` | `https://atlastours.in` | should be set (domain unconfirmed) | `metadataBase`, canonical, OG, sitemap, robots |
| `JSON_DB_PATH` | `data/db.json` | — (JSON backend only) | overrides the JSON file path; resolved on every call; used by tests |
| `RESEND_API_KEY` / `NOTIFY_FROM` | unset (no emails) | needed for emails | both set → emails via Resend (G-02/N-10); `NOTIFY_FROM` is a verified sender, e.g. `Atlas Tours <bookings@domain>` |
| `NOTIFY_EMAIL` | unset | needed for owner alerts | owner address(es), comma-separated; without it only customer emails are sent |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | unset (in-memory limits) | recommended | both set → rate-limit counters shared across serverless instances via Upstash Redis REST (B-18) |

## Architecture

Single-page marketing site for a Varanasi tour operator, plus a password-gated admin CMS. Next.js 16.4.6 App Router, React 19.3, TypeScript strict.

### Dual storage backend (`src/lib/db.ts`)

The single most important thing to know. One module exports an async CRUD API (`getPackages`, `getPackageById`, `addBooking`, …) that dispatches on `isPostgres()` (true when `DATABASE_URL` is set, or a test client is installed):

- **No `DATABASE_URL`** → JSON file at `data/db.json`. Reseeds from `src/lib/seed-data.ts` **only when the file is missing** (ENOENT); a corrupt file throws instead of being overwritten. Writes are atomic (temp file + rename, with retries for Windows locks). Logs a loud error if used with `NODE_ENV=production` — it does not work on read-only serverless filesystems.
- **`DATABASE_URL` set** → Neon serverless Postgres, `require`d lazily inside `getSQL()` so the JSON path never loads the driver.

**One definition per entity (B-15).** Each entity is an `Entity<T>` in `db.ts` (`PACKAGES` … `OFFERS`): table, JSON key, a `columns` map (camelCase field → snake_case column, e.g. `originalPrice` → `original_price`, `FAQ.order` → `sort_order`; `type: "array"` for JSONB arrays, `"timestamp"` for TIMESTAMPTZ, `optional` for NULL → `undefined`), the `patchable` whitelist and `orderBy`. Generic `fromRow`/`pgInsert`/`pgList`/`pgGet`/`pgUpdate`/`pgDelete` and `jsonCRUD` are driven by it — there is no ORM and no per-entity SQL. `columns` is a mapped type over the TS type, so a field added to `types.ts` fails `tsc` until it has a column. Postgres returns `createdAt` as an ISO string (Date → `toISOString`); array columns are JSONB in Postgres (written as `JSON.stringify` params, read with `safeParseArray`, bad data → `[]`) and real arrays in the JSON file.

IDs and `createdAt` are always generated server-side and are never patchable. FAQs are sorted by `order` in both backends.

**Schema and migrations (`src/lib/db-schema.ts`, B-16).** `initDB(sql)` (run by `/api/seed`) applies the pending entries of `MIGRATIONS` and records them in `schema_migrations`; each migration runs as one `sql.transaction([...])`, so it applies fully or not at all. v1 = the original schema; v2 `created_at` → TIMESTAMPTZ; v3 package arrays → JSONB; v4 repairs out-of-range old rows (unknown status → default, rating/discount clamped, negative price → 0) and then adds validated CHECK constraints (statuses, kind, source, rating 1–5, price ≥ 0, discount 0–100); v5 indexes; v6 admin users, sessions and audit log (N-8); v7 `booking_payments` (N-13: adds the `verifying` payment status to the CHECK, `utr` and `payment_submitted_at` columns, partial unique index on `utr`); v8 package details (N-18: `exclusions` JSONB, `starts_from`, `min_travelers`, `price_note`). **Never edit a shipped migration — append one.** If a status/kind union in `types.ts` gains a value, add a migration that drops and re-adds its CHECK. No foreign keys from bookings/enquiries to packages on purpose (historical records keep `package_name`). After deploying a new migration, re-run `/api/seed`.

**Postgres tests (B-17).** `tests/pg/**` run the real `db.ts` Postgres path on in-process PGlite (`@electric-sql/pglite`) through `tests/helpers/pglite-sql.ts`, which gives PGlite neon's interface and is installed with `setSqlClientForTests()` (throws in production). Includes an old-schema → latest migration test (`tests/pg/fixtures/old-schema.ts`). PGlite is not Neon: type parsing and HTTP-transaction behaviour are verified against PGlite only.

Updates only touch keys **present** in the body, filtered by the entity's `patchable` list, with every value parameterised via `sql.query(text, params)` — never interpolate identifiers from input. Fields declared `nullable(...)` in a route config (package `originalPrice`, review `packageName`, FAQ `questionHi`/`answerHi`, offer `code`) are **cleared by sending `null` or `""`**; `null` for any other field is a 400. The admin edit forms send `null` for emptied optional fields — `undefined` is dropped by `JSON.stringify` and changes nothing.

Adding a field means `types.ts` + the entity's definition in `db.ts` + a migration + the route config. Adding an entity means `types.ts`, a new `Entity` + `store()` + exported wrappers in `db.ts`, a migration, a visibility rule in `src/lib/visibility.ts` (if public), and a route config.

### API layer (`src/lib/api.ts`, `src/lib/crud-route.ts`)

Every route handler is wrapped in `withHandler()`: thrown `HttpError`s become `{ error }` with their status; anything else is logged and returned as a generic 500 (no stack traces leak). `readJson()` returns 400 on malformed JSON. Validation helpers (`str`, `oneOf`, `positiveInt`, `isEmail`, `isPhone`, `pickFields`, `requireFields`) are hand-rolled — there is no zod.

The six content entities (`packages`, `reviews`, `gallery`, `blogs`, `faqs`, `offers`) are generated by `crudRoute({ list, add, update, remove, isPublic, fields, required, defaults })`. Each `route.ts` is just a config: a field spec (whitelist + types — unknown fields are dropped, wrong types → 400), required fields, defaults, and the public-visibility predicate.

Contract, shared by all eight entity routes:

- `GET` is public for content entities and returns **only publicly visible items** (packages: `!hidden`; others: `active !== false`, rules in `src/lib/visibility.ts`). `?all=1` returns everything **only** with a valid admin session — the admin page always uses it. `bookings`/`enquiries` `GET` is admin-only: with no params it returns the bare array; with any of `q`, `page`, `pageSize` (≤ 100), `from`/`to` (IST dates), `bookingStatus`/`paymentStatus` or `status`/`kind` it returns `{ items, total, page, pageSize }` (B-20). Filter rules live once in `src/lib/inbox-filters.ts` (run in memory for JSON, compiled to parameterised SQL in `db.ts`). `GET /api/{bookings,enquiries}/export` returns the filtered CSV (`src/lib/inbox-csv.ts`: BOM, formula-injection guard, 10,000-row cap with `X-Export-Truncated`); `GET /api/admin/summary` feeds the Dashboard counts.
- `POST`/`PATCH`/`DELETE` require an admin session (401 otherwise).
- `PATCH` and `DELETE` take the id **in the JSON body**, not a query string. Unknown id → 404.
- Success responses are the **bare entity or array** — no envelope. `DELETE` returns `{ success: true }`. Errors are `{ error: string }`.
- Booking/enquiry status values are validated against the enums in `types.ts`.

Public, unauthenticated write endpoints (`src/lib/public-form.ts`) — do not confuse with the admin `/api/bookings` and `/api/enquiries`:

- `POST /api/enquiry` — used by the Contact form. Whitelisted, length-capped fields; `travelers` coerced to int 1–100; accepts `packageId` (or legacy `package` id/name, mapped).
- `POST /api/book` — used by `BookingForm` on `/packages/[id]`. `packageName` and `amount` are looked up server-side; `amount = price × travelers` (assumes per-person pricing — unconfirmed with the client). The customer reference is `bookingReference(id)` (first 8 hex chars, upper-case, `src/lib/booking-ref.ts`).
- `POST /api/review` (N-5) — customer review, saved `active: false, source: "customer"` until approved in the admin Reviews tab. Returns `{ success: true }` only.
- `POST /api/trip-request` (N-6) — "Plan my trip" / callback form; saved as an `Enquiry` with `kind` `"trip-plan"`/`"callback"` and the answers as labelled lines in `message` (`src/lib/trip-request.ts`). Contact-form enquiries get `kind: "contact"`; missing `kind` means contact.
- All three: honeypot field `website` (non-empty → 200, nothing saved) and a rate limit of 5 requests/min per IP.
- **Emails (G-02/N-10, `src/lib/notify.ts`):** after a record is saved, `/api/book`, `/api/enquiry`, `/api/trip-request` and `/api/review` call `notifyAfterResponse(event)`, which uses `after()` from `next/server` (fire-and-forget fallback outside a request scope) so email never slows or fails the form. Owner alert to `NOTIFY_EMAIL` for all four; customer confirmation for booking/enquiry/trip/callback when an email was given (never for reviews). Customer mails never echo free text **or the customer's name** (anti-relay: any address can be entered) and are capped at 5 per recipient per 24 h (`CUSTOMER_MAIL_LIMIT`, shared via Upstash when configured); all values HTML-escaped; subjects stripped of CR/LF. Copy is in `email.*` in `en.ts`. Off unless `RESEND_API_KEY` + `NOTIFY_FROM` are set.
- `POST /api/payment-claim` (N-13) — customer submits the UPI UTR (reference + phone + 12-digit `utr`); only for bookings awaiting payment — `confirmed` with payment `pending` or `failed` (`isAwaitingPayment` in `src/lib/upi.ts`, shared by `/track`, this route and the admin pay link) — and an unused UTR (409 otherwise) → `paymentStatus` `"verifying"`, `utr`, `paymentSubmittedAt`, owner email. Rate limit 10 / 15 min per IP, honeypot. This is manual UPI verification, not a gateway (G-09 stays blocked). Admin `PATCH /api/bookings` also accepts `amount` (int 1–10,000,000); marking payment `pending` or `failed` (owner rejects the UTR) clears `utr`/`paymentSubmittedAt` so the customer can pay again; the admin Edit amount button is disabled while `verifying` or `paid`. Notify events: confirming a booking whose payment is pending emails the customer the `/track?ref=` pay link (`booking-confirmed`), `payment-claim` alerts the owner, marking paid emails a receipt (`payment-received`). Re-run `/api/seed` after deploying (v7).
- `POST /api/booking-status` (N-4) — lookup by reference + phone (last 10 digits); identical 404 for a wrong reference or phone; returns status fields only; 10 lookups / 15 min per IP.

`Enquiry.kind` and `Review.source` were added after launch: `db-schema.ts` adds their Postgres columns with `ALTER TABLE … ADD COLUMN IF NOT EXISTS`, so re-run `/api/seed` (idempotent) after deploying.

Rate limiting (`src/lib/rate-limit.ts`, B-18) is async (`await consume(...)`, `await guardPublicForm(...)`). With both `UPSTASH_REDIS_REST_*` vars set, counters live in Upstash Redis (one `/multi-exec` call: `SET key 0 PX window NX` + `INCR`, keys `atlas:rl:*`, 1.5 s timeout) and are shared across instances; on any Upstash error that call falls back to the in-memory limiter (logged once per outage, never fails closed). Without them it is **in-memory and per instance** (resets on cold start). Client IP: on Vercel (`VERCEL` env set) `x-vercel-forwarded-for` → `x-real-ip` → `x-forwarded-for`; elsewhere only the first `x-forwarded-for` entry, because other proxies pass the Vercel headers through from the client. Tests clear the Upstash vars in `vitest.config.mts`.

There is no middleware. Auth is enforced per route handler; the `/admin` page guards itself client-side via `/api/auth/me` and redirects to `/login` on any 401.

### Admin UI (`src/app/admin/`)

`page.tsx` (`"use client"`) holds the content-entity list state, the auth check, the bulk `?all=1` load of the six content entities, logout / sign-out-all and tab switching. Bookings and Enquiries tabs fetch their own server-side pages via `_lib/inbox.ts` (debounced search, export from the server); the Dashboard and sidebar counts come from `/api/admin/summary`. The Users and Audit log tabs (N-8) load their own data. Everything else lives in private (underscore, non-route) folders:

- `_lib/api.ts` — fetch helpers (`sendEntity`, `deleteById`, `reportFailure`, `loadList`), the `Patch<T>` type and status constants.
- `_lib/crud.ts` — `entityCrud(url, label, setItems)` (create/update/remove that only touch state on success) and `useEntityTab(...)` (per-tab modal state).
- `_components/` — `Dashboard`, one `*Tab.tsx` per entity, `shared.tsx` (`TabHeader`, `Empty`, `Modal` with close button/Escape), `icons.tsx` (inline SVG icons), `AdminStyles.tsx` (the admin CSS, scoped under `.adm-root`, themed with `--a-*` variables that switch under `[data-theme="dark"]`), and `forms/*Form.tsx`. `_lib/tabs.ts` holds the `Tab` union. Use the `--a-*` variables, not hex colours, in admin markup.

Edit paths send `null` for emptied nullable fields (conversion lives in each `*Tab.tsx`); create never sends `null`. The admin is covered end to end by `tests/e2e/admin.spec.ts`, `admin-lists.spec.ts` and `admin-users.spec.ts`.

### Seed data (`src/lib/seed-data.ts`)

Single source for default content (3 packages, 3 reviews, 6 gallery images, 3 blogs, 5 FAQs, **no offers** — fixed ids and 2024 dates; offers are real discounts entered by the owner in the admin, Q-5). Used by the JSON backend when its file is missing and by `/api/seed` for Postgres. `data/db.json` matches it; keep them in sync if the seed changes.

### Auth (`src/lib/auth.ts`)

`verifyAdminCredentials(email, password)` (async) is the single login check: bcrypt when `ADMIN_PASSWORD_HASH` is set, otherwise a constant-time compare (`safeEqual`, SHA-256 + `timingSafeEqual`). The login route locks an IP out after 5 failures per 15 min (429). Success signs a 24h HS256 JWT (jose) with issuer `atlas-tours`, audience `atlas-tours-admin`, `role: "admin"` and `sv` = `SESSION_VERSION`, stored in the httpOnly `admin_session` cookie built by `sessionCookieOptions()` (`sameSite: strict`, `secure` in production; logout clears it with the same options). `verifySession()` rejects tokens with the wrong alg/issuer/audience/role/`sv`. **Admin users and sessions (N-8).** Besides the env admin (bootstrap/recovery login, still fail-closed in production), admins can be stored in the DB (`AdminUser`, bcrypt cost 12, email lower-case and unique; managed via `/api/admin-users` and the Users tab; all admins are equal — no roles). Every login path does the same DB lookup and exactly one bcrypt compare (dummy hash when nothing matches), so timing doesn't reveal accounts — not even the env admin's email. If `ADMIN_EMAIL` equals a DB user's email the env admin wins and a config error is logged. Sessions are **server-side and revocable**: the JWT carries `jti` + `uid`, and `verifySession()` also requires a matching `AdminSession` row that is not revoked/expired and an account that is still active. Logout revokes the current session; `POST /api/auth/signout-all` revokes all of the user's sessions; deactivating/deleting a user or changing a password revokes their sessions (your own current one is kept on a self password change). Env-admin sessions carry an `ec` claim (HMAC of the env email + password/hash, keyed with `JWT_SECRET`), so rotating `ADMIN_PASSWORD`/`ADMIN_PASSWORD_HASH` ends them. Logging in again revokes the session the new cookie replaces. `SESSION_VERSION` remains the global kill switch. `requireAdmin()` returns `{ email, userId, sessionId }`. **Audit log:** `audit()` (`src/lib/audit.ts`) records create/update/delete (content entities via `crud-route.ts`, bookings/enquiries, users), login, logout, login_failed, signout_all and password_change, with changed field **names only**; a failed audit write never fails the action; `GET /api/audit?limit=` (≤ 500) feeds the Audit log tab. Failed logins are audited at most 50/hour across all IPs (so a flood can't push real entries out), and entries older than 180 days are pruned on each login (`pruneAuditLog`). Postgres breaks same-millisecond ties with `audit_log.seq`. In the JSON backend these rows live in `data/db.admin.json` (git-ignored), so logins never touch `data/db.json`. Deploying this logged out every pre-N-8 session (old tokens have no `jti`). **Release order matters:** until `/api/seed` has applied migration v6, admin login fails (the session table is missing; the log says so) — run it right after deploying.

Image URL fields (package `image`, gallery `src`, blog `image`) use the `"image"` field type: only `https:` URLs or site-relative paths starting with a single `/` are accepted.

Fields stored in Postgres `INTEGER` columns (package `price`/`originalPrice`, review `rating`, offer `discount`, FAQ `order`) use `int(min, max)` from `api.ts`, never plain `"number"`: plain `"number"` accepts decimals, which the JSON backend stores but Postgres rejects with a 500 (B-13).

### Platform config

- `next.config.ts` sends `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, HSTS (production) and a **report-only** CSP. Before switching the CSP to enforcing, check DevTools for violations on `/`, `/login`, `/admin`. A new external origin (image host, video CDN, embed) must be added to the CSP.
- Poppins is self-hosted via `next/font/google` in `layout.tsx` (weights 300–900, CSS var `--font-poppins`); inline `fontFamily: "'Poppins', sans-serif"` still works. **Font Awesome and Google Fonts CDNs are no longer loaded** — use inline SVG icons.
- `layout.tsx` has an inline pre-paint script that applies the stored theme (`localStorage["atlas-theme"]`) before hydration. `context.tsx` must keep its first render as `"en"`/`"light"` and read localStorage only in an effect (FAQ.tsx reads `lang` and would hit hydration mismatches otherwise). `<html lang>` stays `"en"` regardless of the toggle until content is translated (G-08).
- `npm run lint` works (`eslint.config.mjs`, flat config from `eslint-config-next`). Remaining warnings are intentional `<img>` usage in the admin tabs/forms.
- Keyboard focus: `globals.css` has a global `:focus-visible` outline (`--orange`, 0 specificity via `:where()`). Never add inline `outline: none` — inline styles beat it. To hide the mouse outline, put `outline: none` in a class (see `.login-input`, `.wa-input`) so the `:focus-visible` rule still applies. The home page starts with a `.skip-link` to `<main id="main-content" tabIndex={-1}>`, visible only on keyboard focus.

### Frontend

`src/app/page.tsx` is an **async server component** (`export const dynamic = "force-dynamic"`). It loads packages, gallery, reviews, blogs and FAQs directly from `db.ts` in parallel, filters them with the same `src/lib/visibility.ts` rules the API uses, and passes them as props (`initialPackages`, `initialImages`, `initialReviews`, `initialBlogs`, `initialFaqs`) to the section components. **Components do not fetch on mount** — the content is in the server HTML. A failed load logs and falls back to `[]`. The page also emits FAQPage JSON-LD. The admin page is the only place that still fetches client-side.

Sections are `"use client"` components rendered in order with `<WaveDivider>` SVGs between them; navigation is hash anchors, not routes. Anything rendered on both server and client must be deterministic: prices use fixed `en-IN` formatting and blog dates use a hand-written IST formatter, to avoid hydration mismatches.

**Header (N-15):** `Header.tsx` checks what is under it on scroll (rAF-throttled `elementsFromPoint`) and sets `data-tone`/`data-surface` on `header.site-header`: **clear** over a dark area at the top of the page, **dark glass** over dark areas once scrolled, **light glass** (frosted white, navy text) over everything else; the dark theme always uses the dark look. In both glass states the bar (`.hdr-bar`) floats: inset 10px from the top/sides, 20px radius, shadow instead of a bottom border; the outer `header` is `pointer-events: none`. Dark areas are marked `data-header-tone="dark"` (home hero, Counter, Reviews, Footer, `FormPageShell` band, blog/wishlist/compare hero bands, both packages heroes). **A new navy/photo section or page band must get that attribute**, or the header will show navy text on it. Covered by `tests/e2e/header.spec.ts`.

Scroll reveal lives in `src/components/RevealObserver.tsx` (renders nothing): an `IntersectionObserver` adds `visible`/`active` to any `.fade-in`, `.reveal`, `.reveal-left`, `.reveal-right`, `.reveal-scale` element, and a `MutationObserver` picks up elements mounted later. Components opt into animation purely by class name (plus `.stagger-N`, `.card-hover`, `.img-zoom` from `globals.css`). `globals.css` has a `prefers-reduced-motion` block that disables animations and shows reveal elements immediately; `Hero.tsx` also stops the video and typing loop for reduced motion. `ScrollProgress.tsx` updates the progress bar through a ref (no React state per scroll) — keep scroll listeners passive and avoid setState on every scroll event.

Styling is **CSS custom properties + inline `React.CSSProperties` objects**, not Tailwind (it has been removed — don't reintroduce utility classes). Theme and dark mode come from `:root` / `[data-theme="dark"]` variables in `src/app/globals.css`; a component that hardcodes a color will break dark mode (E-02 fixed this for the sections; when a dark override is needed and no variable matches, components use a local `var(--x, #original)` set only under `[data-theme="dark"] #section-id` in their own `<style>` block). Fonts are self-hosted via next/font (see Platform config). **The client has asked for no visual/design changes** unless explicitly approved.

Shared types: import entity types from `src/lib/types.ts` (`TourPackage`, `Review`, `GalleryImage`, `BlogPost`, `FAQ`, `Offer`, …) — never redeclare them locally. Field names that previously drifted: reviews use `text` (not `message`), blogs use `createdAt` (not `date`), itinerary is `string[]`, ids are `id` (not `_id`).

`src/lib/context.tsx` provides `useApp()` with `lang` (`"en" | "hi"`) and `theme`, persisted to `localStorage`; theme is reflected onto `<html data-theme>` (lang is not reflected — see Platform config). UI strings live in a typed message catalog, `src/lib/i18n/` (`en.ts` is the full source of truth; `hi.ts` is a partial that falls back to English). Client components use `const t = useT()` (`src/lib/i18n/use-t.ts`); server components use `getT("en")` / `translate("en", key)`. Keys are a typed dot-path union, so a typo fails `tsc`. Never hardcode visible text in components — add a key to `en.ts`, then run `UPDATE_HINDI_DOC=1 npx vitest run tests/unit/i18n.test.ts` to refresh `docs/hindi-strings-needed.md` (the test fails if it is stale). Most Hindi copy is still missing (G-08). DB content is not translated; `FAQ.tsx` shows `questionHi`/`answerHi` when present.

SEO: `src/lib/seo.ts` holds site URL, title, description, OG image and the JSON-LD builders (`travelAgencyJsonLd`, `faqPageJsonLd`, `jsonLdString` which escapes `<`). `layout.tsx` sets `metadataBase`/OG/Twitter/canonical and the TravelAgency JSON-LD; `src/app/robots.ts` and `src/app/sitemap.ts` exist; the favicon is `src/app/icon.jpeg`.

Images (N-9): public components render images through `src/components/SmartImage.tsx` (`next/image`). The optimiser runs only for local files and `images.unsplash.com` (`images.remotePatterns` in `next.config.ts`, mirrored by `isOptimizableImage` in `src/lib/images.ts`); any other admin-pasted host is rendered `unoptimized`. Never add an open `**` remote pattern (public image proxy). Admin `<img>`s are unchanged. The hero video has `preload="none"` and autoplays only on ≥768px without reduced motion, Data Saver or a 2g/3g connection (`shouldAutoplayVideo`). Local fallbacks live in `public/images/` (`hero-fallback.jpg`, `placeholder.jpg`, `package.jpg`, `atlas-logo.jpeg`).

### Contact info, routes and colours (P4)

- **Contact details come only from `SITE_CONFIG` / `PHONE_DISPLAY` in `src/lib/config.ts`** — `tests/unit/site-config.test.ts` fails if a component hardcodes the phone or email. The email `info@atlastours.in` is provisional (C-09, see `CLIENT_QUESTIONS.md`). Footer social links come from `SOCIAL_LINKS` in the same file (guessed handles, Q-9).
- **Our Team** (N-12, `Team.tsx`, after Reviews) is fixed in code: members in `src/lib/team.ts` (optional `name` — role is the heading while unset; photo-beside-text rows, alternating sides), photos in `public/images/team/`. **UPI payment** details come only from `UPI_CONFIG` in `config.ts` (`UpiPayCard.tsx`, shown only in per-booking mode (amount + reference) in the `/track` pay panel (`PaymentPanel.tsx`); the Contact section no longer shows a UPI card; manual payment, not G-09).
- **Package listing `/packages` (N-14):** server page + `PackageExplorer.tsx` (search, category chips, sort; state mirrored to `?q=&category=&sort=` via `replaceState`). Package cards are one component, `PackageCard.tsx`, used by the home section, the listing and the detail page's "More packages" row — change cards there. Search/sort helpers live in `package-utils.ts`.
- Detail routes: `/packages/[id]` (with `BookingForm` → `/api/book`) and `/blog/[id]`, both server components that `notFound()` on hidden/inactive items and reuse the home chrome. `Header`/`Footer` turn section links into `/#x` off the home page via `usePathname()`. The sitemap lists both.
- **Pay panel on `/track` (N-13):** for bookings awaiting payment (`confirmed` + payment `pending` or `failed`, `isAwaitingPayment`), `/track` shows a pay-now / pay-again prompt and a per-booking UPI QR (`src/lib/upi.ts` builds `upi://pay?pa=<UPI_CONFIG.id>&pn=…&am=…&cu=INR&tn=Atlas booking <REF>`, literal `@`; amount = booking amount) and a UTR form. A UPI ID QR is used because an account+IFSC QR failed on real phones. The booking success message no longer shows a QR (text pointing to `/track`); the Contact section has no UPI card. Admin Bookings tab: `Verifying` filter/status, UTR + submitted time, Edit amount, Copy pay link.
- Form pages (N-4…N-6): `/track` (noindex), `/reviews/new`, `/plan-trip` — shared chrome in `FormPageShell.tsx`, shared form styles in `public-form-ui.tsx`; linked from the footer, Reviews, Contact and the booking success message.
- Wishlist/compare (N-7): ids in `localStorage` (`atlas-wishlist`, `atlas-compare`, max 3) via `src/lib/wishlist.ts` (`useSyncExternalStore`, empty server snapshot); `/wishlist` and `/compare?ids=` are noindex; `CompareBar` sits bottom-left (WhatsApp is bottom-right).
- Offers render on the home page (`Offers.tsx`) only when visible: `active !== false` and `validTo` (inclusive, IST date) not passed (`isOfferPublicAt` in `visibility.ts`).
- Text colours: use `--orange-text` / `--gold-text` for orange/gold *text*, `--on-accent` for text on orange/gold *fills*, `--success-text` / `--error-text` for status messages and `--input-border` for form borders. `tests/unit/contrast.test.ts` checks WCAG AA for the variable pairs in both themes.
