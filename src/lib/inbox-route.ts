import { NextRequest, NextResponse } from "next/server";
import { queryBookings, queryEnquiries, type Paging } from "./db";
import { badRequest, requireAdmin } from "./api";
import type { Booking, Enquiry } from "./types";
import {
  BOOKING_STATUS_VALUES, EMPTY_BOOKING_FILTERS, EMPTY_ENQUIRY_FILTERS, ENQUIRY_KINDS, ENQUIRY_STATUS_VALUES,
  INBOX_MAX_PAGE_SIZE, INBOX_PAGE_SIZE, PAYMENT_STATUS_VALUES, filterParam, isDateKey,
  type BookingFilters, type EnquiryFilters, type ListPage,
} from "./inbox-filters";
import { EXPORT_ROW_LIMIT, bookingsCsv, csvFilename, enquiriesCsv } from "./inbox-csv";

/**
 * Review point #6: query-string parsing and the GET / export handlers for the admin
 * `/api/bookings` and `/api/enquiries` lists. Filter semantics: `src/lib/inbox-filters.ts`.
 *
 * Params (all optional): `q` (≤ 200 chars), `from`/`to` (YYYY-MM-DD, inclusive IST dates),
 * `page` (≥ 1), `pageSize` (1–100, default 25), plus `bookingStatus`/`paymentStatus`
 * (bookings) or `status`/`kind` (enquiries). An empty value means "not filtered"; an
 * unknown param is ignored; a bad value is a 400.
 */

const SEARCH_MAX = 200;
const MAX_PAGE = 1_000_000;
const PAGING_PARAMS = ["page", "pageSize"] as const;

type Filters = Record<string, string> & { search: string; from: string; to: string };

interface InboxList<T, F extends Filters> {
  name: "bookings" | "enquiries";
  empty: F;
  /** Allowed values of each enum filter. */
  enums: Record<string, readonly string[]>;
  query: (filters: F, paging: Paging) => Promise<ListPage<T>>;
  csv: (rows: readonly T[]) => string;
}

export const BOOKINGS_LIST: InboxList<Booking, BookingFilters> = {
  name: "bookings", empty: EMPTY_BOOKING_FILTERS, query: queryBookings, csv: bookingsCsv,
  enums: { bookingStatus: BOOKING_STATUS_VALUES, paymentStatus: PAYMENT_STATUS_VALUES },
};

export const ENQUIRIES_LIST: InboxList<Enquiry, EnquiryFilters> = {
  name: "enquiries", empty: EMPTY_ENQUIRY_FILTERS, query: queryEnquiries, csv: enquiriesCsv,
  enums: { status: ENQUIRY_STATUS_VALUES, kind: ENQUIRY_KINDS },
};

export function parseFilters<T, F extends Filters>(list: InboxList<T, F>, params: URLSearchParams): F {
  const out: Record<string, string> = { ...list.empty };
  for (const key of Object.keys(list.empty)) {
    const name = filterParam(key);
    const raw = params.get(name);
    if (raw === null || raw === "") continue;
    if (key === "search") {
      if (raw.length > SEARCH_MAX) throw badRequest(`q must be at most ${SEARCH_MAX} characters`);
    } else if (key === "from" || key === "to") {
      if (!isDateKey(raw)) throw badRequest(`${name} must be a date (YYYY-MM-DD)`);
    } else {
      const allowed = list.enums[key];
      if (!allowed.includes(raw)) throw badRequest(`${name} must be one of: ${allowed.join(", ")}`);
    }
    out[key] = raw;
  }
  return out as F;
}

function parseIntParam(params: URLSearchParams, name: string, fallback: number, max: number): number {
  const raw = params.get(name);
  if (raw === null || raw === "") return fallback;
  const n = /^\d+$/.test(raw) ? Number(raw) : NaN;
  if (!(n >= 1 && n <= max)) throw badRequest(`${name} must be a whole number from 1 to ${max}`);
  return n;
}

export function parsePaging(params: URLSearchParams): Paging {
  return {
    page: parseIntParam(params, "page", 1, MAX_PAGE),
    pageSize: parseIntParam(params, "pageSize", INBOX_PAGE_SIZE, INBOX_MAX_PAGE_SIZE),
  };
}

/** True when the request carries any list param (a filter or paging) → envelope response. */
function wantsEnvelope(empty: Filters, params: URLSearchParams): boolean {
  return [...Object.keys(empty).map(filterParam), ...PAGING_PARAMS].some(n => params.has(n));
}

/**
 * Admin-only GET. With no list params: the bare array of every row (unchanged contract).
 * With any list param: `{ items, total, page, pageSize }`, newest first.
 */
export async function inboxList<T, F extends Filters>(req: NextRequest, list: InboxList<T, F>, listAll: () => Promise<T[]>): Promise<Response> {
  await requireAdmin();
  const params = req.nextUrl.searchParams;
  if (!wantsEnvelope(list.empty, params)) return NextResponse.json(await listAll());
  const filters = parseFilters(list, params);
  return NextResponse.json(await list.query(filters, parsePaging(params)));
}

/**
 * Admin-only CSV export of the rows matching the filters (paging params are ignored),
 * newest first, at most EXPORT_ROW_LIMIT rows. Headers: `X-Total-Count` (matching rows),
 * `X-Export-Rows` (rows in the file) and `X-Export-Truncated: true` when the file was cut.
 */
export async function inboxExport<T, F extends Filters>(req: NextRequest, list: InboxList<T, F>): Promise<Response> {
  await requireAdmin();
  const filters = parseFilters(list, req.nextUrl.searchParams);
  const { items, total } = await list.query(filters, { page: 1, pageSize: EXPORT_ROW_LIMIT });
  const headers: Record<string, string> = {
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": `attachment; filename="${csvFilename(list.name, new Date())}"`,
    "Cache-Control": "no-store",
    "X-Total-Count": String(total),
    "X-Export-Rows": String(items.length),
  };
  if (total > items.length) headers["X-Export-Truncated"] = "true";
  return new Response(list.csv(items), { status: 200, headers });
}
