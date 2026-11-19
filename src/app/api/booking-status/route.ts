import { NextResponse } from "next/server";
import { HttpError, readJson, withHandler } from "@/lib/api";
import { clientIp, consume } from "@/lib/rate-limit";
import { bookingReference } from "@/lib/booking-ref";
import { findBookingByReferenceAndPhone } from "@/lib/booking-lookup";

// Stricter than the form limit: each attempt is a guess at a (reference, phone) pair.
const LOOKUP_LIMIT = 10;
const LOOKUP_WINDOW_MS = 15 * 60 * 1000;

/**
 * N-4: public booking-status lookup by reference + phone. Both must match: the reference
 * alone is not enough, and the response is the same 404 whether the reference or the phone
 * is wrong, so it doesn't reveal which references exist. Only status fields are returned —
 * never the email, full name, city or internal id. Rate-limited per IP (shared via Upstash or in
 * memory per instance; see rate-limit.ts). POST, not GET, so the phone number stays out of URLs and logs.
 */
export const POST = withHandler(async (req) => {
  if (await consume(`booking-status:${clientIp(req)}`, LOOKUP_LIMIT, LOOKUP_WINDOW_MS)) {
    throw new HttpError(429, "Too many lookups. Please try again in 15 minutes.");
  }
  const body = await readJson(req);
  const match = await findBookingByReferenceAndPhone(body);

  return NextResponse.json({
    reference: bookingReference(match.id),
    firstName: (match.name ?? "").trim().split(/\s+/)[0] ?? "",
    packageName: match.packageName,
    travelDate: match.travelDate,
    travelers: match.travelers,
    amount: match.amount,
    bookingStatus: match.bookingStatus,
    paymentStatus: match.paymentStatus,
    createdAt: match.createdAt,
  });
});
