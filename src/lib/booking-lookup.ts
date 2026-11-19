import { findBookingsByIdPrefix } from "./db";
import { Body, badRequest, notFound, str } from "./api";
import { phoneKey } from "./public-form";
import { parseBookingReference } from "./booking-ref";
import type { Booking } from "./types";

export const BOOKING_NOT_FOUND = "No booking matches that reference and phone number.";

/**
 * N-4 / N-13: finds a booking from the customer's reference + phone. Both must match, and the
 * 404 is identical whichever one is wrong, so it doesn't reveal which references exist.
 * Callers rate-limit before calling this.
 */
export async function findBookingByReferenceAndPhone(body: Body): Promise<Booking> {
  const prefix = parseBookingReference(str(body, "reference", 60, true));
  if (!prefix) throw badRequest("reference must be the 8-character booking reference");
  const phone = phoneKey(str(body, "phone", 20, true));
  if (phone.length < 7) throw badRequest("phone is not a valid phone number");

  // Newest first, so if two bookings ever share a reference prefix and phone, the latest wins.
  const match = (await findBookingsByIdPrefix(prefix))
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .find((b) => phoneKey(b.phone ?? "") === phone);
  if (!match) throw notFound(BOOKING_NOT_FOUND);
  return match;
}
