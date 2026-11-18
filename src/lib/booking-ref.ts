/**
 * N-4: the booking reference shown to customers. It is the first 8 hex characters of the
 * booking's UUID, upper-cased (e.g. "3F9A2C1B"). Shared by the booking form (which shows
 * it after a successful booking) and the booking-status lookup.
 */
export const BOOKING_REF_LENGTH = 8;

export const bookingReference = (id: string): string => id.slice(0, BOOKING_REF_LENGTH).toUpperCase();

/**
 * Normalises what a customer typed ("#3f9a 2c1b", "3F9A-2C1B…", a full id) to the lowercase
 * id prefix to search for, or null if it can't be a reference. Spaces and a leading "#" are
 * ignored; only hex digits and dashes are kept, and at least 8 hex digits are required.
 */
export function parseBookingReference(input: string): string | null {
  const cleaned = input.trim().replace(/^#/, "").replace(/\s+/g, "").toLowerCase();
  if (!/^[0-9a-f-]+$/.test(cleaned)) return null;
  // A full UUID is matched as-is; anything shorter is treated as the 8-character reference
  // (a dash typed inside the reference, as in "3F9A-2C1B", is dropped).
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(cleaned)) return cleaned;
  const hex = cleaned.replace(/-/g, "");
  return hex.length === BOOKING_REF_LENGTH ? hex : null;
}
