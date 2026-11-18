import { NextResponse } from "next/server";
import { findBookingByUtr, updateBooking } from "@/lib/db";
import { HttpError, badRequest, readJson, str, withHandler } from "@/lib/api";
import { clientIp, consume } from "@/lib/rate-limit";
import { isHoneypotTripped } from "@/lib/public-form";
import { findBookingByReferenceAndPhone } from "@/lib/booking-lookup";
import { normalizeUtr } from "@/lib/upi";

// Each attempt is a guess at a (reference, phone) pair, so same limit as the status lookup.
const CLAIM_LIMIT = 10;
const CLAIM_WINDOW_MS = 15 * 60 * 1000;

const UTR_TAKEN = "This transaction ID has already been submitted.";

/** Postgres unique violation on the partial unique index over bookings.utr (migration v7). */
function isUtrConflict(err: unknown): boolean {
  const e = err as { code?: string; message?: string } | null;
  return e?.code === "23505" || /bookings_utr_unique/.test(e?.message ?? "");
}

/**
 * N-13: a customer who paid a confirmed booking by UPI submits the 12-digit UTR. The booking
 * moves to `verifying`; the owner checks it against the bank statement in the admin. Same
 * reference + phone proof as the booking-status lookup. Public, unauthenticated.
 */
export const POST = withHandler(async (req) => {
  const body = await readJson(req);
  if (isHoneypotTripped(body)) return NextResponse.json({ success: true });
  if (await consume(`payment-claim:${clientIp(req)}`, CLAIM_LIMIT, CLAIM_WINDOW_MS)) {
    throw new HttpError(429, "Too many attempts. Please try again in 15 minutes.");
  }

  const booking = await findBookingByReferenceAndPhone(body);
  const utr = normalizeUtr(str(body, "utr", 40, true));
  if (!utr) throw badRequest("utr must be the 12-digit UPI transaction ID");
  if (booking.bookingStatus !== "confirmed" || booking.paymentStatus !== "pending") {
    throw new HttpError(409, "This booking is not awaiting payment.");
  }

  const existing = await findBookingByUtr(utr);
  if (existing && existing.id !== booking.id) throw new HttpError(409, UTR_TAKEN);

  try {
    await updateBooking(booking.id, {
      paymentStatus: "verifying",
      utr,
      paymentSubmittedAt: new Date().toISOString(),
    });
  } catch (err) {
    if (isUtrConflict(err)) throw new HttpError(409, UTR_TAKEN);
    throw err;
  }
  return NextResponse.json({ success: true, paymentStatus: "verifying" });
});
