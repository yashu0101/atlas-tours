import { describe, expect, it } from "vitest";
import { addBooking, findBookingByUtr, getBookingById, updateBooking } from "@/lib/db";
import { isIsoString, setupPgDb } from "../helpers/pglite-sql";

// N-13 payment fields through the Postgres backend (PGlite, latest schema).
setupPgDb();

const booking = { name: "Meena", phone: "9876543210", email: "m@example.com", city: "Delhi", packageId: "pkg-1", packageName: "Kashi", travelers: 3, travelDate: "2026-12-10", amount: 14997 };

describe("Postgres backend: booking payments (v7)", () => {
  it("allows verifying and round-trips utr, paymentSubmittedAt and amount", async () => {
    const b = await addBooking(booking);
    const iso = "2026-11-19T10:00:00.000Z";
    await updateBooking(b.id, { paymentStatus: "verifying", utr: "412356789012", paymentSubmittedAt: iso, amount: 15000 });
    const got = await getBookingById(b.id);
    expect(got).toMatchObject({ paymentStatus: "verifying", utr: "412356789012", paymentSubmittedAt: iso, amount: 15000 });
    expect(isIsoString(got?.paymentSubmittedAt)).toBe(true);
    expect((await findBookingByUtr("412356789012"))?.id).toBe(b.id);
    expect(await findBookingByUtr("999999999999")).toBeNull();
    expect(await getBookingById("missing")).toBeNull();
  });

  it("a new booking has no utr and null clears the fields", async () => {
    const b = await addBooking(booking);
    expect(b.utr).toBeUndefined();
    await updateBooking(b.id, { utr: "412356789012", paymentSubmittedAt: "2026-11-19T10:00:00.000Z" });
    await updateBooking(b.id, { utr: null, paymentSubmittedAt: null });
    const got = await getBookingById(b.id);
    expect(got?.utr).toBeUndefined();
    expect(got?.paymentSubmittedAt).toBeUndefined();
  });

  it("rejects a second booking claiming the same utr", async () => {
    const a = await addBooking(booking);
    const b = await addBooking(booking);
    await updateBooking(a.id, { utr: "412356789012" });
    await expect(updateBooking(b.id, { utr: "412356789012" })).rejects.toThrow();
  });
});
