import { describe, expect, it } from "vitest";
import {
  BOOKING_FILTER_SPEC, EMPTY_BOOKING_FILTERS, EMPTY_ENQUIRY_FILTERS, ENQUIRY_FILTER_SPEC,
  compareNewestFirst, hasFilters, inDateRange, inboxQueryString, isDateKey, istRangeBounds, matchesInboxFilters, searchTerms,
  type BookingFilters, type EnquiryFilters,
} from "@/lib/inbox-filters";
import type { Booking, Enquiry } from "@/lib/types";
import { booking, enquiry } from "../helpers/inbox-fixtures";

// Review point #6: the shared filter definition (ported from the N-1 admin-table tests).
// tests/pg/inbox.test.ts runs the same cases through the Postgres compilation of the spec.

const filterBookings = (list: Booking[], f: BookingFilters) =>
  list.filter(b => matchesInboxFilters(BOOKING_FILTER_SPEC, b, f)).sort(compareNewestFirst);
const filterEnquiries = (list: Enquiry[], f: EnquiryFilters) =>
  list.filter(e => matchesInboxFilters(ENQUIRY_FILTER_SPEC, e, f)).sort(compareNewestFirst);

describe("compareNewestFirst", () => {
  it("sorts by createdAt descending, unparseable last, ties by id descending", () => {
    const items = [
      { id: "a", createdAt: "2026-01-01T00:00:00Z" },
      { id: "bad", createdAt: "nope" },
      { id: "c", createdAt: "2026-03-01T00:00:00Z" },
      { id: "d", createdAt: "2026-01-01T00:00:00Z" },
    ];
    expect([...items].sort(compareNewestFirst).map(i => i.id)).toEqual(["c", "d", "a", "bad"]);
  });
});

describe("inDateRange (IST calendar date, inclusive)", () => {
  it("is open when both bounds are empty", () => {
    expect(inDateRange("garbage", "", "")).toBe(true);
  });

  it("uses the IST date, not the UTC date", () => {
    // 2026-11-10 20:00 UTC = 2026-11-11 01:30 IST
    const late = "2026-11-10T20:00:00.000Z";
    expect(inDateRange(late, "2026-11-11", "2026-11-11")).toBe(true);
    expect(inDateRange(late, "2026-11-10", "2026-11-10")).toBe(false);
  });

  it("includes both bounds to the minute (00:00 IST start, 23:59:59.999 IST end)", () => {
    expect(inDateRange("2026-11-09T18:30:00.000Z", "2026-11-10", "2026-11-10")).toBe(true); // 00:00 IST on the 10th
    expect(inDateRange("2026-11-09T18:29:59.999Z", "2026-11-10", "2026-11-10")).toBe(false);
    expect(inDateRange("2026-11-10T18:29:59.999Z", "2026-11-10", "2026-11-10")).toBe(true); // 23:59:59.999 IST
    expect(inDateRange("2026-11-10T18:30:00.000Z", "2026-11-10", "2026-11-10")).toBe(false);
  });

  it("includes both bounds", () => {
    expect(inDateRange("2026-11-10T06:00:00Z", "2026-11-10", "")).toBe(true);
    expect(inDateRange("2026-11-10T06:00:00Z", "", "2026-11-10")).toBe(true);
    expect(inDateRange("2026-11-10T06:00:00Z", "2026-11-11", "")).toBe(false);
    expect(inDateRange("2026-11-10T06:00:00Z", "", "2026-11-09")).toBe(false);
  });

  it("excludes unparseable dates once a bound is set", () => {
    expect(inDateRange("nope", "2026-01-01", "")).toBe(false);
  });

  it("computes the UTC bounds", () => {
    const { start, end } = istRangeBounds("2026-11-10", "2026-11-12");
    expect(start?.toISOString()).toBe("2026-11-09T18:30:00.000Z");
    expect(end?.toISOString()).toBe("2026-11-12T18:30:00.000Z");
    expect(istRangeBounds("", "")).toEqual({ start: null, end: null });
  });
});

describe("isDateKey", () => {
  it("accepts real YYYY-MM-DD dates only", () => {
    expect(isDateKey("2026-11-18")).toBe(true);
    expect(isDateKey("2024-02-29")).toBe(true);
    expect(isDateKey("2026-02-30")).toBe(false);
    expect(isDateKey("2026-1-1")).toBe(false);
    expect(isDateKey("18/11/2026")).toBe(false);
  });
});

describe("searchTerms", () => {
  it("trims, lower-cases and extracts phone digits", () => {
    expect(searchTerms("  RAHUL ")).toEqual({ text: "rahul", digits: null });
    expect(searchTerms("98765 43210")).toEqual({ text: "98765 43210", digits: "9876543210" });
    expect(searchTerms("+91")).toEqual({ text: "+91", digits: null }); // fewer than 3 digits
    expect(searchTerms("")).toEqual({ text: "", digits: null });
  });
});

describe("booking filters", () => {
  const list = [
    booking({ id: "aaaaaaaa-1111-4000-8000-000000000001", name: "Rahul Sharma", createdAt: "2026-11-01T06:00:00Z" }),
    booking({ id: "bbbbbbbb-2222-4000-8000-000000000002", name: "Priya Patel", city: "Mumbai", phone: "9123456789", email: "p@x.in", packageName: "Royal Rajasthan Explorer", bookingStatus: "confirmed", paymentStatus: "paid", createdAt: "2026-11-05T06:00:00Z" }),
    booking({ id: "cccccccc-3333-4000-8000-000000000003", name: "Amit Kumar", city: "Kolkata", phone: "9000000000", email: "a@x.in", packageName: "Sacred Odisha Pilgrimage", bookingStatus: "cancelled", createdAt: "2026-11-09T06:00:00Z" }),
  ];
  const f = (over: Partial<BookingFilters>) => filterBookings(list, { ...EMPTY_BOOKING_FILTERS, ...over }).map(b => b.name);

  it("returns everything newest first with no filters", () => {
    expect(f({})).toEqual(["Amit Kumar", "Priya Patel", "Rahul Sharma"]);
  });

  it("searches name, email, city, package and reference case-insensitively", () => {
    expect(f({ search: "PRIYA" })).toEqual(["Priya Patel"]);
    expect(f({ search: "mumbai" })).toEqual(["Priya Patel"]);
    expect(f({ search: "odisha" })).toEqual(["Amit Kumar"]);
    expect(f({ search: "a@x.in" })).toEqual(["Amit Kumar"]);
    expect(f({ search: "BBBBBBBB" })).toEqual(["Priya Patel"]);
    expect(f({ search: "  rahul  " })).toEqual(["Rahul Sharma"]);
    expect(f({ search: "nobody" })).toEqual([]);
  });

  it("matches the reference only within its first 8 characters", () => {
    expect(f({ search: "2222" })).toEqual([]); // later in the id, not part of the reference
  });

  it("matches phone numbers by digits", () => {
    expect(f({ search: "98765 43210" })).toEqual(["Rahul Sharma"]);
    expect(f({ search: "+91 9123" })).toEqual([]); // "919123" is not in Priya's digits
    expect(f({ search: "912345" })).toEqual(["Priya Patel"]);
  });

  it("filters by booking and payment status", () => {
    expect(f({ bookingStatus: "cancelled" })).toEqual(["Amit Kumar"]);
    expect(f({ paymentStatus: "paid" })).toEqual(["Priya Patel"]);
    expect(f({ paymentStatus: "pending", bookingStatus: "pending" })).toEqual(["Rahul Sharma"]);
  });

  it("filters by received date range", () => {
    expect(f({ from: "2026-11-05" })).toEqual(["Amit Kumar", "Priya Patel"]);
    expect(f({ from: "2026-11-02", to: "2026-11-08" })).toEqual(["Priya Patel"]);
  });
});

describe("enquiry filters", () => {
  const list = [
    enquiry({ id: "e1", name: "Old Contact", createdAt: "2026-10-01T06:00:00Z" }),
    enquiry({ id: "e2", name: "Trip", kind: "trip-plan", message: "Destinations: Varanasi\nBudget: 50000", status: "contacted", createdAt: "2026-11-01T06:00:00Z" }),
    enquiry({ id: "e3", name: "Call me", kind: "callback", message: "Slot: evening", createdAt: "2026-11-02T06:00:00Z" }),
    enquiry({ id: "e4", name: "New Contact", kind: "contact", createdAt: "2026-09-01T06:00:00Z" }),
  ];
  const f = (over: Partial<EnquiryFilters>) => filterEnquiries(list, { ...EMPTY_ENQUIRY_FILTERS, ...over }).map(e => e.id);

  it("sorts newest first", () => {
    expect(f({})).toEqual(["e3", "e2", "e1", "e4"]);
  });

  it("treats a missing kind as contact", () => {
    expect(f({ kind: "contact" })).toEqual(["e1", "e4"]);
    expect(f({ kind: "trip-plan" })).toEqual(["e2"]);
    expect(f({ kind: "callback" })).toEqual(["e3"]);
  });

  it("searches the message and filters by status and date", () => {
    expect(f({ search: "budget" })).toEqual(["e2"]);
    expect(f({ status: "contacted" })).toEqual(["e2"]);
    expect(f({ to: "2026-10-31" })).toEqual(["e1", "e4"]);
  });

  it("treats % and _ in the search as plain characters", () => {
    expect(f({ search: "%" })).toEqual([]);
    expect(f({ search: "_" })).toEqual([]);
  });
});

describe("hasFilters / inboxQueryString", () => {
  it("is false for the empty filters and true once any field is set", () => {
    expect(hasFilters(EMPTY_BOOKING_FILTERS)).toBe(false);
    expect(hasFilters({ ...EMPTY_ENQUIRY_FILTERS, kind: "callback" })).toBe(true);
  });

  it("sends search as q, omits empty filters and adds paging", () => {
    expect(inboxQueryString(EMPTY_BOOKING_FILTERS)).toBe("");
    expect(inboxQueryString({ ...EMPTY_BOOKING_FILTERS, search: " a&b ", paymentStatus: "paid" }, { page: 2, pageSize: 25 }))
      .toBe("?q=a%26b&paymentStatus=paid&page=2&pageSize=25");
  });
});
