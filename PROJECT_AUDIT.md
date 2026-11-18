# Atlas Tours — Project Audit & Fix Tracker

> **Single source of truth** for project status and the fix backlog.
> Audit date: **2026-11-17** · Audited commit: `dd7e91d` · Rating at audit: **4.5 / 10**
> Last updated: **2026-11-18** · PRs #1–#7 merged into `dev` (`010334a`) · `master` not yet updated · Current rating: **8.5 / 10** · **72 / 80 done · 8 blocked on client decisions · 0 open**

---

## How to use this file

1. **Pick a workstream** (§4). Workstreams are split by **file ownership** so they can run in parallel without merge conflicts. Respect the `Depends on` notes.
2. **Before starting an issue**, set its status to `🔄 In progress` and put your name/agent/branch in `Owner`.
3. **When done**, set `✅ Done`, fill `Fixed in` (commit hash / PR), and tick the matching row in the Progress table (§1).
4. **New issue found?** Add it to the right workstream with the next free ID (e.g. `C-12`). Never reuse or renumber IDs.
5. **Rescoring:** after a workstream completes, update the scores in §2 and add a line to the Changelog (§7).
6. Verify every fix with `npx tsc --noEmit`, `npm run lint`, `npm test`, and `npm run test:e2e` for UI changes (see CLAUDE.md → Commands).

Status legend: `⬜ Todo` · `🔄 In progress` · `✅ Done` · `⏸ Blocked` · `🚫 Won't fix`
Severity: **P0** launch blocker · **P1** must fix before launch · **P2** should fix · **P3** nice to have

---

## 1. Progress

| Workstream | Owns files | Issues | Done | Status |
|---|---|---|---|---|
| A — Admin panel | `src/app/admin/**`, `src/app/login/page.tsx` | 8 | 8 | ✅ |
| B — API, DB & auth | `src/lib/*` (db, auth, api, crud-route, seed-data, …), `src/app/api/**` | 12 | 12 | ✅ |
| C — Public data contracts | `Packages.tsx`, `Reviews.tsx`, `Blog.tsx`, `FAQ.tsx`, `Contact.tsx`, `Gallery.tsx` | 11 | 11 | ✅ (C-09 email provisional) |
| D — Page shell & animation | `src/app/page.tsx`, `src/app/globals.css`, `src/lib/context.tsx` | 5 | 5 | ✅ |
| E — Dark mode & accessibility | all `src/components/*` | 12 | 12 | ✅ |
| F — SEO, config, assets, tooling | `layout.tsx`, `next.config.ts`, `package.json`, `public/`, `eslint.config.mjs` | 12 | 12 | ✅ |
| G — Missing features | new files, `tests/` | 10 | 6 | ⏸ G-02, G-04, G-08 (Hindi copy), G-09 blocked |
| N — New features (2026-11-18 proposal) | new pages/routes, `src/app/admin/**`, `next.config.ts` | 11 | 7 | ✅ N-1, N-4…N-7, N-9 (PR #6), N-11 · ⏸ N-2, N-3, N-8, N-10 |
| **Total** | | **81** | **73** | 8 blocked · 0 open |

**By severity:** P0 ✅ 6/6 · P1 ✅ 21/21 · P2 ✅ 26/28 (2 ⏸: G-02, G-04) · P3 ✅ 14/16 (2 ⏸: G-08 copy, G-09).

**Blocked on the client (⏸) — nothing else is left.** All open questions for the client are collected in **`CLIENT_QUESTIONS.md`**.
- **G-02** — notifications: needs an email/WhatsApp provider and addresses.
- **G-04** — admin image upload: needs a storage provider account (Vercel Blob / Cloudinary).
- **G-08** — message catalog is built; needs the Hindi copy (170 strings, `docs/hindi-strings-needed.md`).
- **G-09** — payments: needs a Razorpay account and deposit/full-payment decision.

**Built with provisional answers (one-line changes once the client confirms):** C-09 email `info@atlastours.in`; G-01/Q-1 per-person pricing; E-10 dark text on orange buttons (visible change — needs a design sign-off).

**Merge status:** PRs #1 → #2 → #3 → #4 → #5 → #6 → #7 are **merged into `dev`** (merge commits `f9a17c4`, `899fc03`, `e2bf268`, `3ebe2e9`, `ba4cd92`, `a508f04`, `010334a`; merge commits, not squash, so every hash in this file exists on `dev`). `master` is still at the audited commit `dd7e91d`; a `dev` → `master` PR is the step for production.

**For future work:** every remaining numbered item is blocked on a client decision (§2 "Pending" lists the non-numbered items). When a decision arrives, set the item to 🔄, keep agents inside their workstream's files, and keep the server-props contract for section components (see CLAUDE.md → Frontend).

---

## 2. Where the project stands

### Current (2026-11-18, branch `dev` @ `010334a`)

- **Stack:** Next.js **16.4.6** App Router, React 19.3, TypeScript strict, Neon Postgres or JSON-file storage (`DATABASE_URL` switches).
- **Checks (recorded after the PR #6 merge, `a508f04`):** `npx tsc --noEmit` ✅ · `npm run lint` 0 errors ✅ · `npm test` 294/294 ✅ · `npm run test:e2e` 28/28 ✅ · `npm run build` ✅. PR #6 Vercel preview deployments passed. PR #7 (`010334a`, `<html data-scroll-behavior>`): `tsc` ✅, `lint` 0 errors ✅, `npm test` 294/294 ✅, Vercel ✅.
- **Client questions:** collected in **`CLIENT_QUESTIONS.md`** — keep it and the table below in sync.
- **`npm audit --omit=dev`:** 0 vulnerabilities. Dev deps still report some (untriaged).
- **Verdict:** **launchable after configuration and a staging check** — set `JWT_SECRET` (≥32 chars), `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH` (or `ADMIN_PASSWORD`), `DATABASE_URL`, `SEED_SECRET`, `NEXT_PUBLIC_SITE_URL`; run `/api/seed` and admin edits on staging Postgres; do the manual browser pass below. Every remaining numbered item needs a client decision.

### Pending verification / decisions (not numbered issues)

| # | Item | Type | Why it matters |
|---|---|---|---|
| V-1 | Postgres staging test: `/api/seed` twice (3/3/6/3/5/0 then all zeros — no seed offers since Q-5), admin create/edit/clear-field/delete | **Verify** | Postgres update (P2) and seed (P3) paths were reviewed but never executed |
| V-2 | Browser pass: package modal & gallery lightbox (focus trap, Esc, Enter/Space), closed mobile menu/WhatsApp skipped by Tab, carousel pauses on hover, reduced-motion mode, dark-mode colours, login lock icon, skip link + focus rings; **P4:** `/packages/[id]` and `/blog/[id]` pages, booking form, package/gallery filters, offers section with a live (unexpired) offer, new button text colour; **N-round (PR #6):** admin search/filters/pagination/CSV export, `/track`, `/reviews/new` + admin approval, `/plan-trip` (incl. callback mode), wishlist heart / compare bar / `/wishlist` / `/compare`, optimised images and click-to-play hero video | **Verify** | Covered by code review, curl, headless/Playwright runs — not by a person clicking through |
| V-3 | CSP: check DevTools for report-only violations on `/`, `/login`, `/admin`, then switch to enforcing | **Verify** | CSP currently blocks nothing |
| V-4 | Production env vars (list above) and `SESSION_VERSION` policy | **Configure** | Production auth fails closed without them |
| Q-1 | `/api/book` pricing: `amount = price × travelers` | **Decide** (provisional, built) | P4's booking form (G-01) shows this estimate. Correct only if prices are **per person**; if per package, change to `price` in the route and the form |
| Q-2 | Production domain for `NEXT_PUBLIC_SITE_URL` | **Decide** | Canonical/OG/sitemap fall back to `https://atlastours.in` (unconfirmed) |
| Q-3 | Contact form error reuses the green success style | **Decide** (design) | Red error style needs design approval |
| Q-4 | ~~Login placeholder shows `admin@atlastours.com`~~ | ✅ **Done** (`de31c8f`, PR #5) | Placeholder is now `you@example.com`; guarded by `tests/e2e/reviews.spec.ts` |
| Q-5 | ~~Seed offers expired on 2025-12-31~~ | ✅ **Done** (`de31c8f`, PR #5) — decision: remove samples | Both sample offers removed from `seed-data.ts` and `data/db.json`; the Offers section appears once the owner adds a real, active, unexpired offer in Admin → Offers |
| Q-8 | E-10 sign-off: text on orange/gold buttons changed from white to dark navy (P4) | **Decide** (design) | A visible change made without design sign-off; alternative is a darker orange with white text |
| Q-6 | ~~Reviews carousel visible pause button~~ | ✅ **Done** (`de31c8f`, PR #5) | Pause/play button between the arrows (same style, hidden under reduced motion); focus-pause now counts keyboard focus only, and play always resumes. Covered by `tests/e2e/reviews.spec.ts` |
| Q-7 | Hero stats (500+, 15+ packages, 10+ destinations) contradict Counter (50+) and data (3 packages) | **Decide** (content) | Part of C-09; needs the correct numbers |

### Scores

| Area | At audit | After P1 | After P2 | After P3 | Reason (now) |
|---|---|---|---|---|---|
| Architecture | 7 | 8 | 8 | **8.5** | Admin split into `_lib` + `_components` with generic `entityCrud`; single seed module; Server-rendered page, shared API layer (`withHandler`, `crudRoute`), whitelisted column maps, single visibility module |
| UX / visual design | 6 | 7 | 7.5 | **7.5** | Design untouched; dark mode fixed in sections (E-02); no theme flash (D-05); fonts self-hosted |
| Correctness | 3 | 7 | 8 | **8.5** | 88 unit/route tests + 5 e2e tests (incl. admin CRUD) pass; Optional fields clear correctly (B-07), dashboard ordering (A-06), admin uses shared types (A-04); Postgres update path reviewed but not run |
| Security | 3 | 7 | 8 | **8** | + security headers, report-only CSP, strict session cookie with issuer/audience/role/version checks, https-only image URLs; open: CSP not enforcing yet, in-memory rate limits |
| Accessibility | 3 | 6 | 7 | **7.5** | + keyboard-only focus ring, skip link, inert closed menus, carousel pause, labels; open: contrast (E-10, blocked) |
| Performance | 4 | 6 | 6.5 | **6.5** | + self-hosted fonts, Font Awesome CDN removed; open: autoplay hero video |
| SEO | 2 | 7 | 7 | **7** | Content in HTML, OG/Twitter/canonical, TravelAgency + FAQPage JSON-LD, robots, sitemap, favicon; open: single URL, no detail pages (G-03) |
| Maintainability | 4 | 6 | 7 | **8.5** | Test suite (Vitest + Playwright), lint 0 errors, admin page 895 → 121 lines, Tailwind and empty folders removed |
| **Overall** | **4.5** | **7** | **7.5** | **8** | |

### At audit (2026-11-17, commit `dd7e91d`) — kept for history

Next.js 16.4.3 (build halted on advisory GHSA-mfr8-8qww-v76h), ~5,700 lines, 5 commits, no tests, lint broken. Verdict then: visually polished but **not launchable** — fetched content invisible, admin delete/save broken, admin insecure by default.

---

## 3. Feature inventory

✅ working · ⚠️ partial/buggy (see issue) · ❌ missing — **status as of last update**; "Was" shows the status at audit.

### Public site (single page, hash anchors, server-rendered data)
| Feature | Status | Was | Open issues |
|---|---|---|---|
| Header (sticky, theme toggle, EN/HI toggle, mobile drawer, Call Now) | ✅ | ✅ | E-06, C-09 |
| Hero (video bg, typing effect, CTAs, stats) | ✅ | ⚠️ | C-09 (stats contradict Counter), E-12 |
| About | ✅ | ✅ | — |
| Packages grid + detail modal (itinerary, Esc, focus trap) | ✅ | ⚠️ | G-03, G-06 |
| Gallery masonry + lightbox (keyboard accessible) | ✅ | ⚠️ | G-06 |
| Counter stats | ✅ | ✅ | D-04 (rAF cleanup) |
| Reviews carousel | ✅ | ⚠️ | E-08, E-12 |
| Blog (inline expand, dates) | ✅ | ⚠️ | G-07 |
| FAQ accordion (+ FAQPage JSON-LD) | ⚠️ English only | ⚠️ | C-06 (Hindi fields unused) |
| Contact / enquiry form (validated, honeypot, rate-limited, error state) | ✅ | ⚠️ | C-09 (email mismatch); error style pending design OK |
| Footer | ✅ | ✅ | — |
| WhatsApp widget | ✅ | ✅ | E-06 |
| Back-to-top, scroll progress bar | ✅ | ✅ | — |
| Reduced-motion support | ✅ | ❌ | — |
| Dark mode | ⚠️ | ⚠️ | E-02 (hardcoded colors) |
| Hindi translation | ⚠️ header only | ⚠️ | G-08 |
| SEO metadata, JSON-LD, robots, sitemap, favicon | ✅ | ❌ | set `NEXT_PUBLIC_SITE_URL` |

### Admin CMS (`/login` → `/admin`)
| Feature | Status | Was | Open issues |
|---|---|---|---|
| Login / logout / client-side guard (fail-closed prod, rate-limited, bcrypt option) | ✅ | ⚠️ | B-08, login placeholder |
| Dashboard stats + recent items | ⚠️ | ⚠️ | A-06 |
| Packages / Reviews / Gallery / Blogs / FAQs / Offers — create, edit, hide/activate | ✅ | ⚠️ | B-07 (can't clear optional fields in Postgres) |
| All 8 entities — delete | ✅ | ❌ | — |
| Booking & enquiry status changes | ✅ | ✅ | — |
| Load-error handling, 401 → /login | ✅ | ❌ | — |
| Image upload | ❌ URL only | ❌ | G-04 |

### API (`src/app/api/*`)
| Route | Methods | Auth | Notes |
|---|---|---|---|
| `packages`, `reviews`, `gallery`, `blogs`, `faqs`, `offers` | GET/POST/PATCH/DELETE | GET public (visible items only; `?all=1` for admin), writes admin | `crudRoute` config: whitelisted/typed fields, 404 on unknown id |
| `bookings` | GET/PATCH/DELETE | admin | status enums validated |
| `enquiries` | GET/PATCH/DELETE | admin | status enum validated |
| `book` | POST | public | server-side price lookup, honeypot, 5/min/IP; **unused by UI** (G-01) |
| `enquiry` | POST | public | whitelisted + length-capped fields, honeypot, 5/min/IP |
| `auth/login`, `auth/logout`, `auth/me` | POST/POST/GET | — | 5 failures / 15 min lockout; B-08 open |
| `seed` | POST | secret (required in prod) | creates tables only, no data (B-11) |

---

## 4. Issue backlog by workstream

### Workstream A — Admin panel
Owns: `src/app/admin/page.tsx`, `src/app/login/page.tsx`
Convention to follow (per CLAUDE.md): **PATCH/DELETE send `{ id }` in the JSON body; responses are the bare entity.**

| ID | Sev | Status | Owner | Fixed in | Issue |
|---|---|---|---|---|---|
| A-01 | P0 | ✅ | Claude | 6d1f665 | Every admin DELETE fails (500) |
| A-02 | P0 | ✅ | Claude | 6d1f665 | Create/edit/toggle crash the UI after saving |
| A-03 | P1 | ✅ | Claude | 2852416 | No error handling on initial load / login |
| A-04 | P2 | ✅ | Claude | b20bb86 (PR #2) | Local interfaces duplicate `types.ts` |
| A-05 | P2 | ✅ | Claude | b20bb86 (PR #2) | Optimistic UI removes rows even on failure |
| A-06 | P2 | ✅ | Claude | b20bb86 (PR #2) | "Recent" lists show oldest on Postgres |
| A-07 | P3 | ✅ | Claude | b20bb86 (PR #2) | `faqs.sort` mutates state in place |
| A-08 | P3 | ✅ | Claude | 45792b5 (PR #3) | 871-line monolith; split into per-entity components |

- **A-01** — `admin/page.tsx:97,108,125,142,159,176,193,210` send `fetch('/api/x?id=…', {method:'DELETE'})` with no body; every route does `await req.json()` → throws. **Fix:** send `body: JSON.stringify({ id })` + `Content-Type: application/json`. **Verify:** delete a package, reload, it stays gone.
- **A-02** — `admin/page.tsx:116,121,133,138,150,155,167,172,184,189,201,206` read `data.package`, `data.review`, `data.image`, `data.blog`, `data.faq`, `data.offer`; API returns entity at top level → `undefined` inserted into state → crash on next render. **Fix:** use `data` directly. **Verify:** create, edit, hide/show each entity with no crash.
- **A-03** — `admin/page.tsx:68,73-85` and `login/page.tsx:15` have no `try/catch`, no `res.ok` check, no `Array.isArray` guard; a 401 body crashes `.map`, network errors leave login stuck on "Logging in…".
- **A-04** — `admin/page.tsx:6-37` redefine all 8 entities. **Fix:** import from `src/lib/types.ts`.
- **A-05** — rows removed / state updated without checking `res.ok`. **Fix:** update state only on success, show an error toast otherwise.
- **A-06** — `slice(-5).reverse()` assumes oldest-first; Postgres returns newest-first. **Fix:** sort by `createdAt` desc then `slice(0,5)`.
- **A-07** — `admin/page.tsx:599` `faqs.sort(...)` mutates state. **Fix:** `[...faqs].sort(...)`.
- **A-08** — split forms (668-871) and CRUD triples (90-212) into components + a generic `useCrud(entity)` hook.
- **Depends on B-05:** once public GETs filter hidden items, admin must fetch with `?all=1` (see B-05).

### Workstream B — API, DB & auth
Owns: `src/lib/db.ts`, `src/lib/auth.ts`, `src/lib/db-schema.ts`, `src/lib/config.ts`, `src/app/api/**`

| ID | Sev | Status | Owner | Fixed in | Issue |
|---|---|---|---|---|---|
| B-01 | P0 | ✅ | Claude | 6d1f665 | Default admin credentials & JWT secret accepted in production |
| B-02 | P1 | ✅ | Claude | 2852416 | No login rate limit; plaintext, non-constant-time password compare |
| B-03 | P1 | ✅ | Claude | 2852416 | No try/catch or validation in any route |
| B-04 | P1 | ✅ | Claude | 2852416 | Public `/api/book` & `/api/enquiry` unvalidated, abusable |
| B-05 | P1 | ✅ | Claude | 2852416 | Hidden/inactive content served publicly |
| B-06 | P1 | ✅ | Claude | 2852416 | JSON backend: lost writes, wipes data on parse error, fails on serverless |
| B-07 | P2 | ✅ | Claude | b20bb86 (PR #2) | COALESCE updates can't clear a field; backends behave differently |
| B-08 | P2 | ✅ | Claude | b20bb86 (PR #2) | Session not revocable; `role` not checked; logout cookie flags differ |
| B-09 | P2 | ✅ | Claude | b20bb86 (PR #2) | No security headers / CSP; remote URLs not restricted to https |
| B-10 | P2 | ✅ | Claude | 2852416 | Client-supplied `id` on POST → PK collisions |
| B-11 | P3 | ✅ | Claude | 45792b5 (PR #3) | `/api/seed` weak default secret; creates tables but no seed data |
| B-12 | P3 | ✅ | Claude | b20bb86 (PR #2) | Unguarded `JSON.parse` on package array columns |

- **B-01** — `auth.ts:5` (`atlas-tours-default-secret`), `auth.ts:31-32` (`admin@atlastours.com`/`admin123`), `login/page.tsx:33` placeholder leaks email. Anyone can log in or forge a JWT if env vars are missing. **Fix:** throw at startup when `NODE_ENV==='production'` and `JWT_SECRET`/`ADMIN_PASSWORD`/`SEED_SECRET` unset; require ≥32-byte secret; remove email placeholder.
- **B-02** — `api/auth/login/route.ts:7` uses `!==`; `bcryptjs` installed but unused. **Fix:** `ADMIN_PASSWORD_HASH` + `bcrypt.compare`; rate-limit per IP.
- **B-03** — invalid JSON / wrong types / bad enum status → opaque 500. **Fix:** shared `withHandler()` wrapper (try/catch → 400/500 JSON) + zod schema per entity; validate `status` enums in `bookings`/`enquiries` PATCH.
- **B-04** — `api/book/route.ts:5-7`, `api/enquiry/route.ts:5-7` only check truthiness; client sets `amount`/`packageName`; extra keys stored in JSON mode (`db.ts:251,259`); no size limits/captcha/rate-limit. **Fix:** whitelist + length caps; look up price/name server-side from `packageId`; coerce `travelers` to int (default 1); accept `package` → `packageId` mapping; honeypot + rate limit.
- **B-05** — `db.ts:244,265,270,275` and public GETs return everything. **Fix:** public GET filters `hidden=false` / `active=true`; `?all=1` returns everything **only if** `verifySession()` passes. Coordinate with A (admin uses `?all=1`).
- **B-06** — `db.ts:190-228` sync read-modify-write, no lock/atomic rename; `readDB` catch (`db.ts:203-206`) reseeds on *any* error → data wipe. **Fix:** reseed only on `ENOENT`; write temp file + rename; refuse JSON mode in production.
- **B-07** — `db.ts:27,92,112,132,152,172` `COALESCE(${x ?? null}, col)`; `db.ts:22` `originalPrice || null` turns 0 into NULL; JSON `Object.assign` (`db.ts:223`) lets PATCH overwrite `id`/`createdAt`. **Fix:** build SET from keys present in body; whitelist fields on both backends.
- **B-08** — `auth.ts:12,22`, `api/auth/logout/route.ts:6`. **Fix:** check `role==='admin'`; `sameSite:'strict'`; match flags on logout; optional `tokenVersion`.
- **B-09** — `next.config.ts` has no `headers()`. **Fix:** CSP, `X-Frame-Options`, `Referrer-Policy`; accept only `https:` image URLs on write.
- **B-10** — `api/packages/route.ts:12` uses `body.id`. **Fix:** always generate server-side.
- **B-11** — `api/seed/route.ts:6`; fresh Postgres is empty. **Fix:** require secret in prod (or admin session); insert `DEFAULT_PACKAGES` etc. in `initDB`.
- **B-12** — `db.ts:18,30`. **Fix:** `safeParse` helper returning `[]`.
- Also: `getConfig()` (`db.ts:290`) unused; `SITE_CONFIG.email` disagrees with `Contact.tsx` (see C-09).

### Workstream C — Public component data contracts
Owns: `src/components/{Packages,Reviews,Blog,FAQ,Contact,Gallery}.tsx`
Rule: **delete local interfaces, import from `src/lib/types.ts`.** That alone fixes C-01…C-05.

| ID | Sev | Status | Owner | Fixed in | Issue |
|---|---|---|---|---|---|
| C-01 | P1 | ✅ | Claude | 2852416 | `_id` instead of `id` → undefined React keys |
| C-02 | P1 | ✅ | Claude | 2852416 | Package itinerary renders blank |
| C-03 | P0 | ✅ | Claude | 6d1f665 | Review text always blank |
| C-04 | P1 | ✅ | Claude | 2852416 | Blog "Read More" expands every card |
| C-05 | P2 | ✅ | Claude | 2852416 | Blog date never shows |
| C-06 | P2 | ✅ | Claude | b20bb86 (PR #2) | FAQ ignores Hindi fields; JSON backend ignores `order` |
| C-07 | P0 | ✅ | Claude | 6d1f665 | Contact form shows success on failure |
| C-08 | P1 | ✅ | Claude | 2852416 | Contact sends `package` (name) not `packageId`; `travelers` may be `""` |
| C-09 | P2 | ✅ | Claude (P4) | 5d45b93 (PR #4) — `SITE_CONFIG` single source; email **provisional** `info@atlastours.in` (see CLIENT_QUESTIONS.md) | Contact info / phone hardcoded in 5+ places, inconsistent |
| C-10 | P2 | ✅ | Claude | 90e876c (PR #9) | Package cards did not open the detail page: the image and title were not clickable, **View Details** opened an in-page popup and **Book Now** went to WhatsApp, so only the small "Full details" text link reached `/packages/[id]`. **Fixed:** image (mouse-only overlay link, `aria-hidden`), title, **View Details** → `/packages/[id]`; **Book Now** → `/packages/[id]#book` (booking form; `scrollMarginTop` clears the fixed header). Popup + its focus trap removed from `Packages.tsx`; i18n `closeDetailsAria`/`viewFullDetails` → `viewDetailsAria`/`bookNowAria`. Card look unchanged. e2e: `packages.spec.ts` "package cards open the detail page" |
| C-11 | P2 | ✅ | Claude | 90e876c (PR #9) | Booking and Contact forms accepted **past travel dates** (no `min` on the date input; server only checked the format). **Fixed:** `BookingForm`/`Contact` get a server-computed `minDate` (today, IST, same pattern as `/plan-trip`); `contactFields()` (book, enquiry, trip-request) rejects dates before `earliestTravelDate()` = yesterday IST (1 day slack for visitors behind IST) with 400 "travelDate cannot be in the past". Route/e2e tests moved off soon-to-expire fixed dates to 2099 |

- **C-01** — `Packages.tsx:7,341`, `Blog.tsx:7,181`, `FAQ.tsx:6,178`, `Reviews.tsx:6`, `Contact.tsx:6,36,313`.
- **C-02** — `Packages.tsx:16,430-435` expects `{day,title,description}`; data is `string[]`. **Fix:** render `itinerary.map((line, i) => …Day {i+1}: {line})`. Also drop non-existent `exclusions`/`slug`.
- **C-03** — `Reviews.tsx:11,215` reads `message`; field is `text`.
- **C-04** — `Blog.tsx:179,216` `expanded === blog._id` → `undefined === undefined`. Fixed by C-01.
- **C-05** — `Blog.tsx:13,194` reads `date`; field is `createdAt`. Format with `toLocaleDateString`.
- **C-06** — `FAQ.tsx:5-9` never uses `questionHi`/`answerHi` (wire to `useApp().lang`); sort by `order` client-side (or fix in `db.ts:280` — coordinate with B).
- **C-07** — `Contact.tsx:51-56` no `res.ok` check. **Fix:** show error state on non-2xx/network failure.
- **C-08** — `Contact.tsx:283,307,313`. **Fix:** send `packageId`; make `travelers` numeric with default 1.
- **C-09** — `Contact.tsx:11-13` (`info@atlastours.in` vs `config.ts:7`), `Header.tsx:251,316`, `Hero.tsx:290`, `Packages.tsx:385`, `WhatsApp.tsx:8`, `Footer.tsx:249`. **Fix:** read everything from `SITE_CONFIG`. (Touches Header/Hero/WhatsApp/Footer — do it in C before E starts.) Also Hero stats (500+/15+/10+) contradict Counter (50+) and data.

### Workstream D — Page shell, animation & performance
Owns: `src/app/page.tsx`, `src/app/globals.css`, `src/lib/context.tsx`, `Hero.tsx` (perf only), `Counter.tsx`

| ID | Sev | Status | Owner | Fixed in | Issue |
|---|---|---|---|---|---|
| D-01 | P0 | ✅ | Claude | 6d1f665 | Fetched cards stay at `opacity:0` forever |
| D-02 | P1 | ✅ | Claude | 2852416 | Whole page re-renders on every scroll event |
| D-03 | P1 | ✅ | Claude | 2852416 | No `prefers-reduced-motion` support |
| D-04 | P2 | ✅ | Claude | 2852416 + b20bb86 | `Math.random()` in render; effects without cleanup |
| D-05 | P2 | ✅ | Claude | b20bb86 (PR #2) | Dark-theme flash on load; `lang="hi"` set on English content |

- **D-01** — `page.tsx:28-36` observes `.reveal`/`.fade-in` once on mount; Packages (`:341`), Gallery (`:207`), Blog (`:181`), Reviews header (`:201`) mount after fetch and are never observed (`globals.css:130`). Likely introduced in `dd7e91d`. **Fix:** add a `MutationObserver` that observes new reveal elements, or a `useReveal()` hook per component. **Verify:** all packages/gallery/blog/reviews visible after scroll.
- **D-02** — `page.tsx:18-25` `scrollProgress` state in root; listener not passive/throttled. **Fix:** move progress bar into its own component, update via ref + `requestAnimationFrame`, `{passive:true}`.
- **D-03** — 0 matches for `prefers-reduced-motion`. **Fix:** global media block in `globals.css` disabling animations/transitions; pause hero video & typing.
- **D-04** — `Hero.tsx:266-267` random sizes re-rolled every 40-80 ms (memoize once); `Hero.tsx:43` nested timeout, `Counter.tsx:44-51` rAF, `Contact.tsx:58` timeout lack cleanup; add `AbortController` to fetches.
- **D-05** — `context.tsx:23-31`. **Fix:** inline pre-paint script in `layout.tsx` setting `data-theme` (coordinate with F); only set `lang="hi"` once content is translated (G-08).

### Workstream E — Dark mode & accessibility (start after C)
Owns: all `src/components/*` style/markup, `src/app/login/page.tsx` (after A)

| ID | Sev | Status | Owner | Fixed in | Issue |
|---|---|---|---|---|---|
| E-01 | P1 | ✅ | Claude | 2852416 | Contact inputs: near-black text on dark bg |
| E-02 | P2 | ✅ | Claude | b20bb86 (PR #2) | Hardcoded colors break dark mode |
| E-03 | P1 | ✅ | Claude | 2852416 | Gallery tiles not keyboard accessible |
| E-04 | P1 | ✅ | Claude | 2852416 | Modals lack dialog semantics, focus trap, Esc |
| E-05 | P1 | ✅ | Claude | 2852416 | Form labels not associated with inputs |
| E-06 | P2 | ✅ | Claude | b20bb86 (PR #2) | Off-canvas menu & WhatsApp popup focusable when hidden; no `aria-expanded` |
| E-07 | P2 | ✅ | Claude | 2852416 + b20bb86 | Icon-only buttons lack accessible names |
| E-08 | P2 | ✅ | Claude | b20bb86 (PR #2) | Reviews carousel auto-advance with no pause / `aria-live` |
| E-09 | P2 | ✅ | Claude | 2852416 | FAQ buttons lack `aria-expanded`/`aria-controls` |
| E-10 | P2 | ✅ | Claude (P4) | 5d45b93 (PR #4) — new text-only colour vars, dark text on orange buttons, stronger photo scrims; guarded by `tests/unit/contrast.test.ts` | Contrast failures |
| E-11 | P3 | ✅ | Claude | 45792b5 (PR #3) | No `:focus-visible` styles / skip link; login `outline:none` |
| E-12 | P3 | ✅ | Claude | b20bb86 (PR #2) | Star ratings & hero `<h1>` not meaningful to screen readers |

- **E-01** — `Contact.tsx:65-76` set `color: var(--text)`.
- **E-02** — `Packages.tsx:153,267,282`, `FAQ.tsx:63,68`, `Blog.tsx:160`; greys `#888/#aaa` in Packages/Blog/Contact/FAQ/Gallery; oranges should be `var(--orange)`.
- **E-03** — `Gallery.tsx:205-210` → use `<button>`.
- **E-04** — Packages modal (`:410`), Gallery lightbox (`:229`), admin modals (`admin/page.tsx:367`): `role="dialog"`, `aria-modal`, focus trap/return, Esc to close.
- **E-05** — `Contact.tsx:243-320`, `login/page.tsx:32-37`, admin forms `:686-863`, `WhatsApp.tsx:202`.
- **E-06** — `Header.tsx:288`, `WhatsApp.tsx:60-62` → `inert`/`visibility:hidden` when closed; hamburger `aria-expanded`.
- **E-07** — `Packages.tsx:410`, `Gallery.tsx:229,232,258`, `Reviews.tsx:223,230`, `WhatsApp.tsx:191,209` → `aria-label`.
- **E-08** — `Reviews.tsx:34-36` pause on hover/focus + pause button (WCAG 2.2.2).
- **E-09** — `FAQ.tsx:88`.
- **E-10** — `--text2 #7f8c8d` ≈3.5:1, orange `#e67e22` ≈2.9:1, `#aaa` ≈2.3:1, footer copyright.
- **E-11** — `login/page.tsx:33,37`; add global `:focus-visible` + skip link.
- **E-12** — `Reviews.tsx:52-57` add `aria-label="5 out of 5 stars"`; `Hero.tsx:275` `<h1>` is just "Discover".

### Workstream F — SEO, config, assets & tooling
Owns: `src/app/layout.tsx`, `next.config.ts`, `package.json`, `public/`, new `src/app/sitemap.ts`, `src/app/robots.ts`, `eslint.config.mjs`

| ID | Sev | Status | Owner | Fixed in | Issue |
|---|---|---|---|---|---|
| F-01 | P1 | ✅ | Claude | 2852416 | Upgrade Next.js 16.4.3 → ≥16.4.6 (advisory; build halts) |
| F-02 | P1 | ✅ | Claude | 5caafc2 | Core content not server-rendered (not crawlable) |
| F-03 | P1 | ✅ | Claude | 2852416 | Minimal metadata: no OG/Twitter/canonical/icons |
| F-04 | P1 | ✅ | Claude | 2852416 | No JSON-LD (TravelAgency, FAQPage, Product/Offer, Review) |
| F-05 | P1 | ✅ | Claude | 2852416 | Missing images: `hero-fallback.jpg`, `placeholder.jpg`, `package.jpg`; no favicon |
| F-06 | P2 | ✅ | Claude | 2852416 | No `sitemap.ts` / `robots.ts` |
| F-07 | P2 | ✅ | Claude | b20bb86 (PR #2) | Poppins loaded twice; full Font Awesome for one icon |
| F-08 | P2 | ✅ | Claude | b20bb86 (PR #2) | Lint broken — add `eslint.config.mjs` |
| F-09 | P3 | ✅ | Claude | 45792b5 (PR #3) | Remove dead deps (`tailwindcss`, `@tailwindcss/turbopack`), use or remove `bcryptjs` (see B-02) |
| F-10 | P3 | ✅ | Claude | 45792b5 (PR #3) | Remove ~15 empty route folders or implement (see G) |
| F-11 | P3 | ✅ | Claude | 90e876c (PR #9) | Seed image for "Sacred Odisha Pilgrimage" (`photo-1621427642877-68e20cf5f770`, `src/lib/config.ts`/`seed-data`, `data/db.json`) returns **404 from Unsplash** — the card shows a broken image. Found by the N-9 e2e run (optimiser log). Replace with a working photo (content choice). **Fixed:** replaced with free Unsplash photo `photo-1576235282476-debff2a4d0b9` (Konark Sun Temple, verified HTTP 200) in `config.ts` (→ `seed-data.ts`) and `data/db.json`. A live Postgres DB keeps the old URL (seed never updates rows) — change it in Admin → Packages → Edit |
| F-12 | P3 | ✅ | Claude | 90e876c (PR #9) | Seed image `photo-1561361513-2d000a50f0dc` used for **"Divine Varanasi & Prayagraj"**, gallery "Varanasi Ghats" and the site-wide OG image shows a **VW van on a beach**. Replaced with `photo-1561359313-0639aad49ca6` (Ganges ghats with boats, free Unsplash, HTTP 200) in `config.ts`, `seed-data.ts`, `seo.ts`, `data/db.json`. Postgres rows keep the old URL — update in the admin |

- **F-01** — `npm i next@16.4.6 eslint-config-next@16.4.6`, rebuild.
- **F-02** — fetch packages/reviews/faqs/blogs/gallery in a server component (`page.tsx` → server wrapper passing props to client sections). Coordinate with D (owns `page.tsx`) — do after D-01/D-02.
- **F-03** — `layout.tsx:5-9`: add `metadataBase`, `openGraph`, `twitter`, `alternates.canonical`, `icons`.
- **F-05** — `Hero.tsx:248`, `Packages.tsx:344,405`, `Blog.tsx:184`, admin default `package.jpg`; `public/images/destinations/` empty.
- **F-07** — `layout.tsx:17-18`, `Header.tsx:182` `@import`. Use `next/font/google`; drop Font Awesome or subset it.
- **F-10** — empty: `src/app/{callback,compare,customize,gallery,stories,track,wishlist,photo-credits,packages/[id],guides/[id]}`, `src/app/api/{payments/*,notifications,callback-slots,planning,tracking}`.

### Workstream G — Missing features (after A–D)

| ID | Sev | Status | Owner | Fixed in | Feature |
|---|---|---|---|---|---|
| G-01 | P2 | ✅ | Claude (P4) | 5d45b93 (PR #4) — `BookingForm.tsx` on package pages; per-person pricing **provisional** (Q-1) | Online booking form wired to `/api/book` (or delete the endpoint) |
| G-02 | P2 | ⏸ | client | needs provider + addresses (CLIENT_QUESTIONS.md) | Email/WhatsApp notification to owner on new enquiry/booking |
| G-03 | P2 | ✅ | Claude (P4) | 5d45b93 (PR #4) — `/packages/[id]` + metadata, TouristTrip JSON-LD, sitemap | Package detail pages `/packages/[id]` (SEO + shareable links) |
| G-04 | P2 | ⏸ | client | needs storage provider account (CLIENT_QUESTIONS.md) | Image upload in admin (e.g. Vercel Blob / Cloudinary) |
| G-05 | P2 | ✅ | Claude (P4) | 5d45b93 (PR #4) — `Offers.tsx`; expired offers hidden (IST, inclusive `validTo`) | Show active offers/coupons on public site |
| G-06 | P3 | ✅ | Claude (P4) | 5d45b93 (PR #4) — package category chips, gallery category tabs | Package category filter / search; gallery category tabs |
| G-07 | P3 | ✅ | Claude (P4) | 5d45b93 (PR #4) — `/blog/[id]` + BlogPosting JSON-LD, sitemap | Blog detail pages |
| G-08 | P3 | ⏸ | client | catalog done (`src/lib/i18n/`, 5d45b93 PR #4); needs 170 Hindi strings — `docs/hindi-strings-needed.md` | Full Hindi translation (message catalog instead of inline ternaries) |
| G-09 | P3 | ⏸ | client | needs Razorpay account + decision (CLIENT_QUESTIONS.md) | Payments (Razorpay) — `api/payments/*` folders are empty |
| G-10 | P3 | ✅ | Claude | 45792b5 (PR #3) | Test setup (Vitest + Playwright smoke test of home page & admin CRUD) |

### Workstream N — New features (proposed 2026-11-18)

Built with the user's go-ahead: commit `66ef8ef`, PR #6, merged into `dev` (`a508f04`). Visible changes need the client's review (CLIENT_QUESTIONS.md → N-4…N-9).

| ID | Sev | Status | Owner | Fixed in | Feature |
|---|---|---|---|---|---|
| N-1 | P2 | ✅ | Claude (N-round) | 66ef8ef (PR #6) — `admin/_lib/table.ts`; Bookings/Enquiries: search, status/type filters, IST received-date range, newest first, 25/page, CSV export of all filtered rows (BOM, RFC 4180, formula-injection guard), booking reference column, enquiry type + full message | Admin search, filters, pagination, CSV export for bookings and enquiries |
| N-2 | P3 | ⏸ | client | needs provider choice + account (CLIENT_QUESTIONS.md) | Website analytics (Vercel Analytics / Plausible) |
| N-3 | P3 | ⏸ | client | needs departure/seat model (CLIENT_QUESTIONS.md) | Departure dates and availability on packages; date picker in booking form |
| N-4 | P3 | ✅ | Claude (N-round) | 66ef8ef (PR #6) — `POST /api/booking-status` (reference + phone, same 404 for either mismatch, status fields only, 10 lookups/15 min/IP), `/track` page (noindex, `?ref=` prefill), "Track this booking" link after booking; `src/lib/booking-ref.ts` | Booking status page for customers |
| N-5 | P3 | ✅ | Claude (N-round) | 66ef8ef (PR #6) — `POST /api/review` saves `active:false, source:"customer"`; `/reviews/new` page; admin Reviews: Customer / Awaiting approval badges, Approve, filter chips; dashboard card; new column `reviews.source` | Customer-submitted reviews with admin approval |
| N-6 | P3 | ✅ | Claude (N-round) | 66ef8ef (PR #6) — `POST /api/trip-request` → Enquiry with `kind` "trip-plan"/"callback" and a labelled message (`src/lib/trip-request.ts`); `/plan-trip` page (`?mode=callback`); links from Contact + footer; new column `enquiries.kind` | Custom trip requests and callback slots |
| N-7 | P3 | ✅ | Claude (N-round) | 66ef8ef (PR #6) — localStorage store (`src/lib/wishlist*.ts`), heart + Compare toggles on cards and detail page, floating compare bar (bottom-left), `/wishlist`, `/compare?ids=` (max 3, noindex) | Wishlist and package comparison |
| N-8 | P3 | ⏸ | client | needs roles/permissions decision (CLIENT_QUESTIONS.md) | Multiple admin users with roles + audit trail |
| N-9 | P3 | ✅ | Claude (N-round) | 66ef8ef (PR #6) — `next/image` optimisation for local + `images.unsplash.com` only (`SmartImage`, `src/lib/images.ts`; other hosts stay unoptimised — no open proxy); public `<img>`s converted; hero video `preload="none"`, autoplays only ≥768px without Data Saver / 2g-3g / reduced motion, else poster + "Play video" | Image and video performance |
| N-10 | P3 | ⏸ | client | blocked on G-02 provider (CLIENT_QUESTIONS.md) | Booking confirmation to customers by email/WhatsApp |
| N-11 | P3 | ✅ | Claude | branch `admin-redesign`, PR #10 — admin + login visual redesign: sidebar nav (Inbox / Website content groups, waiting-item counts), light + dark theme via `--a-*` vars in `AdminStyles.tsx` (follows the site theme toggle; toggle in the sidebar), dashboard "Needs attention" cards that open the tab, tinted status selects, modal close button + Escape + focus, form labels wrap their inputs, split-layout login with show-password; icons in `_components/icons.tsx`. Data/API untouched. Developer-requested; owner sign-off on the look still pending | Admin panel redesign ("looked dated") |

---

## 5. What's already good (keep it this way)

- SQL is injection-safe: every query uses Neon tagged templates — no string concatenation.
- All admin mutations and booking/enquiry reads require a session (`requireAdmin()` / `verifySession()`).
- camelCase ↔ snake_case mappings match across `types.ts`, `db-schema.ts` and `pg*` functions for all 8 entities.
- The only `dangerouslySetInnerHTML` is JSON-LD in `layout.tsx` / `page.tsx`, always through `jsonLdString()` which escapes `<`. Keep it that way. All content images have alt text.
- One shared API layer: every route goes through `withHandler()`; content routes are `crudRoute()` configs; public visibility rules live only in `src/lib/visibility.ts` (used by both API and page).
- Public content is server-rendered (`page.tsx` → props); components don't fetch on mount.
- Production auth fails closed when secrets are missing.
- Responsive breakpoints present in every section; mobile drawer menu works.
- `data/db.json` contains only seed content (no real customer data) — keep it that way; restore it (`git checkout -- data/db.json`) after manual testing.

---

## 6. Recommended order (what's next)

Done: ~~Day 1: D-01 · A-01 · A-02 · C-01…C-05 · C-07 · B-01~~ · ~~Day 2: B-03 · B-04 · B-05 · C-08 · B-06 · F-01 · F-05 · E-01~~ · ~~Day 3: B-02 · D-02 · D-03 · F-02 · F-03 · F-04 · F-06~~

1. **Before launch (no code):** the "Pending verification / decisions" table in §2 — browser pass, booking-price decision, domain, production env vars, Postgres content.
2. **Next sprint, parallel (P2, no visual change):**
   - B: B-07 (COALESCE clearing) · B-08 (session role/strict cookie) · B-09 (security headers/CSP, https-only image URLs) · B-11 (seed content) · B-12 (safe JSON.parse)
   - A: A-04 (import shared types) · A-06 (recent-items ordering) · A-07
   - C: C-06 (FAQ Hindi) · C-09 (single source for phone/email — note Contact email ≠ `SITE_CONFIG.email`, needs client confirmation)
   - E: E-06 · E-07 (rest: Reviews arrows) · E-08 · E-11 · E-12 — then E-02/E-10 (**visual — needs design approval**)
   - F: F-07 (fonts/icons) · F-08 (ESLint config) · F-09 (remove Tailwind) · F-10 (empty folders)
   - D: D-04 rest (Counter rAF, Contact timeout) · D-05 (theme flash)
3. **Then features (G):** G-01 booking form · G-02 notifications · G-03 package pages · G-04 image upload · G-05 offers · G-10 tests first if possible.

---

## 7. Changelog

| Date | Who | Change |
|---|---|---|
| 2026-11-17 | Claude (audit) | Initial audit of `dd7e91d`; 66 items logged across 7 workstreams |
| 2026-11-17 | Claude (4 parallel subagents) | **All 6 P0s fixed (commit 6d1f665), no UI/design changes.** D-01: MutationObserver observes late-mounted reveal elements (`page.tsx`). A-01/A-02: admin DELETE sends `{id}` in body; create/save use the bare entity; state changes only on `res.ok` (`admin/page.tsx`). B-01: secrets resolved lazily, fail closed in production, constant-time `verifyAdminCredentials` used by login route (also closes the timing half of B-02), seed returns 503 without `SEED_SECRET` (`auth.ts`, `api/auth/login/route.ts`, `api/seed/route.ts`). C-03: Reviews uses shared `Review` type and `text`. C-07: Contact checks `res.ok`, shows an error, keeps form data. Verified: `tsc` ✅, admin POST/PATCH/DELETE + login via curl ✅, prod fail-closed via `next start` ✅. **Not yet browser-verified:** D-01. **Follow-ups:** login placeholder still shows default email (deferred, UI); Contact error reuses green success style (needs design OK); DELETE returns 200 `{success:false}` for unknown id (fold into B-03). |
| 2026-11-17 | Claude (6 parallel subagents) | **P1 round — 21 of 22 P1s fixed, plus B-10, C-05, E-09, F-06 and parts of D-04/E-07. No UI redesign.** Only **F-02 (server rendering) remains** — deferred because it touches `page.tsx` + every component. **Backend:** new `src/lib/api.ts` (`withHandler`, `readJson`, validators), `crud-route.ts` (shared GET/POST/PATCH/DELETE for 6 content entities), `public-form.ts`, `rate-limit.ts` (in-memory, per instance). 400/401/404/429 now return `{error}`; unknown id → 404; ids server-generated; public GETs hide hidden/inactive unless admin `?all=1`; `/api/book` prices server-side (**amount = price × travelers — confirm prices are per person**); honeypot `website`; rate limits 5/min on public forms, 5 failures/15 min on login; optional `ADMIN_PASSWORD_HASH` (bcrypt); JSON backend atomic writes, reseeds only on ENOENT. **Admin:** load errors handled, 401 → /login, uses `?all=1`; login try/catch. **Components:** shared types everywhere (`_id` gone), itinerary renders, Read More per card, blog dates, contact sends `packageId` + numeric travelers + honeypot, dark-mode input text, labels/aria, modal/lightbox dialog semantics + focus trap + Esc, gallery keyboard access (Space opens on key-up). **Perf/motion:** `ScrollProgress.tsx` (no per-scroll re-render), passive listeners, `prefers-reduced-motion` block + Hero respects it, Hero dots stable. **SEO/config:** Next 16.4.6 (prod audit clean), OG/Twitter/canonical, TravelAgency JSON-LD, robots/sitemap, favicon, missing images added. Verified: `tsc` ✅, `npm run build` ✅, admin form payloads round-trip ✅, public GET filtering ✅. **Not browser-verified:** modals/focus trap, reduced motion, reveal animation. **Follow-ups:** set `NEXT_PUBLIC_SITE_URL` (fallback `https://atlastours.in`); CLAUDE.md now stale re login/`/api/book`/`ADMIN_PASSWORD_HASH`; contact input text is `--text` (#2c3e50) instead of browser black in light mode. |
| 2026-11-17 | Claude (1 subagent) | **F-02 done — all P0 and P1 items now closed.** `page.tsx` is an async server component (`force-dynamic`) loading packages/gallery/reviews/blogs/FAQs from `db.ts` in parallel and passing them as `initial*` props; components no longer fetch on mount. Public visibility rules moved to `src/lib/visibility.ts`, shared by API routes and the page. Reveal/MutationObserver logic moved to `src/components/RevealObserver.tsx`. FAQPage JSON-LD added (`seo.ts`). Hydration-safe formatting: prices fixed to `en-IN` grouping, blog dates formatted in IST with fixed month names. Verified: `tsc` ✅, build ✅ (`/` dynamic), server HTML contains package names/prices/reviews/blogs/FAQs + FAQPage JSON-LD and no "Loading" ✅, hidden package absent from HTML ✅, headless Chrome: no hydration warnings, 18/18 reveal elements visible after scroll ✅. Follow-up: CLAUDE.md still says components fetch client-side. |
| 2026-11-17 | Claude | **Docs refresh.** CLAUDE.md rewritten for the current architecture (server-rendered page, `api.ts`/`crud-route.ts`/`visibility.ts`, fail-closed prod auth, new env vars `ADMIN_PASSWORD_HASH` and `NEXT_PUBLIC_SITE_URL`, rate limits, public-form rules, "no visual changes" constraint, pointer to this file). This file: header shows current rating 7/10; §1 totals by severity; §2 split into current snapshot / pending decisions / scores at-audit vs now; §3 feature inventory updated with "Was" column; §5 and §6 updated; P1 rows now reference commit `2852416`. |
| 2026-11-17 | Claude (5 parallel subagents + review), branch `p2-fixes` | **P2 round: 19 of 26 P2s done (incl. D-04, E-07 completed), plus P3s A-07, B-12, E-12. The other 7 P2s are ⏸ blocked on client decisions** (C-09 email, E-10 colours, G-01…G-05 features). No visual redesign. **Backend:** B-07 PATCH touches only present keys; `nullable()` fields clear with `null`/`""`; Postgres `pgUpdate` from fixed column maps via `sql.query` (COALESCE removed; Postgres path reviewed, not executed); B-08 JWT issuer/audience/role/`SESSION_VERSION`, `sameSite: strict`, logout clears with matching flags; B-09 `"image"` field type (https or `/path` only); B-12 `safeParseArray`. **Config:** security headers + report-only CSP (`next.config.ts`); Poppins via `next/font` (300–900), Font Awesome and Google Fonts CDNs removed (login lock is inline SVG); `eslint.config.mjs` (lint: 0 errors, 3 intentional `<img>` warnings); pre-paint theme script; `<html lang>` stays `en`. **Admin:** shared types + status narrowing, newest-first recent lists, non-mutating FAQ sort, edits send `null` to clear. **Components:** inert closed menu/WhatsApp popup + aria-expanded + Esc; carousel pauses on hover/focus and under reduced motion, live region, star labels; Counter rAF cleanup; dark-mode overrides with light mode unchanged (colour table in agent report); FAQ shows Hindi when selected; Contact timer cleanup. Lint errors fixed by Claude: admin `<a href="/">` → `<Link>`, unused vars removed, Hero mount-only setState documented. Verified: `tsc` ✅, `lint` ✅, `build` ✅, curl on a temp dev server: strict cookie, headers, null-clearing, bad image URL → 400, FAQ create/clear/delete, enquiry, HTML has content + no CDN fonts ✅. **Not browser-verified:** inert menus, carousel pause, dark-mode colours, login lock icon. Note: the user's dev server on :3000 stopped during this round (not stopped by Claude). |
| 2026-11-18 | Claude (4 parallel subagents + review), branch `p3-fixes` | **P3 round: every item not blocked on a client decision is now done (55/66; 11 ⏸ blocked, 0 open).** A-08: admin page 895 → 121 lines; `_lib/api.ts`, `_lib/crud.ts` (`entityCrud`, `useEntityTab`), `_components/*Tab.tsx`, `forms/*`, `AdminStyles`, `Dashboard` — CSS and form bodies byte-identical to before. B-11: `/api/seed` creates tables **and** inserts default content idempotently (`ON CONFLICT (id) DO NOTHING`), `content:false` flag; new `src/lib/seed-data.ts` shared with the JSON auto-seed (old JSON auto-seed had drifted from `data/db.json` — fixed); `JSON_DB_PATH` env var. E-11: keyboard-only `:focus-visible` ring, skip link + `<main id="main-content">`, login and WhatsApp inputs no longer hide focus (Claude fixed WhatsApp). F-09: Tailwind removed. F-10: 18 empty route folders removed. G-10: Vitest 4.1.12 (88 tests: validators, visibility, rate limit, safeEqual, packages + enquiry routes on a temp DB) and Playwright 1.65.1 (3 smoke tests + 2 admin e2e tests added by Claude: FAQ create/edit-clear/deactivate/delete with reloads, and hide-package-removes-from-home). G-06…G-09 marked ⏸ (need client decisions). Verified: `tsc` ✅, `lint` 0 errors ✅, `npm test` 88/88 ✅, `npm run test:e2e` 5/5 ✅, `build` ✅, `data/db.json` untouched ✅. CLAUDE.md updated (test commands, `JSON_DB_PATH`, seed, admin layout, focus rules). Postgres seed path reviewed, not executed. |
| 2026-11-18 | Claude | **Merged PRs #1, #2, #3 into new branch `dev`** (created from `master` @ `dd7e91d`; merge commits `f9a17c4`, `899fc03`, `e2bf268`; merge commits, not squash, so all recorded hashes remain valid; `dev` tree verified identical to `p3-fixes`; `master` untouched; feature branches kept). Status review: **55/66 done, 11 ⏸ blocked on client decisions, 0 open.** §1 now records merge status; §2 snapshot moved to `dev` and the pending table split into Verify (V-1…V-4) and Decide (Q-1…Q-7) items, adding Q-5 (expired seed offers), Q-6 (carousel pause button) and Q-7 (contradictory hero stats). |
| 2026-11-18 | Claude (5 parallel subagents in 2 waves + lead integration), branch `p4-fixes`, commit `5d45b93`, PR #4 | **P4 round: 7 of the 11 blocked items built with the user's go-ahead; 62/66 done, 4 ⏸ (G-02, G-04, G-08 Hindi copy, G-09).** Open client questions moved to new `CLIENT_QUESTIONS.md`. **C-09:** every component reads phone/email/WhatsApp/address from `SITE_CONFIG` (+ `PHONE_DISPLAY`); email provisionally `info@atlastours.in` (also in `data/db.json` config); guard test `tests/unit/site-config.test.ts`. **G-03:** `/packages/[id]` (server, 404 for hidden/unknown, metadata, TouristTrip JSON-LD, sticky booking aside); helpers in `src/app/packages/package-utils.ts`. **G-01:** `BookingForm.tsx` → `/api/book` (estimate price × travelers, red error style, 429 handling; no message field because `/api/book` has none — uses `city`). **G-06:** package category chips (`category` field) + gallery category tabs; lightbox navigates the filtered set. **G-05:** `Offers.tsx` after Packages, rendered only when an offer is visible; `isPublicOffer` now also hides offers whose `validTo` (inclusive, IST) has passed — seed offers are expired so the section is hidden by default. **G-07:** `/blog/[id]` (plain-text paragraphs, BlogPosting JSON-LD, metadata). Sitemap lists package and blog pages. Header/Footer section links become `/#x` off the home page (`usePathname`); both detail pages reuse the home chrome. **E-10:** new vars `--orange-text`, `--gold-text`, `--on-accent`, `--success-text`, `--error-text`, `--input-border`; `--text2` light `#657071`, dark `--primary` `#73a0df`; **text on orange/gold fills is now dark navy instead of white** (white failed at 2.2–2.9:1); stronger scrims on hero/package hero/gallery captions; `tests/unit/contrast.test.ts` (69 pairs) guards AA. Left: focus ring 2.85:1 on white, WhatsApp brand green, decorative icons. **G-08:** typed catalog `src/lib/i18n/` (`en.ts` 179 keys, `hi.ts` partial with the 9 existing Hindi strings, `useT()` hook, `translate`/`getT` for server); English output unchanged; `docs/hindi-strings-needed.md` lists 170 strings for the client. Verified: `tsc` ✅, `lint` 0 errors ✅, `npm test` 217/217 ✅, `build` ✅, Playwright 13/13 ✅ (run against `next start` on :3150 with temp DB because the user's dev server occupied the project; one e2e selector fixed by Claude). **Not browser-verified by a person:** new pages, dark mode of new UI, offers section with live data, button text colour change. |
| 2026-11-18 | Claude | **Pending-status review.** Synced §1/§2 with the P4 round: merge-status note now says PR #4 is open (P4 items exist only on `p4-fixes`); §2 snapshot moved to `p4-fixes` with P4's recorded checks; pointer to `CLIENT_QUESTIONS.md`; V-2 extended with the new P4 UI; Q-1 marked provisional-and-built; Q-5 updated (expired offers now auto-hidden); added Q-8 (sign-off for the dark-navy button text from E-10). Fixed a malformed separator row in the §1 Progress table (introduced 2026-11-18 by the scores-column edit). Status unchanged: 62/66 done, 4 ⏸. |
| 2026-11-18 | Claude | **Merged PR #4 into `dev`** (merge commit `3ebe2e9`, merge commit not squash; all 3 Vercel checks passed beforehand; `dev` tree verified identical to `p4-fixes`; `master` untouched at `dd7e91d`). Header, §1 merge status and §2 snapshot now point at `dev`. Status unchanged: 62/66 done, 4 ⏸ (G-02, G-04, G-08 Hindi copy, G-09). |
| 2026-11-18 | Claude, branch `q-fixes` | **Q-4, Q-5, Q-6 done (user decisions).** Q-4: login email placeholder → `you@example.com`. Q-6: visible pause/play button in the reviews carousel (inline SVG, existing arrow style, i18n keys `reviews.pauseAria`/`reviews.playAria`, hidden under reduced motion). The new e2e test caught a real bug: after a mouse click, focus stayed on the button and the focus-pause kept the carousel stopped, so play did nothing — fixed by counting only keyboard (`:focus-visible`) focus and clearing the focus pause when play is pressed. Q-5 (user chose "remove the samples"): `SEED_OFFERS` is now empty and `data/db.json` has no offers; the Offers section shows only once the owner adds a real offer. `docs/hindi-strings-needed.md` regenerated (172 of 181 untranslated). Verified: `tsc` ✅, `lint` 0 errors ✅, `npm test` 217/217 ✅, `build` ✅, Playwright 16/16 ✅ (new `tests/e2e/reviews.spec.ts`: rotation, pause/play, reduced motion, placeholder) — run against `next start` because the user's dev server held the dev lock. Remaining Q items: Q-1, Q-2, Q-3, Q-7, Q-8. |
| 2026-11-18 | Claude | **Merged PR #5 (`q-fixes`) into `dev`** (merge commit `ba4cd92`; 3 Vercel checks passed; `dev` tree verified identical to `q-fixes`; `master` untouched). Q-4/Q-5/Q-6 rows now reference `de31c8f`. |
| 2026-11-18 | Claude (lead + 3 parallel subagents), branch `n-features` in worktree `../atlas-tours-n-features`, commit `66ef8ef`, PR #6 | **N-round: new Workstream N (10 proposed features) logged; 6 built (N-1, N-4, N-5, N-6, N-7, N-9), 4 ⏸ on client decisions (N-2 analytics provider, N-3 departure/seat model, N-8 roles, N-10 after G-02).** Worked in a separate git worktree because another session had uncommitted Q-fixes in the main folder. **Backend (lead):** `Enquiry.kind`, `Review.source` (+ `ALTER TABLE … ADD COLUMN IF NOT EXISTS` in `db-schema.ts`; Postgres path not executed — extends V-1), `findBookingsByIdPrefix`, public routes `/api/booking-status`, `/api/review`, `/api/trip-request`, sitemap lists `/plan-trip` and `/reviews/new`, footer links. **Admin (agent):** N-1 + review moderation. **Public pages (agent):** `/track`, `/reviews/new`, `/plan-trip`, `FormPageShell`, entry links in Reviews/Contact/BookingForm; i18n sections `track`, `reviewForm`, `tripRequest`. **N-7/N-9 (agent):** wishlist/compare, SmartImage, hero video gating. Lead fixed a wishlist e2e race with `admin.spec.ts` (which hides the Rajasthan package). Found F-11 (broken seed image). Verified: `tsc` ✅, `lint` 0 errors ✅, `npm test` 294/294 ✅, `npm run build` ✅, `npm run test:e2e` 25/25 ✅. **Not browser-verified by a person:** all new UI, dark mode of new pages, mobile layout, hero on slow connections/Safari, CSV in Excel. Hindi doc regenerated (new strings untranslated, G-08). |
| 2026-11-18 | Claude | **Merged `dev` (PR #5) into `n-features` to resolve PR #6 conflicts.** Conflicts: `en.ts` (kept both `reviews.pauseAria`/`playAria` and `reviews.writeReview`), `docs/hindi-strings-needed.md` (regenerated), this file (header now lists PRs #1–#5 merged + PR #6). `Reviews.tsx`, `CLAUDE.md`, `CLIENT_QUESTIONS.md` merged cleanly. Re-verified after the merge (see PR #6). |
| 2026-11-18 | Claude | **Merged PR #6 (`n-features`) into `dev`** (merge commit `a508f04`, merge commit not squash; after merging `dev`/PR #5 into the branch: `tsc` ✅, lint 0 errors ✅, `npm test` 294/294 ✅, `build` ✅, `test:e2e` 28/28 ✅ incl. PR #5's reviews spec; 3 Vercel checks passed; `dev` tree verified identical to `n-features`; `master` untouched). Status: 68/77 done, 8 ⏸, 1 open (F-11). |
| 2026-11-18 | Claude, branch `fix-scroll-behavior` | **Fixed Next.js dev warning** "Detected `scroll-behavior: smooth` on the `<html>` element": added `data-scroll-behavior="smooth"` to `<html>` in `layout.tsx` (with a pairing note in `globals.css`), so Next disables smooth scrolling during route transitions while home-page hash links stay smooth. Verified on the running dev server with a headless route transition (`/` → `/packages/pkg-varanasi` → back): 0 scroll-behavior messages; `tsc` ✅, `lint` 0 errors ✅, `npm test` 294/294 ✅. **Found, not fixed (content):** the Unsplash photo for "Sacred Odisha Pilgrimage" (`photo-1621427642877-68e20cf5f770`, in `src/lib/config.ts` and `data/db.json`) returns 404 at Unsplash — dead since the initial commit; needs a replacement image chosen by the owner. |
| 2026-11-18 | Claude | **Merged PR #7 (`fix-scroll-behavior`) into `dev`** (merge commit `010334a`; 3 Vercel checks passed; `dev` tree verified identical to the branch; `master` untouched). Tracker sync: header and §1 merge status now cover PRs #1–#7; §2 snapshot at `010334a`; V-2 extended with the N-round pages (PR #6); the "Odisha photo 404" noted in the PR #7 entry is the existing **F-11** (not a new item) and is now also asked in `CLIENT_QUESTIONS.md`. Status: 68/77 done, 8 ⏸, 1 open (F-11). |
| 2026-11-18 | Claude, branch `fix-f11-odisha-photo`, PR #9 | **F-11 done.** "Sacred Odisha Pilgrimage" seed image (`photo-1621427642877-68e20cf5f770`, Unsplash 404) replaced with `photo-1576235282476-debff2a4d0b9` (free Unsplash photo of Konark Sun Temple, landscape, HTTP 200) in `src/lib/config.ts` (feeds `seed-data.ts`) and `data/db.json`. `/api/seed` never updates existing Postgres rows; if production already has the old URL, change it in the admin. Status: 69/77 done, 8 ⏸, 0 open. |
| 2026-11-18 | Claude, branch `fix-f11-odisha-photo`, PR #9 | **C-10, C-11, F-12 done (found while checking the package → detail page flow).** C-10: every part of a package card (image, title, View Details, Book Now → `#book`) now opens `/packages/[id]`; popup removed. C-11: past travel dates blocked in the Booking/Contact forms (`min`) and rejected by the server (`earliestTravelDate`). F-12: Varanasi "van" photo replaced everywhere. Detail page reviewed at 1366px and 390px: hero, overview, highlights, itinerary, inclusions, booking form + WhatsApp all render, no broken images, no horizontal scroll, no console errors. Checks: `tsc` ✅, lint 0 errors ✅, `npm test` 297/297 ✅, `build` ✅, `test:e2e` against `next start`: 27/29 in parallel — 1 failure was a stale date in `public-forms.spec.ts` (fixed), 1 was the `reviews.spec.ts` carousel racing `admin-lists.spec.ts` (which adds a review to the shared DB) — the packages/forms/reviews specs then passed 15/15 serially. Status: 72/80 done, 8 ⏸, 0 open. |
| 2026-11-18 | Claude, branch `admin-redesign`, PR #10 | **N-11 admin redesign (visual + small UX).** Files: `src/app/admin/**`, `src/app/login/page.tsx`, `tests/e2e/admin.spec.ts` (button now "Add FAQ"). "Del" buttons renamed "Delete" (tests match by substring). Verified: `tsc` ✅, lint ✅ (3 existing `<img>` warnings), `npm test` 297/297 ✅, e2e against `next start` 28/29 — the failure is `reviews.spec.ts` carousel count ("1 of 4") racing the parallel admin-lists approval test on the shared temp DB; passes 3/3 alone. Screenshots checked at 1440px and 390px (no horizontal scroll). |
| 2026-11-18 | Claude, branch `admin-redesign`, PR #10 | **N-11 follow-up: full admin audit.** Scripted browser pass over every admin flow against `next start` with a scratch DB (login error/show-password, dashboard cards + counts, bookings search/status/payment/CSV/delete, enquiries view/status, review approval, create → edit → toggle → delete in all 6 content tabs, modals, keyboard, logout), screenshots in light/dark at 1440, 768 and 390px. **Fixed:** (1) empty required fields now block Save with the browser message (forms are real `<form>`s, `required` on starred fields, Enter saves); (2) modal keeps Tab inside, locks page scroll, is named by its heading, and Escape/backdrop ask "Discard your unsaved changes?" once something was typed (✕/Cancel close directly); (3) a 401 on any admin action now says the session expired and goes to `/login` instead of a bare "Unauthorized" alert; (4) network failures on save/delete now alert instead of failing silently; (5) on phones, bookings/enquiries/dashboard tables become one card per row (`.adm-table.stack` + `data-label`); names and action buttons no longer wrap mid-word on desktop. Also made `tests/e2e/reviews.spec.ts` match "N of <any>" — it raced `admin-lists.spec.ts` approving a 4th review. Verified: `tsc` ✅, lint ✅ (3 existing `<img>` warnings), `npm test` 297/297 ✅, e2e 29/29 ✅ twice. |
