import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { useTempDb } from "../helpers/temp-db";
import { booking, enquiry } from "../helpers/inbox-fixtures";
import type { Booking, Enquiry } from "@/lib/types";

// Review point #6: GET /api/bookings|enquiries with list params, the CSV exports and the
// admin summary, against a temp JSON database.

const session = vi.hoisted(() => ({ token: undefined as string | undefined }));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (name === "admin_session" && session.token ? { name, value: session.token } : undefined),
  }),
}));

// 30 bookings, one per hour; every third is paid; one has a formula-like name.
const BOOKINGS: Booking[] = Array.from({ length: 30 }, (_, i) => booking({
  id: `${i.toString(16).padStart(8, "0")}-0000-4000-8000-${String(i).padStart(12, "0")}`,
  name: i === 7 ? "=HYPERLINK(\"evil\")" : `Guest ${i}`,
  city: i === 3 ? "Pune, MH" : "Delhi",
  paymentStatus: i % 3 === 0 ? "paid" : "pending",
  amount: 1000,
  createdAt: new Date(Date.UTC(2026, 10, 10, i)).toISOString(),
}));
const ENQUIRIES: Enquiry[] = [
  enquiry({ id: "e-old", createdAt: "2026-10-01T06:00:00.000Z" }), // no kind → contact
  enquiry({ id: "e-trip", kind: "trip-plan", status: "contacted", createdAt: "2026-11-01T06:00:00.000Z" }),
  enquiry({ id: "e-call", kind: "callback", message: "100% sure", createdAt: "2026-11-02T06:00:00.000Z" }),
];

let bookingsRoute: typeof import("@/app/api/bookings/route");
let enquiriesRoute: typeof import("@/app/api/enquiries/route");
let bookingsExport: typeof import("@/app/api/bookings/export/route");
let enquiriesExport: typeof import("@/app/api/enquiries/export/route");
let summaryRoute: typeof import("@/app/api/admin/summary/route");
let db: ReturnType<typeof useTempDb>;
let adminToken: string;

beforeAll(async () => {
  db = useTempDb({ bookings: BOOKINGS, enquiries: ENQUIRIES });
  bookingsRoute = await import("@/app/api/bookings/route");
  enquiriesRoute = await import("@/app/api/enquiries/route");
  bookingsExport = await import("@/app/api/bookings/export/route");
  enquiriesExport = await import("@/app/api/enquiries/export/route");
  summaryRoute = await import("@/app/api/admin/summary/route");
  adminToken = await (await import("@/lib/auth")).createSession("admin@atlastours.com");
});
afterAll(() => db.cleanup());
beforeEach(() => { session.token = adminToken; });

const get = (handler: (req: NextRequest) => Promise<Response>, path: string) => handler(new NextRequest(`http://localhost${path}`));

describe("GET /api/bookings", () => {
  it("returns the bare array without list params (unchanged contract)", async () => {
    const res = await get(bookingsRoute.GET, "/api/bookings");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(30);
  });

  it("returns the envelope, newest first, 25 per page by default", async () => {
    const body = await (await get(bookingsRoute.GET, "/api/bookings?page=1")).json();
    expect(body).toMatchObject({ total: 30, page: 1, pageSize: 25 });
    expect(body.items).toHaveLength(25);
    expect(body.items[0].name).toBe("Guest 29");
    const p2 = await (await get(bookingsRoute.GET, "/api/bookings?page=2")).json();
    expect(p2.items.map((b: Booking) => b.name)).toEqual(["Guest 4", "Guest 3", "Guest 2", "Guest 1", "Guest 0"]);
  });

  it("clamps a page past the end to the last page", async () => {
    const body = await (await get(bookingsRoute.GET, "/api/bookings?page=9&pageSize=10")).json();
    expect(body).toMatchObject({ total: 30, page: 3, pageSize: 10 });
    expect(body.items).toHaveLength(10);
  });

  it("filters by search, reference, status and date", async () => {
    const q = async (qs: string) => (await (await get(bookingsRoute.GET, `/api/bookings?${qs}`)).json()) as { items: Booking[]; total: number };
    expect((await q("q=guest%2012")).items.map(b => b.name)).toEqual(["Guest 12"]);
    expect((await q("q=0000000A")).items.map(b => b.name)).toEqual(["Guest 10"]);
    expect((await q("paymentStatus=paid")).total).toBe(10);
    expect((await q("paymentStatus=paid&bookingStatus=cancelled")).total).toBe(0);
    // Hours 0–18 UTC on 10 Nov are 10 Nov in IST; 18:30 UTC onwards is 11 Nov.
    expect((await q("from=2026-11-10&to=2026-11-10")).total).toBe(19);
    expect((await q("from=2026-11-11")).total).toBe(11);
    expect((await q("q=")).total).toBe(30); // empty value = not filtered, but still the envelope
  });

  it("rejects bad params with 400", async () => {
    for (const qs of ["page=0", "page=abc", "pageSize=101", "pageSize=0", "bookingStatus=nope", "paymentStatus=PAID", "from=2026-13-01", "to=yesterday", `q=${"x".repeat(201)}`]) {
      const res = await get(bookingsRoute.GET, `/api/bookings?${qs}`);
      expect(res.status, qs).toBe(400);
      expect((await res.json()).error).toBeTruthy();
    }
  });

  it("is admin-only, with and without params", async () => {
    session.token = undefined;
    expect((await get(bookingsRoute.GET, "/api/bookings")).status).toBe(401);
    expect((await get(bookingsRoute.GET, "/api/bookings?page=1")).status).toBe(401);
  });
});

describe("GET /api/enquiries", () => {
  const q = async (qs: string) => (await (await get(enquiriesRoute.GET, `/api/enquiries?${qs}`)).json()) as { items: Enquiry[]; total: number };

  it("keeps the bare array without params", async () => {
    expect(await (await get(enquiriesRoute.GET, "/api/enquiries")).json()).toHaveLength(3);
  });

  it("treats a missing kind as contact and filters status", async () => {
    expect((await q("kind=contact")).items.map(e => e.id)).toEqual(["e-old"]);
    expect((await q("kind=callback")).items.map(e => e.id)).toEqual(["e-call"]);
    expect((await q("status=contacted")).items.map(e => e.id)).toEqual(["e-trip"]);
    expect((await q("pageSize=100")).items.map(e => e.id)).toEqual(["e-call", "e-trip", "e-old"]);
  });

  it("matches % literally", async () => {
    expect((await q("q=100%25")).items.map(e => e.id)).toEqual(["e-call"]);
    expect((await q("q=%25%25")).total).toBe(0);
  });

  it("rejects an unknown kind or status", async () => {
    expect((await get(enquiriesRoute.GET, "/api/enquiries?kind=email")).status).toBe(400);
    expect((await get(enquiriesRoute.GET, "/api/enquiries?status=pending")).status).toBe(400);
  });
});

describe("CSV exports", () => {
  it("returns the filtered bookings as an attachment with BOM and the formula guard", async () => {
    const res = await get(bookingsExport.GET, "/api/bookings/export?q=guest%203");
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("text/csv; charset=utf-8");
    expect(res.headers.get("Content-Disposition")).toMatch(/^attachment; filename="atlas-bookings-\d{4}-\d{2}-\d{2}\.csv"$/);
    expect(res.headers.get("X-Total-Count")).toBe("1");
    expect(res.headers.get("X-Export-Truncated")).toBeNull();
    const bytes = new Uint8Array(await res.clone().arrayBuffer());
    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    const lines = (await res.text()).replace(/^﻿/, "").split("\r\n").filter(Boolean);
    expect(lines[0]).toMatch(/^Reference,Booking ID,Received \(IST\),Name,/);
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain('"Pune, MH"');
  });

  it("ignores paging params and exports every match", async () => {
    const res = await get(bookingsExport.GET, "/api/bookings/export?page=2&pageSize=1");
    const text = await res.text();
    expect(text.split("\r\n").filter(Boolean)).toHaveLength(31);
    expect(text).toContain(`"'=HYPERLINK(""evil"")"`);
  });

  it("exports enquiries with the type label", async () => {
    const res = await get(enquiriesExport.GET, "/api/enquiries/export?kind=contact");
    expect(res.headers.get("Content-Disposition")).toMatch(/atlas-enquiries-/);
    const lines = (await res.text()).slice(1).split("\r\n").filter(Boolean);
    expect(lines).toHaveLength(2);
    expect(lines[1]).toMatch(/^e-old,2026-10-01 11:30,Contact,/);
  });

  it("is admin-only and validates filters", async () => {
    expect((await get(bookingsExport.GET, "/api/bookings/export?paymentStatus=bad")).status).toBe(400);
    session.token = undefined;
    expect((await get(bookingsExport.GET, "/api/bookings/export")).status).toBe(401);
    expect((await get(enquiriesExport.GET, "/api/enquiries/export")).status).toBe(401);
  });
});

describe("GET /api/admin/summary", () => {
  it("returns counts, paid revenue and the 5 newest of each", async () => {
    const res = await summaryRoute.GET(new NextRequest("http://localhost/api/admin/summary"));
    expect(res.status).toBe(200);
    const s = await res.json();
    expect(s.bookings).toMatchObject({ total: 30, pending: 30, paidRevenue: 10_000 });
    expect(s.bookings.recent.map((b: Booking) => b.name)).toEqual(["Guest 29", "Guest 28", "Guest 27", "Guest 26", "Guest 25"]);
    expect(s.enquiries).toMatchObject({ total: 3, new: 2 });
    expect(s.enquiries.recent.map((e: Enquiry) => e.id)).toEqual(["e-call", "e-trip", "e-old"]);
  });

  it("is admin-only", async () => {
    session.token = undefined;
    expect((await summaryRoute.GET(new NextRequest("http://localhost/api/admin/summary"))).status).toBe(401);
  });
});
