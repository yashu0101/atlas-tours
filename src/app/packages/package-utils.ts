import { SITE_CONFIG } from "@/lib/config";
import type { TourPackage } from "@/lib/types";
import { translate, type Lang } from "@/lib/i18n";

/**
 * Pure helpers shared by the package detail page (G-03), the booking form (G-01)
 * and the home-page package filter (G-06). No "use client" directive so the server
 * page can call them too; nothing here touches the DB or the DOM.
 */

export type PackageCategory = TourPackage["category"];

/** Display order of the category chips; any category present in data appears in this order. */
export const CATEGORY_ORDER: readonly PackageCategory[] = ["spiritual", "cultural", "heritage", "adventure", "pilgrimage", "international"];

/** English labels of the known categories (catalog keys `packages.categories.*`, G-08). */
export const CATEGORY_LABELS: Record<PackageCategory, string> = {
  spiritual: translate("en", "packages.categories.spiritual"),
  cultural: translate("en", "packages.categories.cultural"),
  heritage: translate("en", "packages.categories.heritage"),
  adventure: translate("en", "packages.categories.adventure"),
  pilgrimage: "Pilgrimage",
  international: "International",
};

export const categoryLabel = (c: string, _lang: Lang = "en"): string => {
  if (c in CATEGORY_LABELS) return CATEGORY_LABELS[c as PackageCategory];
  return c ? c.charAt(0).toUpperCase() + c.slice(1) : "";
};

/** Categories that actually occur in `packages`, in CATEGORY_ORDER (unknown values last, alphabetically). */
export function packageCategories(packages: readonly Pick<TourPackage, "category">[]): string[] {
  const present = new Set(packages.map((p) => p.category).filter(Boolean));
  const known = CATEGORY_ORDER.filter((c) => present.has(c));
  const unknown = [...present].filter((c) => !(CATEGORY_ORDER as readonly string[]).includes(c)).sort();
  return [...known, ...unknown];
}

export type CategoryFilter = "all" | string;

export function filterByCategory<T extends Pick<TourPackage, "category">>(packages: readonly T[], filter: CategoryFilter): T[] {
  return filter === "all" ? [...packages] : packages.filter((p) => p.category === filter);
}

// Fixed locale so server-rendered and hydrated prices are identical (F-02).
export const formatPrice = (n: number | undefined): string => (typeof n === "number" ? n.toLocaleString("en-IN") : "");

export const discountPercent = (original: number, current: number): number =>
  Math.round(((original - current) / original) * 100);

/** Itinerary entries are stored as "Day N: ..." strings; strip the prefix since the day badge shows it. */
export const stripDayPrefix = (line: string): string => line.replace(/^\s*Day\s*\d+\s*[:\-–—]\s*/i, "");

export const packagePath = (id: string): string => `/packages/${encodeURIComponent(id)}`;

/** Anchor of the booking card on the detail page (`id` of its <aside>). */
export const BOOKING_ANCHOR = "book";

/** Detail page scrolled to the booking form — target of the cards' "Book Now". */
export const packageBookingPath = (id: string): string => `${packagePath(id)}#${BOOKING_ANCHOR}`;

/** wa.me link to the business number from SITE_CONFIG with a prefilled message. */
export const whatsappLink = (text: string): string =>
  `https://wa.me/${SITE_CONFIG.whatsapp}?text=${encodeURIComponent(text)}`;

export const packageEnquiryText = (packageName: string, lang: Lang = "en"): string =>
  translate(lang, "packages.enquiryMessage", { name: packageName });

// ------------------------------------------------------------
// Booking form (G-01) — mirrors POST /api/book (src/app/api/book/route.ts)
// ------------------------------------------------------------

export const MAX_TRAVELERS = 100;

/** Same coercion the server applies (positiveInt 1–100); invalid/empty input counts as 1. */
export function clampTravelers(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(Math.floor(n), MAX_TRAVELERS);
}

/** Server computes amount = price × travelers (per-person pricing); this is the client-side estimate. */
export const estimateTotal = (price: number, travelers: unknown): number => price * clampTravelers(travelers);

export interface BookingFormValues {
  name: string;
  phone: string;
  email: string;
  city: string;
  travelDate: string;
  travelers: string;
  /** Honeypot — humans leave it empty. */
  website: string;
}

export const EMPTY_BOOKING_FORM: BookingFormValues = {
  name: "",
  phone: "",
  email: "",
  city: "",
  travelDate: "",
  travelers: "1",
  website: "",
};

/**
 * The exact body sent to `/api/book`: only fields the endpoint reads. `amount` and
 * `packageName` are never sent — the server derives them from the package.
 */
export function buildBookingPayload(form: BookingFormValues, packageId: string) {
  return {
    packageId,
    name: form.name.trim(),
    phone: form.phone.trim(),
    email: form.email.trim(),
    city: form.city.trim(),
    travelDate: form.travelDate,
    travelers: clampTravelers(form.travelers),
    website: form.website,
  };
}

/** User-facing message for a failed `/api/book` response. */
export function bookingErrorMessage(status: number, body: unknown, lang: Lang = "en"): string {
  if (status === 429) return translate(lang, "booking.errorTooMany");
  if (status === 404) return translate(lang, "booking.errorNotFound");
  const serverMsg =
    body && typeof body === "object" && typeof (body as { error?: unknown }).error === "string"
      ? (body as { error: string }).error
      : "";
  if (status === 400 && serverMsg) return translate(lang, "booking.errorCheckDetails", { message: serverMsg });
  return translate(lang, "booking.errorGeneric");
}
