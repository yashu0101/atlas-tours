import { NextResponse } from "next/server";
import { requireAdmin, withHandler } from "@/lib/api";
import { getAuditLog } from "@/lib/db";

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 500;

/** N-8: admin-only audit log, newest first. `?limit=` defaults to 100 and is capped at 500. */
export const GET = withHandler(async (req) => {
  await requireAdmin();
  const raw = req.nextUrl.searchParams.get("limit");
  const n = raw === null || raw === "" ? DEFAULT_LIMIT : Number(raw);
  const limit = Number.isFinite(n) && n >= 1 ? Math.min(Math.floor(n), MAX_LIMIT) : DEFAULT_LIMIT;
  return NextResponse.json(await getAuditLog(limit));
});
