import type { Booking, Enquiry, EnquiryKind } from "./types";
import { BOOKING_REF_LENGTH } from "./booking-ref";

/**
 * Filters for the admin Bookings / Enquiries lists (review point #6): ONE definition of what
 * "search", the status/kind filters and the received-date range mean, used by
 *  - the JSON backend (`matchesInboxFilters`, in memory),
 *  - the Postgres backend (db.ts compiles the same spec to a parameterised WHERE),
 *  - the API (query-string names, `inboxQueryString` / `src/lib/inbox-route.ts`),
 *  - the admin UI (filter state shape).
 * Pure: no DB, no React, no Node APIs — safe to import from client components.
 */

export const INBOX_PAGE_SIZE = 25;
export const INBOX_MAX_PAGE_SIZE = 100;

// Runtime copies of the unions in types.ts; `satisfies` flags any drift.
export const BOOKING_STATUS_VALUES = ["pending", "confirmed", "completed", "cancelled"] as const satisfies readonly Booking["bookingStatus"][];
export const PAYMENT_STATUS_VALUES = ["pending", "verifying", "paid", "failed", "refunded"] as const satisfies readonly Booking["paymentStatus"][];
export const ENQUIRY_STATUS_VALUES = ["new", "contacted", "confirmed", "cancelled"] as const satisfies readonly Enquiry["status"][];
export const ENQUIRY_KINDS = ["contact", "trip-plan", "callback"] as const satisfies readonly EnquiryKind[];

/** Enquiries saved before N-6 have no `kind`; they came from the Contact form. */
export const DEFAULT_ENQUIRY_KIND: EnquiryKind = "contact";
export const enquiryKind = (e: Pick<Enquiry, "kind">): EnquiryKind => e.kind ?? DEFAULT_ENQUIRY_KIND;

// ---------- filter shapes ("" = not filtered) ----------

export type BookingFilters = {
  search: string;
  bookingStatus: "" | Booking["bookingStatus"];
  paymentStatus: "" | Booking["paymentStatus"];
  /** Inclusive IST calendar dates, "YYYY-MM-DD". */
  from: string;
  to: string;
};
export const EMPTY_BOOKING_FILTERS: BookingFilters = { search: "", bookingStatus: "", paymentStatus: "", from: "", to: "" };

export type EnquiryFilters = {
  search: string;
  status: "" | Enquiry["status"];
  kind: "" | EnquiryKind;
  from: string;
  to: string;
};
export const EMPTY_ENQUIRY_FILTERS: EnquiryFilters = { search: "", status: "", kind: "", from: "", to: "" };

/** True when any filter field is set. */
export const hasFilters = (f: Record<string, string>) => Object.values(f).some(v => v !== "");

// ---------- the shared definition ----------

type StringKeys<T> = { [K in keyof T]-?: NonNullable<T[K]> extends string ? K : never }[keyof T] & string;

export interface InboxFilterSpec<T, F> {
  /** Text fields searched case-insensitively for the trimmed query as a substring. */
  searchFields: readonly StringKeys<T>[];
  /** Also search the booking reference: the first BOOKING_REF_LENGTH characters of this field. */
  referenceField?: StringKeys<T>;
  /** Phone field also matched by digits only ("98765 43210" finds "+91-9876543210"). */
  phoneField?: StringKeys<T>;
  /** Exact-match filters: filter key → item field; `ifMissing` is the value of an absent field. */
  equals: readonly { filter: keyof F & string; field: StringKeys<T>; ifMissing?: string }[];
}

export const BOOKING_FILTER_SPEC: InboxFilterSpec<Booking, BookingFilters> = {
  searchFields: ["name", "phone", "email", "city", "packageName"],
  referenceField: "id",
  phoneField: "phone",
  equals: [{ filter: "bookingStatus", field: "bookingStatus" }, { filter: "paymentStatus", field: "paymentStatus" }],
};

export const ENQUIRY_FILTER_SPEC: InboxFilterSpec<Enquiry, EnquiryFilters> = {
  searchFields: ["name", "phone", "email", "message"],
  phoneField: "phone",
  equals: [{ filter: "status", field: "status" }, { filter: "kind", field: "kind", ifMissing: DEFAULT_ENQUIRY_KIND }],
};

export const REFERENCE_LENGTH = BOOKING_REF_LENGTH;

/**
 * The normalised search: `text` is the trimmed, lower-cased query ("" = no search);
 * `digits` is set only when the query looks like a phone number (digits, spaces, + ( ) -)
 * with at least 3 digits.
 */
export function searchTerms(query: string): { text: string; digits: string | null } {
  const trimmed = query.trim();
  const text = trimmed.toLowerCase();
  if (!text || !/^[\d\s+()-]+$/.test(trimmed)) return { text, digits: null };
  const digits = trimmed.replace(/\D/g, "");
  return { text, digits: digits.length >= 3 ? digits : null };
}

const DAY_MS = 86_400_000;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** True for a real calendar date written "YYYY-MM-DD". */
export function isDateKey(s: string): boolean {
  if (!DATE_RE.test(s)) return false;
  const t = Date.parse(`${s}T00:00:00Z`);
  return !Number.isNaN(t) && new Date(t).toISOString().slice(0, 10) === s;
}

/**
 * The received-date range as UTC instants: `start` = 00:00 IST on `from` (inclusive),
 * `end` = 00:00 IST on the day after `to` (exclusive). IST has no DST, so this is exactly
 * "the IST calendar date of createdAt is between from and to, inclusive". Empty bounds are open.
 */
export function istRangeBounds(from: string, to: string): { start: Date | null; end: Date | null } {
  const dayStart = (d: string) => new Date(Date.parse(`${d}T00:00:00.000+05:30`));
  return {
    start: from ? dayStart(from) : null,
    end: to ? new Date(dayStart(to).getTime() + DAY_MS) : null,
  };
}

/** Inclusive IST date range on `createdAt`. With any bound set, an unparseable `createdAt` is excluded. */
export function inDateRange(createdAt: string | null | undefined, from: string, to: string): boolean {
  if (!from && !to) return true;
  const t = createdAt ? Date.parse(createdAt) : NaN;
  if (Number.isNaN(t)) return false;
  const { start, end } = istRangeBounds(from, to);
  return (!start || t >= start.getTime()) && (!end || t < end.getTime());
}

/** The JSON backend's (in-memory) implementation of a spec. db.ts compiles the same spec to SQL. */
export function matchesInboxFilters<T extends { createdAt: string }, F extends { search: string; from: string; to: string }>(
  spec: InboxFilterSpec<T, F>, item: T, filters: F,
): boolean {
  const get = (field: string) => (item as Record<string, unknown>)[field];
  for (const { filter, field, ifMissing } of spec.equals) {
    const want = filters[filter] as unknown as string;
    if (want && (get(field) ?? ifMissing) !== want) return false;
  }
  if (!inDateRange(item.createdAt, filters.from, filters.to)) return false;
  const { text, digits } = searchTerms(filters.search);
  if (!text) return true;
  const has = (v: unknown) => v != null && String(v).toLowerCase().includes(text);
  if (spec.searchFields.some(f => has(get(f)))) return true;
  if (spec.referenceField && has(String(get(spec.referenceField) ?? "").slice(0, REFERENCE_LENGTH))) return true;
  if (digits && spec.phoneField) {
    const phone = get(spec.phoneField);
    if (typeof phone === "string" && phone.replace(/\D/g, "").includes(digits)) return true;
  }
  return false;
}

/** Newest first; unparseable dates last; ties by id descending (same order as the SQL). */
export function compareNewestFirst(a: { id: string; createdAt: string }, b: { id: string; createdAt: string }): number {
  const time = (s: string) => { const t = s ? Date.parse(s) : NaN; return Number.isNaN(t) ? -Infinity : t; };
  const d = time(b.createdAt) - time(a.createdAt);
  if (d) return d;
  return a.id < b.id ? 1 : a.id > b.id ? -1 : 0;
}

// ---------- query string (shared by the admin UI and the API parser) ----------

/** Query-string name of each filter field (`search` is sent as `q`). */
export const filterParam = (key: string) => (key === "search" ? "q" : key);

/** `?q=…&bookingStatus=…&page=2&pageSize=25` with empty filters left out. */
export function inboxQueryString(filters: Record<string, string>, paging?: { page: number; pageSize: number }): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) {
    const value = k === "search" ? v.trim() : v;
    if (value) p.set(filterParam(k), value);
  }
  if (paging) { p.set("page", String(paging.page)); p.set("pageSize", String(paging.pageSize)); }
  const s = p.toString();
  return s ? `?${s}` : "";
}

/** One page of a filtered list (the API envelope). `page` is clamped to the last page. */
export type ListPage<T> = { items: T[]; total: number; page: number; pageSize: number };
