import { withHandler } from "@/lib/api";
import { BOOKINGS_LIST, inboxExport } from "@/lib/inbox-route";

// Admin-only CSV of the bookings matching the same filters as GET /api/bookings (max 10,000 rows).
export const GET = withHandler(async (req) => inboxExport(req, BOOKINGS_LIST));
