import type { Booking, Enquiry, EnquiryKind } from "./types";
import { bookingReference } from "./booking-ref";
import { istDateKey } from "./visibility";
import { enquiryKind } from "./inbox-filters";

/**
 * CSV export of the admin Bookings / Enquiries lists (N-1, moved server-side in review
 * point #6). Used by `GET /api/bookings/export` and `/api/enquiries/export`; pure, so the
 * admin UI shares the date/label helpers.
 */

/** Most rows one export returns; the response says when it was cut (X-Export-Truncated). */
export const EXPORT_ROW_LIMIT = 10_000;

export const ENQUIRY_KIND_LABELS: Record<EnquiryKind, string> = { contact: "Contact", "trip-plan": "Trip plan", callback: "Callback" };

/** "YYYY-MM-DD HH:MM" in IST, for the table and the CSV ("" if unparseable). */
export function istDateTime(iso: string | null | undefined): string {
  const t = iso ? Date.parse(iso) : NaN;
  if (Number.isNaN(t)) return "";
  return new Date(t + 330 * 60 * 1000).toISOString().slice(0, 16).replace("T", " ");
}

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

export function bookingsCsv(bookings: readonly Booking[]): string {
  return toCsv(
    ["Reference", "Booking ID", "Received (IST)", "Name", "Phone", "Email", "City", "Package ID", "Package", "Travel Date", "Travelers", "Amount (INR)", "Payment Status", "utr", "payment_submitted_at", "Booking Status"],
    bookings.map(b => [
      bookingReference(b.id), b.id, istDateTime(b.createdAt), b.name, b.phone, b.email, b.city,
      b.packageId, b.packageName, b.travelDate, b.travelers, b.amount, b.paymentStatus, b.utr, b.paymentSubmittedAt ? istDateTime(b.paymentSubmittedAt) : "", b.bookingStatus,
    ]),
  );
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
