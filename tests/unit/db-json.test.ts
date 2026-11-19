import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { addBooking, findBookingByUtr, getBookingById, getPackageById, isPostgres, updateBooking } from "@/lib/db";
import { makePackage, useTempDb } from "../helpers/temp-db";

// JSON backend (vitest forces DATABASE_URL=""): getPackageById.
describe("getPackageById (JSON backend)", () => {
  let tmp: ReturnType<typeof useTempDb>;
  beforeEach(() => {
    tmp = useTempDb({ packages: [makePackage({ id: "p1", name: "One" }), makePackage({ id: "p2", name: "Two", hidden: true })] });
  });
  afterEach(() => tmp.cleanup());

  it("finds a package by id, hidden or not, and returns null otherwise", async () => {
    expect(isPostgres()).toBe(false);
    expect(await getPackageById("p1")).toMatchObject({ id: "p1", name: "One" });
    expect(await getPackageById("p2")).toMatchObject({ id: "p2", hidden: true });
    expect(await getPackageById("nope")).toBeNull();
  });
});

describe("booking payment fields (JSON backend)", () => {
  let tmp: ReturnType<typeof useTempDb>;
  beforeEach(() => { tmp = useTempDb(); });
  afterEach(() => tmp.cleanup());

  it("round-trips utr / paymentSubmittedAt / amount, finds by UTR and clears with null", async () => {
    const b = await addBooking({ name: "M", phone: "9876543210", email: "m@example.com", city: "Delhi", packageId: "p", packageName: "P", travelers: 2, travelDate: "2026-12-10", amount: 1000 });
    const iso = "2026-11-19T10:00:00.000Z";
    await updateBooking(b.id, { paymentStatus: "verifying", utr: "412356789012", paymentSubmittedAt: iso, amount: 1200 });
    expect(await getBookingById(b.id)).toMatchObject({ paymentStatus: "verifying", utr: "412356789012", paymentSubmittedAt: iso, amount: 1200 });
    expect((await findBookingByUtr("412356789012"))?.id).toBe(b.id);
    expect(await findBookingByUtr("000000000000")).toBeNull();
    expect(await getBookingById("missing")).toBeNull();

    await updateBooking(b.id, { utr: null, paymentSubmittedAt: null, paymentStatus: "pending" });
    const cleared = await getBookingById(b.id);
    expect(cleared?.utr).toBeUndefined();
    expect(cleared?.paymentSubmittedAt).toBeUndefined();
    expect(cleared && "utr" in cleared).toBe(false);
    expect(await findBookingByUtr("412356789012")).toBeNull();
  });
});
