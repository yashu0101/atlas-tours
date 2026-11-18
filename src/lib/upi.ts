import { UPI_CONFIG } from "@/lib/config";

/** A UPI transaction reference (UTR / RRN) is exactly 12 digits. */
export const UTR_LENGTH = 12;

/**
 * `upi://pay` deep link for the configured payee. With `opts` it carries the amount and
 * a booking reference note (used for the per-booking QR). The `@` in `pa` is deliberately
 * NOT percent-encoded: the literal form was verified on real devices.
 */
export function upiPayLink(opts?: { amount: number; reference: string }): string {
  let link = `upi://pay?pa=${UPI_CONFIG.id}&pn=${encodeURIComponent(UPI_CONFIG.payee)}`;
  if (opts) link += `&am=${opts.amount.toFixed(2)}`;
  link += "&cu=INR";
  if (opts) link += `&tn=${encodeURIComponent(`Atlas booking ${opts.reference}`)}`;
  return link;
}

/** Generic link (no amount), opens the customer's UPI app with our UPI ID pre-filled. */
export const UPI_PAY_LINK = upiPayLink();

/** Strips spaces and dashes; returns the 12-digit UTR, or null when invalid. */
export function normalizeUtr(input: string): string | null {
  const cleaned = input.replace(/[\s-]/g, "");
  return /^\d{12}$/.test(cleaned) && cleaned.length === UTR_LENGTH ? cleaned : null;
}
