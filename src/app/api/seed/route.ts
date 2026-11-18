import { NextRequest, NextResponse } from "next/server";
import { initDB } from "@/lib/db-schema";
import { seedContent } from "@/lib/db";
import { safeEqual } from "@/lib/auth";
import { clientIp, consume } from "@/lib/rate-limit";

// Dev-only fallback (documented in CLAUDE.md). Never accepted in production.
const DEV_SEED_SECRET = "atlas-seed-2024";

// B-14: caps guesses at SEED_SECRET (and repeated seeding). Shared via Upstash or in memory per instance — see rate-limit.ts.
const SEED_LIMIT = 5;
const SEED_WINDOW_MS = 15 * 60 * 1000;

/**
 * POST { secret, content? } — creates the Postgres tables and (unless `content: false`)
 * inserts the default content from `src/lib/seed-data.ts`. Safe to re-run: existing
 * rows (matched by id) are never updated or deleted, and bookings/enquiries are never
 * seeded. Responds `{ tables: "ok", inserted: { packages, reviews, gallery, blogs, faqs, offers } }`
 * with the number of rows actually inserted (0s on a re-run); `inserted` is null when
 * `content: false`.
 */
export async function POST(req: NextRequest) {
  if (await consume(`seed:${clientIp(req)}`, SEED_LIMIT, SEED_WINDOW_MS)) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }
  // Resolved at request time so `next build` (NODE_ENV=production) is unaffected.
  let expected = process.env.SEED_SECRET;
  if (!expected) {
    if (process.env.NODE_ENV === "production") {
      console.error("[seed] SEED_SECRET is not set. /api/seed is disabled in production until it is configured.");
      return NextResponse.json({ error: "Seeding is not configured" }, { status: 503 });
    }
    expected = DEV_SEED_SECRET;
  }

  let body: { secret?: unknown; content?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
  }
  if (!body || typeof body !== "object" || !safeEqual(body.secret, expected)) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
  }
  if (body.content !== undefined && typeof body.content !== "boolean") {
    return NextResponse.json({ error: "`content` must be a boolean" }, { status: 400 });
  }
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "No DATABASE_URL: the JSON backend needs no seeding (it seeds itself when its data file is missing)" },
      { status: 400 },
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { neon } = require("@neondatabase/serverless");
  try {
    await initDB(neon(process.env.DATABASE_URL));
    const inserted = body.content === false ? null : await seedContent();
    return NextResponse.json({ tables: "ok", inserted });
  } catch (err) {
    console.error("[seed] failed:", err);
    return NextResponse.json({ error: "Seeding failed; see server logs" }, { status: 500 });
  }
}
