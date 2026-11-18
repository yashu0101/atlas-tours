import { describe, expect, it } from "vitest";
import { escapeLike, getInboxSummary, queryBookings, queryEnquiries } from "@/lib/db";
import { EMPTY_BOOKING_FILTERS, EMPTY_ENQUIRY_FILTERS, type BookingFilters, type EnquiryFilters } from "@/lib/inbox-filters";
import type { Booking, Enquiry } from "@/lib/types";
import { booking, enquiry } from "../helpers/inbox-fixtures";
import { setupPgDb } from "../helpers/pglite-sql";

// Review point #6: the Postgres compilation of the shared inbox filter spec (PGlite).
const ctx = setupPgDb();

// Rows are inserted directly so ids and created_at are fixed.
async function insertBooking(b: Booking) {
  await ctx.sql.query(
    `INSERT INTO bookings (id,name,phone,email,city,package_id,package_name,travelers,travel_date,amount,payment_status,booking_status,created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
    [b.id, b.name, b.phone, b.email, b.city, b.packageId, b.packageName, b.travelers, b.travelDate, b.amount, b.paymentStatus, b.bookingStatus, b.createdAt],
  );
}
async function insertEnquiry(e: Enquiry) {
  await ctx.sql.query(
    `INSERT INTO enquiries (id,name,phone,email,package_id,travelers,travel_date,message,status,kind,created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
    [e.id, e.name, e.phone, e.email, e.packageId ?? null, e.travelers, e.travelDate, e.message, e.status, e.kind ?? null, e.createdAt],
  );
}

const all = { page: 1, pageSize: 100 };

async function seedBookings() {
  for (const b of [
    booking({ id: "aaaaaaaa-1111-4000-8000-000000000001", name: "Rahul Sharma", createdAt: "2026-11-01T06:00:00Z" }),
    booking({ id: "bbbbbbbb-2222-4000-8000-000000000002", name: "Priya Patel", city: "Mumbai", phone: "9123456789", email: "p@x.in", packageName: "Royal Rajasthan Explorer", bookingStatus: "confirmed", paymentStatus: "paid", amount: 5000, createdAt: "2026-11-05T06:00:00Z" }),
    booking({ id: "cccccccc-3333-4000-8000-000000000003", name: "Amit Kumar", city: "Kolkata", phone: "9000000000", email: "a@x.in", packageName: "Sacred Odisha Pilgrimage", bookingStatus: "cancelled", createdAt: "2026-11-09T06:00:00Z" }),
    booking({ id: "dddddddd-4444-4000-8000-000000000004", name: "50% Off_Guest", city: "Agra", phone: "8000000000", email: "d@x.in", packageName: "Taj", paymentStatus: "paid", amount: 7000, createdAt: "2026-11-09T06:00:00Z" }),
  ]) await insertBooking(b);
}

describe("Postgres: queryBookings", () => {
  const names = async (over: Partial<BookingFilters>) =>
    (await queryBookings({ ...EMPTY_BOOKING_FILTERS, ...over }, all)).items.map(b => b.name);

  it("returns everything newest first (ties by id descending) with no filters", async () => {
    await seedBookings();
    expect(await names({})).toEqual(["50% Off_Guest", "Amit Kumar", "Priya Patel", "Rahul Sharma"]);
  });

  it("searches the same fields as the JSON backend, including the reference", async () => {
    await seedBookings();
    expect(await names({ search: "PRIYA" })).toEqual(["Priya Patel"]);
    expect(await names({ search: "mumbai" })).toEqual(["Priya Patel"]);
    expect(await names({ search: "odisha" })).toEqual(["Amit Kumar"]);
    expect(await names({ search: "a@x.in" })).toEqual(["Amit Kumar"]);
    expect(await names({ search: "BBBBBBBB" })).toEqual(["Priya Patel"]);
    expect(await names({ search: "2222" })).toEqual([]); // past the 8-character reference
    expect(await names({ search: "  rahul  " })).toEqual(["Rahul Sharma"]);
    expect(await names({ search: "98765 43210" })).toEqual(["Rahul Sharma"]);
    expect(await names({ search: "+91 9123" })).toEqual([]);
    expect(await names({ search: "912345" })).toEqual(["Priya Patel"]);
  });

  it("escapes % and _ in the search (ILIKE)", async () => {
    await seedBookings();
    expect(await names({ search: "%" })).toEqual(["50% Off_Guest"]);
    expect(await names({ search: "_" })).toEqual(["50% Off_Guest"]);
    expect(await names({ search: "0% off_g" })).toEqual(["50% Off_Guest"]);
    expect(await names({ search: "r_hul" })).toEqual([]); // `_` is not a wildcard
    expect(await names({ search: "\\" })).toEqual([]);
    expect(escapeLike("a%b_c\\d")).toBe("a\\%b\\_c\\\\d");
  });

  it("filters by status and the received date range", async () => {
    await seedBookings();
    expect(await names({ bookingStatus: "cancelled" })).toEqual(["Amit Kumar"]);
    expect(await names({ paymentStatus: "paid" })).toEqual(["50% Off_Guest", "Priya Patel"]);
    expect(await names({ from: "2026-11-05" })).toEqual(["50% Off_Guest", "Amit Kumar", "Priya Patel"]);
    expect(await names({ from: "2026-11-02", to: "2026-11-08" })).toEqual(["Priya Patel"]);
  });

  it("uses IST calendar-day boundaries", async () => {
    const at = (id: string, createdAt: string) => insertBooking(booking({ id, name: id, createdAt }));
    await at("before", "2026-11-09T18:29:59.999Z"); // 9 Nov 23:59:59.999 IST
    await at("start", "2026-11-09T18:30:00.000Z"); // 10 Nov 00:00 IST
    await at("end", "2026-11-10T18:29:59.999Z"); // 10 Nov 23:59:59.999 IST
    await at("after", "2026-11-10T18:30:00.000Z"); // 11 Nov 00:00 IST
    expect(await names({ from: "2026-11-10", to: "2026-11-10" })).toEqual(["end", "start"]);
    expect(await names({ to: "2026-11-09" })).toEqual(["before"]);
    expect(await names({ from: "2026-11-11" })).toEqual(["after"]);
  });

  it("paginates with a total and clamps a page past the end", async () => {
    for (let i = 0; i < 12; i++) {
      await insertBooking(booking({ id: `${String(i).padStart(8, "0")}-x`, name: `G${i}`, createdAt: new Date(Date.UTC(2026, 10, 1, i)).toISOString() }));
    }
    const p1 = await queryBookings(EMPTY_BOOKING_FILTERS, { page: 1, pageSize: 5 });
    expect(p1).toMatchObject({ total: 12, page: 1, pageSize: 5 });
    expect(p1.items.map(b => b.name)).toEqual(["G11", "G10", "G9", "G8", "G7"]);
    const p3 = await queryBookings(EMPTY_BOOKING_FILTERS, { page: 3, pageSize: 5 });
    expect(p3.items.map(b => b.name)).toEqual(["G1", "G0"]);
    const past = await queryBookings(EMPTY_BOOKING_FILTERS, { page: 7, pageSize: 5 });
    expect(past).toMatchObject({ total: 12, page: 3 });
    expect(past.items).toHaveLength(2);
    const filtered = await queryBookings({ ...EMPTY_BOOKING_FILTERS, search: "g1" }, { page: 1, pageSize: 1 });
    expect(filtered).toMatchObject({ total: 3, page: 1 }); // G1, G10, G11
    expect(typeof filtered.total).toBe("number");
    const none = await queryBookings({ ...EMPTY_BOOKING_FILTERS, search: "nobody" }, { page: 4, pageSize: 5 });
    expect(none).toEqual({ items: [], total: 0, page: 1, pageSize: 5 });
  });
});

describe("Postgres: queryEnquiries", () => {
  it("defaults a NULL kind to contact and filters status, search and dates", async () => {
    await insertEnquiry(enquiry({ id: "e1", name: "Old Contact", createdAt: "2026-10-01T06:00:00Z" }));
    await insertEnquiry(enquiry({ id: "e2", name: "Trip", kind: "trip-plan", message: "Destinations: Varanasi\nBudget: 50000", status: "contacted", createdAt: "2026-11-01T06:00:00Z" }));
    await insertEnquiry(enquiry({ id: "e3", name: "Call me", kind: "callback", message: "Slot: evening", createdAt: "2026-11-02T06:00:00Z" }));
    await insertEnquiry(enquiry({ id: "e4", name: "New Contact", kind: "contact", createdAt: "2026-09-01T06:00:00Z" }));
    const ids = async (over: Partial<EnquiryFilters>) => (await queryEnquiries({ ...EMPTY_ENQUIRY_FILTERS, ...over }, all)).items.map(e => e.id);
    expect(await ids({})).toEqual(["e3", "e2", "e1", "e4"]);
    expect(await ids({ kind: "contact" })).toEqual(["e1", "e4"]);
    expect(await ids({ kind: "trip-plan" })).toEqual(["e2"]);
    expect(await ids({ kind: "callback" })).toEqual(["e3"]);
    expect(await ids({ search: "budget" })).toEqual(["e2"]);
    expect(await ids({ status: "contacted" })).toEqual(["e2"]);
    expect(await ids({ to: "2026-10-31" })).toEqual(["e1", "e4"]);
    const [old] = (await queryEnquiries({ ...EMPTY_ENQUIRY_FILTERS, kind: "contact" }, all)).items;
    expect(old.kind).toBeUndefined(); // still stored as NULL, only filtered as contact
  });
});

describe("Postgres: getInboxSummary", () => {
  it("counts, sums paid revenue and returns the newest 5", async () => {
    await seedBookings();
    await insertEnquiry(enquiry({ id: "e1", status: "new" }));
    await insertEnquiry(enquiry({ id: "e2", status: "contacted" }));
    const s = await getInboxSummary();
    expect(s.bookings).toMatchObject({ total: 4, pending: 2, paidRevenue: 12_000 });
    expect(s.bookings.recent.map(b => b.name)).toEqual(["50% Off_Guest", "Amit Kumar", "Priya Patel", "Rahul Sharma"]);
    expect(s.enquiries).toMatchObject({ total: 2, new: 1 });
  });

  it("is all zeros on empty tables", async () => {
    const s = await getInboxSummary();
    expect(s).toEqual({ bookings: { total: 0, pending: 0, paidRevenue: 0, recent: [] }, enquiries: { total: 0, new: 0, recent: [] } });
  });
});
