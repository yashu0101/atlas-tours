import { describe, expect, it } from "vitest";
import {
  addBooking, addEnquiry, deleteBooking, deleteEnquiry, findBookingsByIdPrefix,
  getBookings, getEnquiries, updateBooking, updateEnquiryStatus,
} from "@/lib/db";
import { isIsoString, setupPgDb } from "../helpers/pglite-sql";

// Bookings and enquiries through the Postgres backend (PGlite).
setupPgDb();

const enquiry = { name: "Ravi", phone: "9876543210", email: "r@example.com", packageId: "pkg-1", travelers: 2, travelDate: "2026-12-01", message: "Hi" };
const booking = { name: "Meena", phone: "9876543210", email: "m@example.com", city: "Delhi", packageId: "pkg-1", packageName: "Kashi", travelers: 3, travelDate: "2026-12-10", amount: 14997 };

describe("Postgres backend: enquiries", () => {
  it("adds with status 'new' and kind, then updates status and deletes", async () => {
    const e = await addEnquiry({ ...enquiry, kind: "trip-plan" });
    expect(e).toMatchObject({ status: "new", kind: "trip-plan" });
    expect(isIsoString(e.createdAt)).toBe(true);

    const [got] = await getEnquiries();
    expect(got).toMatchObject({ ...enquiry, id: e.id, status: "new", kind: "trip-plan", createdAt: e.createdAt });
    expect(typeof got.travelers).toBe("number");

    expect(await updateEnquiryStatus(e.id, "contacted")).toMatchObject({ id: e.id, status: "contacted", name: "Ravi" });
    expect(await updateEnquiryStatus("missing", "contacted")).toBeNull();
    expect(await deleteEnquiry(e.id)).toBe(true);
    expect(await deleteEnquiry(e.id)).toBe(false);
  });

  it("stores an empty packageId as NULL and a missing kind as undefined", async () => {
    await addEnquiry({ ...enquiry, packageId: "" });
    const [got] = await getEnquiries();
    expect(got.packageId).toBeNull();
    expect(got.kind).toBeUndefined();
  });
});

describe("Postgres backend: bookings", () => {
  it("adds as pending/pending and updates only the given status", async () => {
    const b = await addBooking(booking);
    expect(b).toMatchObject({ paymentStatus: "pending", bookingStatus: "pending" });
    const [got] = await getBookings();
    expect(got).toMatchObject({ ...booking, id: b.id, paymentStatus: "pending", bookingStatus: "pending", createdAt: b.createdAt });
    expect(typeof got.amount).toBe("number");

    expect(await updateBooking(b.id, { paymentStatus: "paid" })).toMatchObject({ paymentStatus: "paid", bookingStatus: "pending" });
    expect(await updateBooking(b.id, { bookingStatus: "confirmed" })).toMatchObject({ paymentStatus: "paid", bookingStatus: "confirmed" });
    expect(await updateBooking("missing", { paymentStatus: "paid" })).toBeNull();
    expect(await deleteBooking(b.id)).toBe(true);
    expect(await getBookings()).toEqual([]);
  });

  it("finds bookings by id prefix and rejects LIKE wildcards", async () => {
    const b = await addBooking(booking);
    await addBooking({ ...booking, name: "Other" });
    const found = await findBookingsByIdPrefix(b.id.slice(0, 8));
    expect(found.map(x => x.id)).toContain(b.id);
    expect(found.every(x => x.id.startsWith(b.id.slice(0, 8)))).toBe(true);
    expect(await findBookingsByIdPrefix(b.id)).toHaveLength(1);
    expect(await findBookingsByIdPrefix("%")).toEqual([]);
    expect(await findBookingsByIdPrefix("_")).toEqual([]);
    expect(await findBookingsByIdPrefix("ffffffffff")).toEqual([]);
  });
});
