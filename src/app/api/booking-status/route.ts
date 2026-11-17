import { NextResponse } from "next/server";
import { findBookingsByIdPrefix } from "@/lib/db";
import { HttpError, badRequest, notFound, readJson, str, withHandler } from "@/lib/api";
import { clientIp, consume } from "@/lib/rate-limit";
import { phoneKey } from "@/lib/public-form";
import { bookingReference, parseBookingReference } from "@/lib/booking-ref";

// Stricter than the form limit: each attempt is a guess at a (reference, phone) pair.
const LOOKUP_LIMIT = 10;
const LOOKUP_WINDOW_MS = 15 * 60 * 1000;

const NOT_FOUND = "No booking matches that reference and phone number.";

/**
 * N-4: public booking-status lookup by reference + phone. Both must match: the reference
 * alone is not enough, and the response is the same 404 whether the reference or the phone
 * is wrong, so it doesn't reveal which references exist. Only status fields are returned —
 * never the email, full name, city or internal id. Rate-limited per IP (in memory, per
 * instance; see rate-limit.ts). POST, not GET, so the phone number stays out of URLs and logs.
 */
export const POST = withHandler(async (req) => {
  if (consume(`booking-status:${clientIp(req)}`, LOOKUP_LIMIT, LOOKUP_WINDOW_MS)) {
    throw new HttpError(429, "Too many lookups. Please try again in 15 minutes.");
  }
  const body = await readJson(req);
  const prefix = parseBookingReference(str(body, "reference", 60, true));
  if (!prefix) throw badRequest("reference must be the 8-character booking reference");
  const phone = phoneKey(str(body, "phone", 20, true));
  if (phone.length < 7) throw badRequest("phone is not a valid phone number");

  // Newest first, so if two bookings ever share a reference prefix and phone, the latest wins.
  const match = (await findBookingsByIdPrefix(prefix))
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .find((b) => phoneKey(b.phone ?? "") === phone);
  if (!match) throw notFound(NOT_FOUND);

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
