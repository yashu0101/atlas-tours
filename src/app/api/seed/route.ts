import { NextRequest, NextResponse } from "next/server";
import { initDB } from "@/lib/db-schema";

export async function POST(req: NextRequest) {
  const { secret } = await req.json();
  if (secret !== (process.env.SEED_SECRET || "atlas-seed-2024")) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
  }
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "No DATABASE_URL" }, { status: 400 });
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { neon } = require("@neondatabase/serverless");
  const sql = neon(process.env.DATABASE_URL);
  await initDB(sql);
  return NextResponse.json({ success: true, message: "Database tables created" });
}
