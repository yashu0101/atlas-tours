import type { BlogPost, FAQ, GalleryImage, Offer, Review, TourPackage } from "./types";

/**
 * Public-visibility rules for admin-managed content (B-05).
 *
 * Shared by the public API GETs (`crudRoute({ isPublic })`) and the
 * server-rendered home page (F-02) so the two can never drift apart.
 */
export const isPublicPackage = (p: TourPackage) => !p.hidden;
export const isPublicReview = (r: Review) => r.active !== false;
export const isPublicGalleryImage = (g: GalleryImage) => g.active !== false;
export const isPublicBlog = (b: BlogPost) => b.active !== false;
export const isPublicFAQ = (f: FAQ) => f.active !== false;

const IST_OFFSET_MS = 330 * 60 * 1000;

/** The calendar date in India (IST, UTC+5:30) as "YYYY-MM-DD", which sorts correctly as a string. */
export function istDateKey(now: Date): string {
  return new Date(now.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

/**
 * G-05: an offer is public when it is active and not expired at `now`.
 * `validTo` is a calendar date ("YYYY-MM-DD", the admin form's date input; a longer ISO
 * string is cut to its date part) and is inclusive: the offer is still shown on that day
 * in India and disappears from the next IST day. Empty or unparseable `validTo` = no expiry.
 * `validFrom` is not enforced (an upcoming offer can be announced early).
 */
export function isOfferPublicAt(o: Offer, now: Date): boolean {
  if (o.active === false) return false;
  const end = typeof o.validTo === "string" ? /^\d{4}-\d{2}-\d{2}/.exec(o.validTo.trim())?.[0] : undefined;
  if (!end) return true;
  return end >= istDateKey(now);
}

/**
 * Single-argument form for `crudRoute({ isPublic })` / `Array.filter` (which would pass the
 * index as a second argument, so the clock is read here instead of taken as a parameter).
 */
export const isPublicOffer = (o: Offer) => isOfferPublicAt(o, new Date());
