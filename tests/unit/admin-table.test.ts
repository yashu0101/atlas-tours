import { describe, expect, it } from "vitest";
import {
  PAGE_SIZE,
  bookingsCsv,
  csvCell,
  csvFilename,
  enquiriesCsv,
  EMPTY_BOOKING_FILTERS,
  EMPTY_ENQUIRY_FILTERS,
  filterBookings,
  filterEnquiries,
  hasFilters,
  inDateRange,
  istDateTime,
  newestFirst,
  paginate,
  reviewFilterCounts,
  reviewFilterMatches,
  showingLabel,
  toCsv,
} from "@/app/admin/_lib/table";
import type { Booking, Enquiry, Review } from "@/lib/types";

const booking = (over: Partial<Booking>): Booking => ({
  id: "3f9a2c1b-0000-4000-8000-000000000001",
  name: "Rahul Sharma",
  phone: "+91 98765 43210",
  email: "rahul@example.com",
  city: "Delhi",
  packageId: "pkg-varanasi",
  packageName: "Divine Varanasi & Prayagraj",
  travelers: 2,
  travelDate: "2026-12-01",
  amount: 25998,
  paymentStatus: "pending",
  bookingStatus: "pending",
  createdAt: "2026-11-10T06:00:00.000Z",
  ...over,
});

const enquiry = (over: Partial<Enquiry>): Enquiry => ({
  id: "enq-1",
  name: "Priya Patel",
  phone: "9123456789",
  email: "priya@example.com",
  travelers: 3,
  travelDate: "2026-12-20",
  message: "Need a hotel near the ghats",
  status: "new",
  createdAt: "2026-11-10T06:00:00.000Z",
  ...over,
});

describe("newestFirst", () => {
  it("sorts by createdAt descending without mutating, unparseable last", () => {
    const items = [
      { id: "a", createdAt: "2026-01-01T00:00:00Z" },
      { id: "bad", createdAt: "nope" },
      { id: "c", createdAt: "2026-03-01T00:00:00Z" },
    ];
    expect(newestFirst(items).map(i => i.id)).toEqual(["c", "a", "bad"]);
    expect(items.map(i => i.id)).toEqual(["a", "bad", "c"]);
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

  it("includes both bounds", () => {
    expect(inDateRange("2026-11-10T06:00:00Z", "2026-11-10", "")).toBe(true);
    expect(inDateRange("2026-11-10T06:00:00Z", "", "2026-11-10")).toBe(true);
    expect(inDateRange("2026-11-10T06:00:00Z", "2026-11-11", "")).toBe(false);
    expect(inDateRange("2026-11-10T06:00:00Z", "", "2026-11-09")).toBe(false);
  });

  it("excludes unparseable dates once a bound is set", () => {
    expect(inDateRange("nope", "2026-01-01", "")).toBe(false);
  });

  it("istDateTime formats in IST", () => {
    expect(istDateTime("2026-11-10T20:00:00.000Z")).toBe("2026-11-11 01:30");
    expect(istDateTime("nope")).toBe("");
  });
});

describe("filterBookings", () => {
  const list = [
    booking({ id: "aaaaaaaa-1111-4000-8000-000000000001", name: "Rahul Sharma", createdAt: "2026-11-01T06:00:00Z" }),
    booking({ id: "bbbbbbbb-2222-4000-8000-000000000002", name: "Priya Patel", city: "Mumbai", phone: "9123456789", email: "p@x.in", packageName: "Royal Rajasthan Explorer", bookingStatus: "confirmed", paymentStatus: "paid", createdAt: "2026-11-05T06:00:00Z" }),
    booking({ id: "cccccccc-3333-4000-8000-000000000003", name: "Amit Kumar", city: "Kolkata", phone: "9000000000", email: "a@x.in", packageName: "Sacred Odisha Pilgrimage", bookingStatus: "cancelled", createdAt: "2026-11-09T06:00:00Z" }),
  ];
  const f = (over: Partial<typeof EMPTY_BOOKING_FILTERS>) => filterBookings(list, { ...EMPTY_BOOKING_FILTERS, ...over }).map(b => b.name);

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

describe("filterEnquiries", () => {
  const list = [
    enquiry({ id: "e1", name: "Old Contact", createdAt: "2026-10-01T06:00:00Z" }),
    enquiry({ id: "e2", name: "Trip", kind: "trip-plan", message: "Destinations: Varanasi\nBudget: 50000", status: "contacted", createdAt: "2026-11-01T06:00:00Z" }),
    enquiry({ id: "e3", name: "Call me", kind: "callback", message: "Slot: evening", createdAt: "2026-11-02T06:00:00Z" }),
  ];
  const f = (over: Partial<typeof EMPTY_ENQUIRY_FILTERS>) => filterEnquiries(list, { ...EMPTY_ENQUIRY_FILTERS, ...over }).map(e => e.id);

  it("sorts newest first", () => {
    expect(f({})).toEqual(["e3", "e2", "e1"]);
  });

  it("treats a missing kind as contact", () => {
    expect(f({ kind: "contact" })).toEqual(["e1"]);
    expect(f({ kind: "trip-plan" })).toEqual(["e2"]);
    expect(f({ kind: "callback" })).toEqual(["e3"]);
  });

  it("searches the message and filters by status and date", () => {
    expect(f({ search: "budget" })).toEqual(["e2"]);
    expect(f({ status: "contacted" })).toEqual(["e2"]);
    expect(f({ to: "2026-10-31" })).toEqual(["e1"]);
  });
});

describe("hasFilters", () => {
  it("is false for the empty filters and true once any field is set", () => {
    expect(hasFilters(EMPTY_BOOKING_FILTERS)).toBe(false);
    expect(hasFilters({ ...EMPTY_ENQUIRY_FILTERS, kind: "callback" })).toBe(true);
  });
});

describe("paginate", () => {
  const items = Array.from({ length: 80 }, (_, i) => i + 1);

  it("slices 25 per page with a 1-based label", () => {
    const p1 = paginate(items, 1);
    expect(PAGE_SIZE).toBe(25);
    expect(p1.rows).toHaveLength(25);
    expect(p1.pageCount).toBe(4);
    expect(showingLabel(p1)).toBe("Showing 1–25 of 80");
    const p4 = paginate(items, 4);
    expect(p4.rows).toEqual([76, 77, 78, 79, 80]);
    expect(showingLabel(p4)).toBe("Showing 76–80 of 80");
  });

  it("clamps the page (e.g. after rows were deleted)", () => {
    expect(paginate(items, 9).page).toBe(4);
    expect(paginate(items, 0).page).toBe(1);
    expect(paginate(items.slice(0, 10), 3).rows).toHaveLength(10);
  });

  it("handles an empty list", () => {
    const p = paginate([], 1);
    expect(p).toMatchObject({ rows: [], page: 1, pageCount: 1, total: 0, first: 0, last: 0 });
    expect(showingLabel(p)).toBe("Showing 0 of 0");
  });
});

describe("CSV", () => {
  it("quotes per RFC 4180", () => {
    expect(csvCell("plain")).toBe("plain");
    expect(csvCell("a,b")).toBe('"a,b"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell("line1\nline2")).toBe('"line1\nline2"');
    expect(csvCell(undefined)).toBe("");
    expect(csvCell(null)).toBe("");
    expect(csvCell(42)).toBe("42");
  });

  it("guards against formula injection", () => {
    expect(csvCell("=HYPERLINK(\"x\")")).toBe("\"'=HYPERLINK(\"\"x\"\")\"");
    expect(csvCell("+91 98765")).toBe("'+91 98765");
    expect(csvCell("-2+3")).toBe("'-2+3");
    expect(csvCell("@SUM(A1)")).toBe("'@SUM(A1)");
    expect(csvCell("\tcmd")).toBe("'\tcmd");
    expect(csvCell("\rcmd")).toBe("\"'\rcmd\"");
    expect(csvCell("a=b")).toBe("a=b");
  });

  it("starts with a BOM and uses CRLF rows", () => {
    const csv = toCsv(["A", "B"], [["1", "₹ यात्रा"], ["x,y", 2]]);
    expect(csv.startsWith("﻿")).toBe(true);
    expect(csv).toBe("﻿A,B\r\n1,₹ यात्रा\r\n\"x,y\",2\r\n");
  });

  it("names files with the IST date", () => {
    expect(csvFilename("bookings", new Date("2026-11-18T20:00:00Z"))).toBe("atlas-bookings-2026-11-19.csv");
    expect(csvFilename("enquiries", new Date("2026-11-18T06:00:00Z"))).toBe("atlas-enquiries-2026-11-18.csv");
  });

  it("exports bookings with reference, received date and all fields", () => {
    const csv = bookingsCsv([booking({ city: "Delhi, NCR" })]);
    const [header, row] = csv.slice(1).split("\r\n");
    expect(header).toBe("Reference,Booking ID,Received (IST),Name,Phone,Email,City,Package ID,Package,Travel Date,Travelers,Amount (INR),Payment Status,Booking Status");
    expect(row).toBe("3F9A2C1B,3f9a2c1b-0000-4000-8000-000000000001,2026-11-10 11:30,Rahul Sharma,'+91 98765 43210,rahul@example.com,\"Delhi, NCR\",pkg-varanasi,Divine Varanasi & Prayagraj,2026-12-01,2,25998,pending,pending");
  });

  it("exports enquiries with type and the multi-line message quoted", () => {
    const csv = enquiriesCsv([enquiry({}), enquiry({ id: "e2", kind: "trip-plan", message: "Destinations: Varanasi\nBudget: 50000" })]);
    const lines = csv.slice(1).split("\r\n");
    expect(lines[0]).toBe("Enquiry ID,Received (IST),Type,Name,Phone,Email,Package ID,Travelers,Travel Date,Status,Message");
    expect(lines[1]).toBe("enq-1,2026-11-10 11:30,Contact,Priya Patel,9123456789,priya@example.com,,3,2026-12-20,new,Need a hotel near the ghats");
    expect(lines[2]).toBe("e2,2026-11-10 11:30,Trip plan,Priya Patel,9123456789,priya@example.com,,3,2026-12-20,new,\"Destinations: Varanasi\nBudget: 50000\"");
  });
});

describe("review moderation filters", () => {
  const review = (over: Partial<Review>): Review => ({
    id: "r", name: "N", rating: 5, text: "t", city: "c", active: true, createdAt: "2026-01-01T00:00:00Z", ...over,
  });
  const reviews = [
    review({ id: "admin-active" }),
    review({ id: "admin-inactive", active: false }),
    review({ id: "customer-waiting", source: "customer", active: false }),
    review({ id: "customer-approved", source: "customer", active: true }),
  ];

  it("partitions reviews into awaiting / active / inactive", () => {
    const ids = (f: Parameters<typeof reviewFilterMatches>[1]) => reviews.filter(r => reviewFilterMatches(r, f)).map(r => r.id);
    expect(ids("all")).toHaveLength(4);
    expect(ids("awaiting")).toEqual(["customer-waiting"]);
    expect(ids("active")).toEqual(["admin-active", "customer-approved"]);
    expect(ids("inactive")).toEqual(["admin-inactive"]);
  });

  it("counts each filter", () => {
    expect(reviewFilterCounts(reviews)).toEqual({ all: 4, awaiting: 1, active: 2, inactive: 1 });
  });
});
