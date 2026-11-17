import type { Booking, Enquiry, EnquiryKind, Review } from "@/lib/types";
import { bookingReference } from "@/lib/booking-ref";
import { istDateKey } from "@/lib/visibility";

/**
 * N-1: pure list logic for the admin Bookings / Enquiries tables (search, filters, IST date
 * range, newest-first sort, pagination, CSV export) and the N-5 review moderation filter.
 * No React, no DOM: unit-tested in tests/unit/admin-table.test.ts.
 */

export const PAGE_SIZE = 25;

// ---------- generic helpers ----------

/** Newest first, without mutating the input. Unparseable dates sort last. */
export function newestFirst<T extends { createdAt: string }>(items: readonly T[]): T[] {
  const time = (s: string) => { const t = Date.parse(s); return Number.isNaN(t) ? -Infinity : t; };
  return [...items].sort((a, b) => time(b.createdAt) - time(a.createdAt));
}

/** Case-insensitive substring match of `query` against any of `fields`. An empty query matches everything. */
export function matchesSearch(fields: readonly (string | number | undefined | null)[], query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return fields.some(f => f != null && String(f).toLowerCase().includes(q));
}

/** Phone numbers also match by digits only, so "98765 43210" finds "+91-9876543210". */
function matchesPhone(phone: string | undefined, query: string): boolean {
  if (!phone || !/^[\d\s+()-]+$/.test(query.trim())) return false;
  const digits = query.replace(/\D/g, "");
  return digits.length >= 3 && phone.replace(/\D/g, "").includes(digits);
}

/** The IST calendar date ("YYYY-MM-DD") an ISO timestamp falls on, or null if unparseable. */
export function istDateOf(iso: string): string | null {
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : istDateKey(new Date(t));
}

/** "YYYY-MM-DD HH:MM" in IST, for the table and the CSV ("" if unparseable). */
export function istDateTime(iso: string): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "";
  return new Date(t + 330 * 60 * 1000).toISOString().slice(0, 16).replace("T", " ");
}

/**
 * Inclusive "received from / to" range on the IST calendar date of `createdAt`.
 * Empty bounds are open. With any bound set, an unparseable `createdAt` is excluded.
 */
export function inDateRange(createdAt: string, from: string, to: string): boolean {
  if (!from && !to) return true;
  const day = istDateOf(createdAt);
  if (!day) return false;
  if (from && day < from) return false;
  if (to && day > to) return false;
  return true;
}

export type PageSlice<T> = {
  rows: T[];
  /** Current page, clamped to 1..pageCount. */
  page: number;
  pageCount: number;
  total: number;
  /** 1-based index of the first row shown (0 when empty) and of the last row shown. */
  first: number;
  last: number;
};

export function paginate<T>(items: readonly T[], page: number, pageSize = PAGE_SIZE): PageSlice<T> {
  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(1, Math.floor(page) || 1), pageCount);
  const start = (current - 1) * pageSize;
  const rows = items.slice(start, start + pageSize);
  return { rows, page: current, pageCount, total, first: total ? start + 1 : 0, last: start + rows.length };
}

/** "Showing 1–25 of 80" (en dash). */
export const showingLabel = ({ first, last, total }: PageSlice<unknown>) =>
  total ? `Showing ${first}–${last} of ${total}` : "Showing 0 of 0";

/** True when any filter field is set (shows the "Clear" button). */
export const hasFilters = (f: Record<string, string>) => Object.values(f).some(v => v !== "");

// ---------- CSV ----------

/**
 * One CSV cell. Strings starting with `=`, `+`, `-`, `@`, tab or CR get a leading `'` so a
 * spreadsheet never evaluates them as a formula (CSV injection). Then RFC 4180 quoting: a cell
 * containing `"`, `,`, CR or LF is wrapped in quotes with inner quotes doubled.
 */
export function csvCell(value: string | number | boolean | null | undefined): string {
  if (value == null) return "";
  let s = String(value);
  if (typeof value === "string" && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** A whole CSV document: UTF-8 BOM (so Excel reads ₹ / Hindi correctly), CRLF row endings. */
export function toCsv(headers: readonly string[], rows: readonly (readonly (string | number | boolean | null | undefined)[])[]): string {
  return "﻿" + [headers, ...rows].map(r => r.map(csvCell).join(",")).join("\r\n") + "\r\n";
}

/** e.g. `atlas-bookings-2026-11-18.csv` (IST date). */
export const csvFilename = (name: "bookings" | "enquiries", now: Date) => `atlas-${name}-${istDateKey(now)}.csv`;

// ---------- bookings ----------

export type BookingFilters = {
  search: string;
  bookingStatus: "" | Booking["bookingStatus"];
  paymentStatus: "" | Booking["paymentStatus"];
  from: string;
  to: string;
};

export const EMPTY_BOOKING_FILTERS: BookingFilters = { search: "", bookingStatus: "", paymentStatus: "", from: "", to: "" };

export function bookingMatchesSearch(b: Booking, query: string): boolean {
  return matchesSearch([b.name, b.phone, b.email, b.city, b.packageName, bookingReference(b.id)], query)
    || matchesPhone(b.phone, query);
}

/** Filtered and sorted newest first. */
export function filterBookings(bookings: readonly Booking[], f: BookingFilters): Booking[] {
  return newestFirst(bookings.filter(b =>
    (!f.bookingStatus || b.bookingStatus === f.bookingStatus)
    && (!f.paymentStatus || b.paymentStatus === f.paymentStatus)
    && inDateRange(b.createdAt, f.from, f.to)
    && bookingMatchesSearch(b, f.search),
  ));
}

export function bookingsCsv(bookings: readonly Booking[]): string {
  return toCsv(
    ["Reference", "Booking ID", "Received (IST)", "Name", "Phone", "Email", "City", "Package ID", "Package", "Travel Date", "Travelers", "Amount (INR)", "Payment Status", "Booking Status"],
    bookings.map(b => [
      bookingReference(b.id), b.id, istDateTime(b.createdAt), b.name, b.phone, b.email, b.city,
      b.packageId, b.packageName, b.travelDate, b.travelers, b.amount, b.paymentStatus, b.bookingStatus,
    ]),
  );
}

// ---------- enquiries ----------

export const ENQUIRY_KINDS = ["contact", "trip-plan", "callback"] as const satisfies readonly EnquiryKind[];
export const ENQUIRY_KIND_LABELS: Record<EnquiryKind, string> = { contact: "Contact", "trip-plan": "Trip plan", callback: "Callback" };
/** Enquiries saved before N-6 have no `kind`; they came from the Contact form. */
export const enquiryKind = (e: Enquiry): EnquiryKind => e.kind ?? "contact";

export type EnquiryFilters = {
  search: string;
  status: "" | Enquiry["status"];
  kind: "" | EnquiryKind;
  from: string;
  to: string;
};

export const EMPTY_ENQUIRY_FILTERS: EnquiryFilters = { search: "", status: "", kind: "", from: "", to: "" };

export function enquiryMatchesSearch(e: Enquiry, query: string): boolean {
  return matchesSearch([e.name, e.phone, e.email, e.message], query) || matchesPhone(e.phone, query);
}

/** Filtered and sorted newest first. */
export function filterEnquiries(enquiries: readonly Enquiry[], f: EnquiryFilters): Enquiry[] {
  return newestFirst(enquiries.filter(e =>
    (!f.status || e.status === f.status)
    && (!f.kind || enquiryKind(e) === f.kind)
    && inDateRange(e.createdAt, f.from, f.to)
    && enquiryMatchesSearch(e, f.search),
  ));
}

export function enquiriesCsv(enquiries: readonly Enquiry[]): string {
  return toCsv(
    ["Enquiry ID", "Received (IST)", "Type", "Name", "Phone", "Email", "Package ID", "Travelers", "Travel Date", "Status", "Message"],
    enquiries.map(e => [
      e.id, istDateTime(e.createdAt), ENQUIRY_KIND_LABELS[enquiryKind(e)], e.name, e.phone, e.email,
      e.packageId, e.travelers, e.travelDate, e.status, e.message,
    ]),
  );
}

// ---------- reviews (N-5 moderation) ----------

export type ReviewFilter = "all" | "awaiting" | "active" | "inactive";
export const REVIEW_FILTERS: readonly ReviewFilter[] = ["all", "awaiting", "active", "inactive"];
export const REVIEW_FILTER_LABELS: Record<ReviewFilter, string> = { all: "All", awaiting: "Awaiting approval", active: "Active", inactive: "Inactive" };

/** Same rule as the public site (`isPublicReview`): only an explicit `false` hides a review. */
export const isReviewActive = (r: Review) => r.active !== false;
/** A customer-submitted review that has not been activated yet. */
export const isAwaitingApproval = (r: Review) => r.source === "customer" && !isReviewActive(r);

/** The three non-"all" filters partition the list: awaiting, active, other inactive. */
export function reviewFilterMatches(r: Review, filter: ReviewFilter): boolean {
  switch (filter) {
    case "all": return true;
    case "awaiting": return isAwaitingApproval(r);
    case "active": return isReviewActive(r);
    case "inactive": return !isReviewActive(r) && !isAwaitingApproval(r);
  }
}

export function reviewFilterCounts(reviews: readonly Review[]): Record<ReviewFilter, number> {
  const counts = { all: 0, awaiting: 0, active: 0, inactive: 0 };
  for (const r of reviews) for (const f of REVIEW_FILTERS) if (reviewFilterMatches(r, f)) counts[f]++;
  return counts;
}
