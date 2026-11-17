# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status & fix tracker

**`PROJECT_AUDIT.md` is the source of truth for open issues and project status.** Every issue has an ID (`A-01`, `B-05`, …), severity, status and owner. When you fix something, update its row, the progress table and the changelog there. When you find something new, add it with the next free ID. All P0/P1 items are closed as of 2026-11-17; remaining work is P2/P3 and the feature backlog (workstream G).

## Commands

```bash
npm run dev          # Next.js dev server (http://localhost:3000)
npm run build        # production build
npm start            # serve the production build
npx tsc --noEmit     # type check — use this instead of `npm run lint`
```

`npm run lint` is broken: ESLint 9 needs an `eslint.config.*` file and none exists (tracked as F-08). Rely on `tsc --noEmit`.

There is no test runner. `tests/` exists but is empty and untracked (G-10).

**Testing writes locally mutates `data/db.json`, which is git-tracked.** After any manual POST/PATCH/DELETE testing, run `git checkout -- data/db.json`. Public form endpoints and login are rate-limited in memory (see below), so repeated curl testing can get you a `429` until the dev server restarts or the window passes.

Seeding Postgres tables (after `DATABASE_URL` is set). It only creates tables — it inserts no content (B-11):

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
| `NEXT_PUBLIC_SITE_URL` | `https://atlastours.in` | should be set (domain unconfirmed) | `metadataBase`, canonical, OG, sitemap, robots |

## Architecture

Single-page marketing site for a Varanasi tour operator, plus a password-gated admin CMS. Next.js 16.4.6 App Router, React 19.3, TypeScript strict.

### Dual storage backend (`src/lib/db.ts`)

The single most important thing to know. One module exports an async CRUD API (`getPackages`, `addBooking`, …) that dispatches on `IS_POSTGRES = !!process.env.DATABASE_URL`:

- **No `DATABASE_URL`** → JSON file at `data/db.json`. Reseeds from `DEFAULT_PACKAGES` + `SITE_CONFIG` (`src/lib/config.ts`) **only when the file is missing** (ENOENT); a corrupt file throws instead of being overwritten. Writes are atomic (temp file + rename, with retries for Windows locks). Logs a loud error if used with `NODE_ENV=production` — it does not work on read-only serverless filesystems.
- **`DATABASE_URL` set** → Neon serverless Postgres, `require`d lazily inside `getSQL()` so the JSON path never loads the driver.

Two conventions cross this boundary and must be kept in sync by hand when adding a field:

1. **camelCase ↔ snake_case.** TS types use `originalPrice`, `packageId`, `travelDate`; Postgres columns are `original_price`, `package_id`, `travel_date`. `FAQ.order` maps to `sort_order`. Every `pg*` function hand-maps rows in both directions — there is no ORM.
2. **Array fields are JSON strings in Postgres.** `highlights`, `itinerary`, `inclusions` are `TEXT` columns holding `JSON.stringify`'d arrays, parsed back on read. In the JSON backend they're real arrays.

IDs and `createdAt` are always generated server-side; JSON-backend updates strip `id`/`createdAt` from the patch. FAQs are sorted by `order` in both backends.

Postgres updates use `COALESCE(${value ?? null}, column)`, so a partial `PATCH` only touches provided fields — but this also means **a field can never be cleared to NULL** (open issue B-07).

Adding an entity means touching `types.ts`, `db-schema.ts`, the `pg*` block, the `jsonCRUD` registration, the exported wrappers, a visibility rule in `src/lib/visibility.ts` (if public), and a route config.

### API layer (`src/lib/api.ts`, `src/lib/crud-route.ts`)

Every route handler is wrapped in `withHandler()`: thrown `HttpError`s become `{ error }` with their status; anything else is logged and returned as a generic 500 (no stack traces leak). `readJson()` returns 400 on malformed JSON. Validation helpers (`str`, `oneOf`, `positiveInt`, `isEmail`, `isPhone`, `pickFields`, `requireFields`) are hand-rolled — there is no zod.

The six content entities (`packages`, `reviews`, `gallery`, `blogs`, `faqs`, `offers`) are generated by `crudRoute({ list, add, update, remove, isPublic, fields, required, defaults })`. Each `route.ts` is just a config: a field spec (whitelist + types — unknown fields are dropped, wrong types → 400), required fields, defaults, and the public-visibility predicate.

Contract, shared by all eight entity routes:

- `GET` is public for content entities and returns **only publicly visible items** (packages: `!hidden`; others: `active !== false`, rules in `src/lib/visibility.ts`). `?all=1` returns everything **only** with a valid admin session — the admin page always uses it. `bookings`/`enquiries` `GET` is admin-only.
- `POST`/`PATCH`/`DELETE` require an admin session (401 otherwise).
- `PATCH` and `DELETE` take the id **in the JSON body**, not a query string. Unknown id → 404.
- Success responses are the **bare entity or array** — no envelope. `DELETE` returns `{ success: true }`. Errors are `{ error: string }`.
- Booking/enquiry status values are validated against the enums in `types.ts`.

Public, unauthenticated write endpoints (`src/lib/public-form.ts`) — do not confuse with the admin `/api/bookings` and `/api/enquiries`:

- `POST /api/enquiry` — used by the Contact form. Whitelisted, length-capped fields; `travelers` coerced to int 1–100; accepts `packageId` (or legacy `package` id/name, mapped).
- `POST /api/book` — **not used by any UI yet**. `packageName` and `amount` are looked up server-side; `amount = price × travelers` (assumes per-person pricing — unconfirmed with the client).
- Both: honeypot field `website` (non-empty → 200, nothing saved) and a rate limit of 5 requests/min per IP.

Rate limiting (`src/lib/rate-limit.ts`) is **in-memory and per instance** — it resets on restart/cold start and isn't shared across serverless instances. Client IP comes from `x-forwarded-for`.

There is no middleware. Auth is enforced per route handler; the `/admin` page guards itself client-side via `/api/auth/me` and redirects to `/login` on any 401.

Empty scaffold folders exist under `src/app/api/` (`payments/*`, `notifications`, `callback-slots`, `planning`, `tracking`) and `src/app/` (`callback`, `compare`, `wishlist`, …) — they have no route files (F-10 / workstream G).

### Auth (`src/lib/auth.ts`)

`verifyAdminCredentials(email, password)` (async) is the single login check: bcrypt when `ADMIN_PASSWORD_HASH` is set, otherwise a constant-time compare (`safeEqual`, SHA-256 + `timingSafeEqual`). The login route locks an IP out after 5 failures per 15 min (429). Success signs a 24h HS256 JWT (jose) into the httpOnly `admin_session` cookie (`sameSite: lax`, `secure` in production). `verifySession()` reads it from `next/headers` cookies. Sessions are not revocable before expiry (B-08).

### Frontend

`src/app/page.tsx` is an **async server component** (`export const dynamic = "force-dynamic"`). It loads packages, gallery, reviews, blogs and FAQs directly from `db.ts` in parallel, filters them with the same `src/lib/visibility.ts` rules the API uses, and passes them as props (`initialPackages`, `initialImages`, `initialReviews`, `initialBlogs`, `initialFaqs`) to the section components. **Components do not fetch on mount** — the content is in the server HTML. A failed load logs and falls back to `[]`. The page also emits FAQPage JSON-LD. The admin page is the only place that still fetches client-side.

Sections are `"use client"` components rendered in order with `<WaveDivider>` SVGs between them; navigation is hash anchors, not routes. Anything rendered on both server and client must be deterministic: prices use fixed `en-IN` formatting and blog dates use a hand-written IST formatter, to avoid hydration mismatches.

Scroll reveal lives in `src/components/RevealObserver.tsx` (renders nothing): an `IntersectionObserver` adds `visible`/`active` to any `.fade-in`, `.reveal`, `.reveal-left`, `.reveal-right`, `.reveal-scale` element, and a `MutationObserver` picks up elements mounted later. Components opt into animation purely by class name (plus `.stagger-N`, `.card-hover`, `.img-zoom` from `globals.css`). `globals.css` has a `prefers-reduced-motion` block that disables animations and shows reveal elements immediately; `Hero.tsx` also stops the video and typing loop for reduced motion. `ScrollProgress.tsx` updates the progress bar through a ref (no React state per scroll) — keep scroll listeners passive and avoid setState on every scroll event.

Styling is **CSS custom properties + inline `React.CSSProperties` objects**, not Tailwind. `tailwindcss` is in `devDependencies` but unwired — dead weight (F-09). Theme and dark mode come from `:root` / `[data-theme="dark"]` variables in `src/app/globals.css`; a component that hardcodes a color will break dark mode (several still do — E-02). Font Awesome and Poppins load from CDNs in `src/app/layout.tsx`. **The client has asked for no visual/design changes** unless explicitly approved.

Shared types: import entity types from `src/lib/types.ts` (`TourPackage`, `Review`, `GalleryImage`, `BlogPost`, `FAQ`, `Offer`, …) — never redeclare them locally. Field names that previously drifted: reviews use `text` (not `message`), blogs use `createdAt` (not `date`), itinerary is `string[]`, ids are `id` (not `_id`).

`src/lib/context.tsx` provides `useApp()` with `lang` (`"en" | "hi"`) and `theme`, persisted to `localStorage` and reflected onto `<html data-theme>` / `lang`. Translation is inline ternaries — there is no message catalog. Only `Header.tsx` consumes it; the rest of the site is English-only (G-08).

SEO: `src/lib/seo.ts` holds site URL, title, description, OG image and the JSON-LD builders (`travelAgencyJsonLd`, `faqPageJsonLd`, `jsonLdString` which escapes `<`). `layout.tsx` sets `metadataBase`/OG/Twitter/canonical and the TravelAgency JSON-LD; `src/app/robots.ts` and `src/app/sitemap.ts` exist; the favicon is `src/app/icon.jpeg`.

Images are unoptimized (`next.config.ts`) since package/gallery URLs point at arbitrary remote hosts (Unsplash by default). Local fallbacks live in `public/images/` (`hero-fallback.jpg`, `placeholder.jpg`, `package.jpg`, `atlas-logo.jpeg`).

### Known inconsistencies still open

- `admin/page.tsx` (~900 lines) still redefines the entity interfaces locally instead of importing from `src/lib/types.ts` (A-04) and should be split into components (A-08).
- Phone/email are hardcoded in several components and `Contact.tsx` shows a different email than `SITE_CONFIG` (C-09).
- Offers are managed in the admin but never shown on the public site (G-05).
