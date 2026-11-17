# Atlas Tours — Project Audit & Fix Tracker

> **Single source of truth** for project status and the fix backlog.
> Audit date: **2026-11-17** · Audited commit: `dd7e91d` · Rating at audit: **4.5 / 10**
> Last updated: **2026-11-17** · Branches: `audit-fixes` (PR #1, P0+P1) → `p2-fixes` (P2) · Current rating: **7.5 / 10** · **49 / 66 done · 7 blocked on client decisions · 10 open (all P3)**

---

## How to use this file

1. **Pick a workstream** (§4). Workstreams are split by **file ownership** so they can run in parallel without merge conflicts. Respect the `Depends on` notes.
2. **Before starting an issue**, set its status to `🔄 In progress` and put your name/agent/branch in `Owner`.
3. **When done**, set `✅ Done`, fill `Fixed in` (commit hash / PR), and tick the matching row in the Progress table (§1).
4. **New issue found?** Add it to the right workstream with the next free ID (e.g. `C-12`). Never reuse or renumber IDs.
5. **Rescoring:** after a workstream completes, update the scores in §2 and add a line to the Changelog (§7).
6. Verify every fix with `npx tsc --noEmit` and a manual check in `npm run dev` (there is no test runner yet).

Status legend: `⬜ Todo` · `🔄 In progress` · `✅ Done` · `⏸ Blocked` · `🚫 Won't fix`
Severity: **P0** launch blocker · **P1** must fix before launch · **P2** should fix · **P3** nice to have

---

## 1. Progress

| Workstream | Owns files | Issues | Done | Status |
|---|---|---|---|---|
| A — Admin panel | `src/app/admin/page.tsx`, `src/app/login/page.tsx` | 8 | 7 | 🔄 A-08 open |
| B — API, DB & auth | `src/lib/*` (db, auth, api, crud-route, …), `src/app/api/**` | 12 | 11 | 🔄 B-11 open |
| C — Public data contracts | `Packages.tsx`, `Reviews.tsx`, `Blog.tsx`, `FAQ.tsx`, `Contact.tsx`, `Gallery.tsx` | 9 | 8 | ⏸ C-09 blocked |
| D — Page shell & animation | `src/app/page.tsx`, `src/app/globals.css`, `src/lib/context.tsx` | 5 | 5 | ✅ |
| E — Dark mode & accessibility | all `src/components/*` | 12 | 10 | 🔄 E-11 open · E-10 blocked |
| F — SEO, config, assets, tooling | `layout.tsx`, `next.config.ts`, `package.json`, `public/`, `eslint.config.mjs` | 10 | 8 | 🔄 F-09, F-10 open |
| G — Missing features | new files | 10 | 0 | ⏸ G-01…G-05 blocked · G-06…G-10 open |
| **Total** | | **66** | **49** | 7 blocked · 10 open |

**By severity:** P0 ✅ 6/6 · P1 ✅ 21/21 · P2 ✅ 19/26 (7 ⏸ blocked on client decisions) · P3 3/13.

**Blocked on the client (⏸):** C-09 (which email is correct), E-10 (contrast fixes change colours), G-01…G-05 (new UI or a service choice: booking form, notifications provider, package pages, image upload provider, offers display).

**Parallel plan for what's left:** workstreams are still split by file ownership. Note that since F-02, `src/app/page.tsx` is a server component and every section component takes its data as props — any agent touching a section component must keep that contract (see CLAUDE.md → Frontend). A (admin), B (API/DB), E (component a11y/dark mode), F (tooling) and G (new features) can run in parallel if agents stay inside their file lists.

---

## 2. Where the project stands

### Current (2026-11-17, branch `audit-fixes`)

- **Stack:** Next.js **16.4.6** App Router, React 19.3, TypeScript strict, Neon Postgres or JSON-file storage (`DATABASE_URL` switches).
- **Size:** ~7,500 tracked lines (excl. lockfile/public). Commits on branch: `6d1f665` (P0), `2852416` (P1), plus F-02 + docs (see changelog for commit status).
- **Type check:** `npx tsc --noEmit` ✅. **Build:** `npm run build` ✅ (no advisory halt; `/` is dynamic, robots/sitemap/icons static).
- **`npm audit --omit=dev`:** 0 vulnerabilities. Dev deps still report some (untriaged).
- **Tests:** none (G-10). **Lint:** still broken (F-08).
- **Verdict:** **launchable after configuration** — set `JWT_SECRET` (≥32 chars), `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH` (or `ADMIN_PASSWORD`), `DATABASE_URL`, `SEED_SECRET`, `NEXT_PUBLIC_SITE_URL`, and do a manual browser pass (see "Pending verification" below). Remaining items are quality/polish (P2/P3) and new features.

### Pending verification / decisions (owner: project lead)

| Item | Why it matters |
|---|---|
| Browser pass: modal/lightbox focus trap & Esc, gallery keyboard (Enter/Space), reduced-motion mode, dark-mode contact form, admin create/edit/delete/hide | Verified by code review, curl and a headless run, not by a person clicking through |
| `/api/book` pricing: `amount = price × travelers` | Correct only if package prices are **per person**; if per package, change to `price` |
| Production domain for `NEXT_PUBLIC_SITE_URL` | Canonical/OG/sitemap fall back to `https://atlastours.in` (unconfirmed) |
| Contact form error message reuses the green success style | Red error style needs design approval (client asked for no UI changes) |
| Login placeholder shows `admin@atlastours.com` | Leaks the dev default email; a visible text change, so deferred |
| First Postgres deploy shows an empty site | `/api/seed` creates tables only (B-11) — content must be entered via admin or a seed script |

### Scores

| Area | At audit | After P1 | After P2 | Reason (after P2) |
|---|---|---|---|---|
| Architecture | 7 | 8 | **8** | Server-rendered page, shared API layer (`withHandler`, `crudRoute`), whitelisted column maps, single visibility module |
| UX / visual design | 6 | 7 | **7.5** | Design untouched; dark mode fixed in sections (E-02); no theme flash (D-05); fonts self-hosted |
| Correctness | 3 | 7 | **8** | Optional fields clear correctly (B-07), dashboard ordering (A-06), admin uses shared types (A-04); Postgres update path reviewed but not run |
| Security | 3 | 7 | **8** | + security headers, report-only CSP, strict session cookie with issuer/audience/role/version checks, https-only image URLs; open: CSP not enforcing yet, in-memory rate limits |
| Accessibility | 3 | 6 | **7** | + inert closed menus, carousel pause, star labels, aria on icon buttons; open: contrast (E-10, blocked), focus-visible/skip link (E-11) |
| Performance | 4 | 6 | **6.5** | + self-hosted fonts, Font Awesome CDN removed; open: autoplay hero video |
| SEO | 2 | 7 | **7** | Content in HTML, OG/Twitter/canonical, TravelAgency + FAQPage JSON-LD, robots, sitemap, favicon; open: single URL, no detail pages (G-03) |
| Maintainability | 4 | 6 | **7** | Lint works (0 errors), shared types everywhere; open: 900-line admin page (A-08), no tests (G-10) |
| **Overall** | **4.5** | **7** | **7.5** | |

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
| A-04 | P2 | ✅ | Claude | p2-fixes (uncommitted) | Local interfaces duplicate `types.ts` |
| A-05 | P2 | ✅ | Claude | p2-fixes (uncommitted) | Optimistic UI removes rows even on failure |
| A-06 | P2 | ✅ | Claude | p2-fixes (uncommitted) | "Recent" lists show oldest on Postgres |
| A-07 | P3 | ✅ | Claude | p2-fixes (uncommitted) | `faqs.sort` mutates state in place |
| A-08 | P3 | ⬜ | | | 871-line monolith; split into per-entity components |

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
| B-07 | P2 | ✅ | Claude | p2-fixes (uncommitted) | COALESCE updates can't clear a field; backends behave differently |
| B-08 | P2 | ✅ | Claude | p2-fixes (uncommitted) | Session not revocable; `role` not checked; logout cookie flags differ |
| B-09 | P2 | ✅ | Claude | p2-fixes (uncommitted) | No security headers / CSP; remote URLs not restricted to https |
| B-10 | P2 | ✅ | Claude | 2852416 | Client-supplied `id` on POST → PK collisions |
| B-11 | P3 | ⬜ | | | `/api/seed` weak default secret; creates tables but no seed data |
| B-12 | P3 | ✅ | Claude | p2-fixes (uncommitted) | Unguarded `JSON.parse` on package array columns |

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
| C-06 | P2 | ✅ | Claude | p2-fixes (uncommitted) | FAQ ignores Hindi fields; JSON backend ignores `order` |
| C-07 | P0 | ✅ | Claude | 6d1f665 | Contact form shows success on failure |
| C-08 | P1 | ✅ | Claude | 2852416 | Contact sends `package` (name) not `packageId`; `travelers` may be `""` |
| C-09 | P2 | ⏸ | client | needs decision: which email (info@atlastours.in vs gmail) | Contact info / phone hardcoded in 5+ places, inconsistent |

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
| D-04 | P2 | ✅ | Claude | 2852416 + p2-fixes | `Math.random()` in render; effects without cleanup |
| D-05 | P2 | ✅ | Claude | p2-fixes (uncommitted) | Dark-theme flash on load; `lang="hi"` set on English content |

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
| E-02 | P2 | ✅ | Claude | p2-fixes (uncommitted) | Hardcoded colors break dark mode |
| E-03 | P1 | ✅ | Claude | 2852416 | Gallery tiles not keyboard accessible |
| E-04 | P1 | ✅ | Claude | 2852416 | Modals lack dialog semantics, focus trap, Esc |
| E-05 | P1 | ✅ | Claude | 2852416 | Form labels not associated with inputs |
| E-06 | P2 | ✅ | Claude | p2-fixes (uncommitted) | Off-canvas menu & WhatsApp popup focusable when hidden; no `aria-expanded` |
| E-07 | P2 | ✅ | Claude | 2852416 + p2-fixes | Icon-only buttons lack accessible names |
| E-08 | P2 | ✅ | Claude | p2-fixes (uncommitted) | Reviews carousel auto-advance with no pause / `aria-live` |
| E-09 | P2 | ✅ | Claude | 2852416 | FAQ buttons lack `aria-expanded`/`aria-controls` |
| E-10 | P2 | ⏸ | client | needs design approval (visual change) | Contrast failures |
| E-11 | P3 | ⬜ | | | No `:focus-visible` styles / skip link; login `outline:none` |
| E-12 | P3 | ✅ | Claude | p2-fixes (uncommitted) | Star ratings & hero `<h1>` not meaningful to screen readers |

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
| F-07 | P2 | ✅ | Claude | p2-fixes (uncommitted) | Poppins loaded twice; full Font Awesome for one icon |
| F-08 | P2 | ✅ | Claude | p2-fixes (uncommitted) | Lint broken — add `eslint.config.mjs` |
| F-09 | P3 | ⬜ | | | Remove dead deps (`tailwindcss`, `@tailwindcss/turbopack`), use or remove `bcryptjs` (see B-02) |
| F-10 | P3 | ⬜ | | | Remove ~15 empty route folders or implement (see G) |

- **F-01** — `npm i next@16.4.6 eslint-config-next@16.4.6`, rebuild.
- **F-02** — fetch packages/reviews/faqs/blogs/gallery in a server component (`page.tsx` → server wrapper passing props to client sections). Coordinate with D (owns `page.tsx`) — do after D-01/D-02.
- **F-03** — `layout.tsx:5-9`: add `metadataBase`, `openGraph`, `twitter`, `alternates.canonical`, `icons`.
- **F-05** — `Hero.tsx:248`, `Packages.tsx:344,405`, `Blog.tsx:184`, admin default `package.jpg`; `public/images/destinations/` empty.
- **F-07** — `layout.tsx:17-18`, `Header.tsx:182` `@import`. Use `next/font/google`; drop Font Awesome or subset it.
- **F-10** — empty: `src/app/{callback,compare,customize,gallery,stories,track,wishlist,photo-credits,packages/[id],guides/[id]}`, `src/app/api/{payments/*,notifications,callback-slots,planning,tracking}`.

### Workstream G — Missing features (after A–D)

| ID | Sev | Status | Owner | Fixed in | Feature |
|---|---|---|---|---|---|
| G-01 | P2 | ⏸ | client | needs product decision | Online booking form wired to `/api/book` (or delete the endpoint) |
| G-02 | P2 | ⏸ | client | needs product decision | Email/WhatsApp notification to owner on new enquiry/booking |
| G-03 | P2 | ⏸ | client | needs product decision | Package detail pages `/packages/[id]` (SEO + shareable links) |
| G-04 | P2 | ⏸ | client | needs product decision | Image upload in admin (e.g. Vercel Blob / Cloudinary) |
| G-05 | P2 | ⏸ | client | needs product decision | Show active offers/coupons on public site |
| G-06 | P3 | ⬜ | | | Package category filter / search; gallery category tabs |
| G-07 | P3 | ⬜ | | | Blog detail pages |
| G-08 | P3 | ⬜ | | | Full Hindi translation (message catalog instead of inline ternaries) |
| G-09 | P3 | ⬜ | | | Payments (Razorpay) — `api/payments/*` folders are empty |
| G-10 | P3 | ⬜ | | | Test setup (Vitest + Playwright smoke test of home page & admin CRUD) |

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
