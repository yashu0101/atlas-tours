import { withHandler } from "@/lib/api";
import { ENQUIRIES_LIST, inboxExport } from "@/lib/inbox-route";

// Admin-only CSV of the enquiries matching the same filters as GET /api/enquiries (max 10,000 rows).
export const GET = withHandler(async (req) => inboxExport(req, ENQUIRIES_LIST));
