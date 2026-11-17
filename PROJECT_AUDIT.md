# Atlas Tours — Project Audit & Fix Tracker

> **Single source of truth** for project status and the fix backlog.
> Audit date: **2026-11-17** · Audited commit: `dd7e91d` · Overall rating: **4.5 / 10**

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
| A — Admin panel | `src/app/admin/page.tsx`, `src/app/login/page.tsx` | 8 | 2 | 🔄 |
| B — API, DB & auth | `src/lib/db.ts`, `src/lib/auth.ts`, `src/lib/db-schema.ts`, `src/app/api/**` | 12 | 1 | 🔄 |
| C — Public data contracts | `Packages.tsx`, `Reviews.tsx`, `Blog.tsx`, `FAQ.tsx`, `Contact.tsx`, `Gallery.tsx` | 9 | 2 | 🔄 |
| D — Page shell & animation | `src/app/page.tsx`, `src/app/globals.css`, `src/lib/context.tsx` | 5 | 1 | 🔄 |
| E — Dark mode & accessibility | all `src/components/*` (runs **after C**) | 12 | 0 | ⬜ |
| F — SEO, config, assets, tooling | `layout.tsx`, `next.config.ts`, `package.json`, `public/`, new `sitemap.ts`/`robots.ts` | 10 | 0 | ⬜ |
| G — Missing features | new files | 10 | 0 | ⬜ |

**Parallel plan:** A, B, C, D, F can all start immediately. E starts after C (same files). G starts after A–D are done.

---

## 2. Where the project stands (snapshot 2026-11-17)

- **Stack:** Next.js 16.4.3 App Router, React 19.3, TypeScript strict, Neon Postgres or JSON-file storage (`DATABASE_URL` switches).
- **Size:** ~5,700 lines of source, 5 commits.
- **Type check:** `npx tsc --noEmit` ✅ passes.
- **Build:** all routes compile; Next.js halts the build with a security advisory for 16.4.3 (see F-01).
- **`npm audit`:** 1 moderate (`next` GHSA-mfr8-8qww-v76h — affects `'use cache'` + `unstable_cache`, **not used** in this repo → low real risk, upgrade anyway).
- **Tests:** none (`tests/` empty). **Lint:** broken (no `eslint.config.*`).
- **Verdict:** visually polished, structurally sound, but **not launchable** — several end-to-end features are broken and the admin is insecure by default.

### Scores

| Area | Score | Reason |
|---|---|---|
| Architecture | 7/10 | Clean App Router layout, dual storage backend, SQL injection-safe |
| UX / visual design | 6/10 | Polished & responsive, but fetched content is invisible (D-01) |
| Correctness | 3/10 | Frontend/API field mismatches; admin delete & save broken |
| Security | 3/10 | Default credentials accepted in prod, no rate limits, no validation |
| Accessibility | 3/10 | No reduced-motion, unlabeled forms/icons, gallery not keyboard-usable |
| Performance | 4/10 | All client-fetched, full re-render per scroll, autoplay video, double font load |
| SEO | 2/10 | Core content not in HTML; no OG / JSON-LD / sitemap / favicon |
| Maintainability | 4/10 | 871-line admin page; local interfaces drifted from `types.ts` |

---

## 3. Feature inventory

✅ working · ⚠️ partial/buggy (see issue) · ❌ missing

### Public site (single page, hash anchors)
| Feature | Status | Issues |
|---|---|---|
| Header (sticky, theme toggle, EN/HI toggle, mobile drawer, Call Now) | ✅ | E-06 |
| Hero (video bg, typing effect, CTAs, stats) | ⚠️ | F-05, D-04, C-09 |
| About | ✅ | — |
| Packages grid + detail modal | ⚠️ | D-01, C-01, C-02, B-05 |
| Gallery masonry + lightbox | ⚠️ | D-01, B-05, E-03 |
| Counter stats | ✅ | — |
| Reviews carousel | ⚠️ | C-03, D-01, B-05 |
| Blog (inline expand) | ⚠️ | C-04, C-05, D-01 |
| FAQ accordion | ⚠️ | C-06, B-05 |
| Contact / enquiry form | ⚠️ | C-07, C-08, B-04, E-01 |
| Footer | ✅ | — |
| WhatsApp widget | ✅ | E-06 |
| Back-to-top, scroll progress bar | ✅ | D-02 |
| Dark mode | ⚠️ | E-01, E-02 |
| Hindi translation | ⚠️ header only | G-08 |

### Admin CMS (`/login` → `/admin`)
| Feature | Status | Issues |
|---|---|---|
| Login / logout / client-side guard | ✅ (insecure defaults) | B-01, B-02 |
| Dashboard stats + recent items | ⚠️ | A-06 |
| Packages / Reviews / Gallery / Blogs / FAQs / Offers — create, edit, toggle | ⚠️ saves, then UI crashes | A-02 |
| All 8 entities — delete | ❌ broken | A-01 |
| Booking & enquiry status changes | ✅ | — |
| Image upload | ❌ URL only | G-04 |

### API (`src/app/api/*`)
| Route | Methods | Auth | Notes |
|---|---|---|---|
| `packages`, `reviews`, `gallery`, `blogs`, `faqs`, `offers` | GET/POST/PATCH/DELETE | GET public, writes admin | GET returns hidden/inactive (B-05) |
| `bookings` | GET/PATCH/DELETE | admin | |
| `enquiries` | GET/PATCH/DELETE | admin | |
| `book` | POST | public | unvalidated, client-set price, unused by UI (B-04) |
| `enquiry` | POST | public | unvalidated (B-04) |
| `auth/login`, `auth/logout`, `auth/me` | POST/POST/GET | — | B-01, B-02, B-08 |
| `seed` | POST | secret | creates tables only, no data (B-11) |

---

## 4. Issue backlog by workstream

### Workstream A — Admin panel
Owns: `src/app/admin/page.tsx`, `src/app/login/page.tsx`
Convention to follow (per CLAUDE.md): **PATCH/DELETE send `{ id }` in the JSON body; responses are the bare entity.**

| ID | Sev | Status | Owner | Fixed in | Issue |
|---|---|---|---|---|---|
| A-01 | P0 | ✅ | Claude | uncommitted 2026-11-17 | Every admin DELETE fails (500) |
| A-02 | P0 | ✅ | Claude | uncommitted 2026-11-17 | Create/edit/toggle crash the UI after saving |
| A-03 | P1 | ⬜ | | | No error handling on initial load / login |
| A-04 | P2 | ⬜ | | | Local interfaces duplicate `types.ts` |
| A-05 | P2 | ⬜ | | | Optimistic UI removes rows even on failure |
| A-06 | P2 | ⬜ | | | "Recent" lists show oldest on Postgres |
| A-07 | P3 | ⬜ | | | `faqs.sort` mutates state in place |
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
| B-01 | P0 | ✅ | Claude | uncommitted 2026-11-17 | Default admin credentials & JWT secret accepted in production |
| B-02 | P1 | ⬜ | | | No login rate limit; plaintext, non-constant-time password compare |
| B-03 | P1 | ⬜ | | | No try/catch or validation in any route |
| B-04 | P1 | ⬜ | | | Public `/api/book` & `/api/enquiry` unvalidated, abusable |
| B-05 | P1 | ⬜ | | | Hidden/inactive content served publicly |
| B-06 | P1 | ⬜ | | | JSON backend: lost writes, wipes data on parse error, fails on serverless |
| B-07 | P2 | ⬜ | | | COALESCE updates can't clear a field; backends behave differently |
| B-08 | P2 | ⬜ | | | Session not revocable; `role` not checked; logout cookie flags differ |
| B-09 | P2 | ⬜ | | | No security headers / CSP; remote URLs not restricted to https |
| B-10 | P2 | ⬜ | | | Client-supplied `id` on POST → PK collisions |
| B-11 | P3 | ⬜ | | | `/api/seed` weak default secret; creates tables but no seed data |
| B-12 | P3 | ⬜ | | | Unguarded `JSON.parse` on package array columns |

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
| C-01 | P1 | ⬜ | | | `_id` instead of `id` → undefined React keys |
| C-02 | P1 | ⬜ | | | Package itinerary renders blank |
| C-03 | P0 | ✅ | Claude | uncommitted 2026-11-17 | Review text always blank |
| C-04 | P1 | ⬜ | | | Blog "Read More" expands every card |
| C-05 | P2 | ⬜ | | | Blog date never shows |
| C-06 | P2 | ⬜ | | | FAQ ignores Hindi fields; JSON backend ignores `order` |
| C-07 | P0 | ✅ | Claude | uncommitted 2026-11-17 | Contact form shows success on failure |
| C-08 | P1 | ⬜ | | | Contact sends `package` (name) not `packageId`; `travelers` may be `""` |
| C-09 | P2 | ⬜ | | | Contact info / phone hardcoded in 5+ places, inconsistent |

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
| D-01 | P0 | ✅ | Claude | uncommitted 2026-11-17 | Fetched cards stay at `opacity:0` forever |
| D-02 | P1 | ⬜ | | | Whole page re-renders on every scroll event |
| D-03 | P1 | ⬜ | | | No `prefers-reduced-motion` support |
| D-04 | P2 | ⬜ | | | `Math.random()` in render; effects without cleanup |
| D-05 | P2 | ⬜ | | | Dark-theme flash on load; `lang="hi"` set on English content |

- **D-01** — `page.tsx:28-36` observes `.reveal`/`.fade-in` once on mount; Packages (`:341`), Gallery (`:207`), Blog (`:181`), Reviews header (`:201`) mount after fetch and are never observed (`globals.css:130`). Likely introduced in `dd7e91d`. **Fix:** add a `MutationObserver` that observes new reveal elements, or a `useReveal()` hook per component. **Verify:** all packages/gallery/blog/reviews visible after scroll.
- **D-02** — `page.tsx:18-25` `scrollProgress` state in root; listener not passive/throttled. **Fix:** move progress bar into its own component, update via ref + `requestAnimationFrame`, `{passive:true}`.
- **D-03** — 0 matches for `prefers-reduced-motion`. **Fix:** global media block in `globals.css` disabling animations/transitions; pause hero video & typing.
- **D-04** — `Hero.tsx:266-267` random sizes re-rolled every 40-80 ms (memoize once); `Hero.tsx:43` nested timeout, `Counter.tsx:44-51` rAF, `Contact.tsx:58` timeout lack cleanup; add `AbortController` to fetches.
- **D-05** — `context.tsx:23-31`. **Fix:** inline pre-paint script in `layout.tsx` setting `data-theme` (coordinate with F); only set `lang="hi"` once content is translated (G-08).

### Workstream E — Dark mode & accessibility (start after C)
Owns: all `src/components/*` style/markup, `src/app/login/page.tsx` (after A)

| ID | Sev | Status | Owner | Fixed in | Issue |
|---|---|---|---|---|---|
| E-01 | P1 | ⬜ | | | Contact inputs: near-black text on dark bg |
| E-02 | P2 | ⬜ | | | Hardcoded colors break dark mode |
| E-03 | P1 | ⬜ | | | Gallery tiles not keyboard accessible |
| E-04 | P1 | ⬜ | | | Modals lack dialog semantics, focus trap, Esc |
| E-05 | P1 | ⬜ | | | Form labels not associated with inputs |
| E-06 | P2 | ⬜ | | | Off-canvas menu & WhatsApp popup focusable when hidden; no `aria-expanded` |
| E-07 | P2 | ⬜ | | | Icon-only buttons lack accessible names |
| E-08 | P2 | ⬜ | | | Reviews carousel auto-advance with no pause / `aria-live` |
| E-09 | P2 | ⬜ | | | FAQ buttons lack `aria-expanded`/`aria-controls` |
| E-10 | P2 | ⬜ | | | Contrast failures |
| E-11 | P3 | ⬜ | | | No `:focus-visible` styles / skip link; login `outline:none` |
| E-12 | P3 | ⬜ | | | Star ratings & hero `<h1>` not meaningful to screen readers |

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
| F-01 | P1 | ⬜ | | | Upgrade Next.js 16.4.3 → ≥16.4.6 (advisory; build halts) |
| F-02 | P1 | ⬜ | | | Core content not server-rendered (not crawlable) |
| F-03 | P1 | ⬜ | | | Minimal metadata: no OG/Twitter/canonical/icons |
| F-04 | P1 | ⬜ | | | No JSON-LD (TravelAgency, FAQPage, Product/Offer, Review) |
| F-05 | P1 | ⬜ | | | Missing images: `hero-fallback.jpg`, `placeholder.jpg`, `package.jpg`; no favicon |
| F-06 | P2 | ⬜ | | | No `sitemap.ts` / `robots.ts` |
| F-07 | P2 | ⬜ | | | Poppins loaded twice; full Font Awesome for one icon |
| F-08 | P2 | ⬜ | | | Lint broken — add `eslint.config.mjs` |
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
| G-01 | P2 | ⬜ | | | Online booking form wired to `/api/book` (or delete the endpoint) |
| G-02 | P2 | ⬜ | | | Email/WhatsApp notification to owner on new enquiry/booking |
| G-03 | P2 | ⬜ | | | Package detail pages `/packages/[id]` (SEO + shareable links) |
| G-04 | P2 | ⬜ | | | Image upload in admin (e.g. Vercel Blob / Cloudinary) |
| G-05 | P2 | ⬜ | | | Show active offers/coupons on public site |
| G-06 | P3 | ⬜ | | | Package category filter / search; gallery category tabs |
| G-07 | P3 | ⬜ | | | Blog detail pages |
| G-08 | P3 | ⬜ | | | Full Hindi translation (message catalog instead of inline ternaries) |
| G-09 | P3 | ⬜ | | | Payments (Razorpay) — `api/payments/*` folders are empty |
| G-10 | P3 | ⬜ | | | Test setup (Vitest + Playwright smoke test of home page & admin CRUD) |

---

## 5. What's already good (keep it this way)

- SQL is injection-safe: every query uses Neon tagged templates — no string concatenation.
- All admin mutations and booking/enquiry reads check `verifySession()`.
- camelCase ↔ snake_case mappings match across `types.ts`, `db-schema.ts` and `pg*` functions for all 8 entities.
- No `dangerouslySetInnerHTML`; all content images have alt text.
- Responsive breakpoints present in every section; mobile drawer menu works.
- `data/db.json` contains only seed content (no real customer data) — keep it that way (consider gitignoring it, B-06).

---

## 6. Recommended order (fastest path to launch)

1. **Day 1 (parallel):** D-01 · A-01 · A-02 · C-01…C-05 · C-07 · B-01
2. **Day 2 (parallel):** B-03 · B-04 · B-05 (+ A uses `?all=1`) · C-08 · B-06 · F-01 · F-05 · E-01
3. **Day 3:** B-02 · D-02 · D-03 · F-02 · F-03 · F-04 · F-06
4. **Then:** remaining P2/P3, E workstream, G features.

---

## 7. Changelog

| Date | Who | Change |
|---|---|---|
| 2026-11-17 | Claude (audit) | Initial audit of `dd7e91d`; 66 items logged across 7 workstreams |
| 2026-11-17 | Claude (4 parallel subagents) | **All 6 P0s fixed (uncommitted), no UI/design changes.** D-01: MutationObserver observes late-mounted reveal elements (`page.tsx`). A-01/A-02: admin DELETE sends `{id}` in body; create/save use the bare entity; state changes only on `res.ok` (`admin/page.tsx`). B-01: secrets resolved lazily, fail closed in production, constant-time `verifyAdminCredentials` used by login route (also closes the timing half of B-02), seed returns 503 without `SEED_SECRET` (`auth.ts`, `api/auth/login/route.ts`, `api/seed/route.ts`). C-03: Reviews uses shared `Review` type and `text`. C-07: Contact checks `res.ok`, shows an error, keeps form data. Verified: `tsc` ✅, admin POST/PATCH/DELETE + login via curl ✅, prod fail-closed via `next start` ✅. **Not yet browser-verified:** D-01. **Follow-ups:** login placeholder still shows default email (deferred, UI); Contact error reuses green success style (needs design OK); DELETE returns 200 `{success:false}` for unknown id (fold into B-03). |
