import { NextResponse } from "next/server";
import { getInboxSummary } from "@/lib/db";
import { requireAdmin, withHandler } from "@/lib/api";

/**
 * Admin-only: what the Dashboard and the sidebar counts need (booking/enquiry totals,
 * pending bookings, new enquiries, paid revenue, the 5 newest of each) without loading
 * the full lists. Response: `InboxSummary` from db.ts.
 */
export const GET = withHandler(async () => {
  await requireAdmin();
  return NextResponse.json(await getInboxSummary(), { headers: { "Cache-Control": "no-store" } });
});
