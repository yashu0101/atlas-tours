import { NextRequest, NextResponse } from "next/server";
import { initDB } from "@/lib/db-schema";
import { safeEqual } from "@/lib/auth";

// Dev-only fallback (documented in CLAUDE.md). Never accepted in production.
const DEV_SEED_SECRET = "atlas-seed-2024";

export async function POST(req: NextRequest) {
  // Resolved at request time so `next build` (NODE_ENV=production) is unaffected.
  let expected = process.env.SEED_SECRET;
  if (!expected) {
    if (process.env.NODE_ENV === "production") {
      console.error("[seed] SEED_SECRET is not set. /api/seed is disabled in production until it is configured.");
      return NextResponse.json({ error: "Seeding is not configured" }, { status: 503 });
    }
    expected = DEV_SEED_SECRET;
  }

  let secret: unknown;
  try {
    ({ secret } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
  }
  if (!safeEqual(secret, expected)) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
  }
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "No DATABASE_URL" }, { status: 400 });
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { neon } = require("@neondatabase/serverless");
  const sql = neon(process.env.DATABASE_URL);
  await initDB(sql);
  return NextResponse.json({ success: true, message: "Database tables created" });
}
