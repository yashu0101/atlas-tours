import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import "../helpers/no-upstash";
import { makePackage, uniqueIp, useTempDb } from "../helpers/temp-db";
import { bookingReference } from "@/lib/booking-ref";
import type { Booking } from "@/lib/types";

type Route = typeof import("@/app/api/payment-claim/route");

const base: Booking = {
  id: "3f9a2c1b-1111-4222-8333-444455556666",
  name: "Asha Verma",
  phone: "+91 98765 43210",
  email: "asha@example.com",
  city: "Pune",
  packageId: "pkg-1",
  packageName: "Ganga Aarti Tour",
  travelers: 2,
  travelDate: "2099-12-01",
  amount: 5000,
  paymentStatus: "pending",
  bookingStatus: "confirmed",
  createdAt: "2026-11-01T00:00:00.000Z",
};
const mk = (id: string, o: Partial<Booking> = {}): Booking => ({ ...base, id, ...o });

const CONFIRMED = mk("aaaaaaaa-1111-4222-8333-444455556666");
const PENDING = mk("bbbbbbbb-1111-4222-8333-444455556666", { bookingStatus: "pending" });
const PAID = mk("cccccccc-1111-4222-8333-444455556666", { paymentStatus: "paid" });
const SECOND = mk("dddddddd-1111-4222-8333-444455556666");
const HONEY = mk("eeeeeeee-1111-4222-8333-444455556666");

let route: Route;
let db: ReturnType<typeof useTempDb>;
let dbm: typeof import("@/lib/db");

beforeAll(async () => {
  db = useTempDb({
    packages: [makePackage({ id: "pkg-1", name: "Ganga Aarti Tour" })],
    bookings: [CONFIRMED, PENDING, PAID, SECOND, HONEY],
  });
  route = await import("@/app/api/payment-claim/route");
  dbm = await import("@/lib/db");
});
afterAll(() => db.cleanup());

let ip: string;
beforeEach(() => {
  ip = uniqueIp();
});

const post = (body: unknown) =>
  route.POST(
    new NextRequest("http://localhost/api/payment-claim", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "content-type": "application/json", "x-forwarded-for": ip },
    }),
  );
const claim = (b: Booking, extra: Record<string, unknown> = {}) =>
  post({ reference: bookingReference(b.id), phone: b.phone, utr: "4123 5678 9012", ...extra });

describe("POST /api/payment-claim", () => {
  it("stores the normalised UTR and moves the booking to verifying", async () => {
    const res = await claim(CONFIRMED);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true, paymentStatus: "verifying" });
    const saved = await dbm.getBookingById(CONFIRMED.id);
    expect(saved).toMatchObject({ utr: "412356789012", paymentStatus: "verifying" });
    expect(saved?.paymentSubmittedAt).toBeTruthy();
  });

  it("rejects a booking the owner has not confirmed", async () => {
    expect((await claim(PENDING)).status).toBe(409);
  });

  it("rejects an already paid booking", async () => {
    expect((await claim(PAID)).status).toBe(409);
  });

  it("returns the booking-status 404 for a wrong phone", async () => {
    const res = await post({ reference: bookingReference(SECOND.id), phone: "9000000000", utr: "412356789012" });
    expect(res.status).toBe(404);
    expect((await res.json()).error).toBe("No booking matches that reference and phone number.");
  });

  it("rejects a malformed UTR", async () => {
    const res = await claim(SECOND, { utr: "12345" });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("utr must be the 12-digit UPI transaction ID");
  });

  it("rejects a UTR already used by another booking", async () => {
    // CONFIRMED already holds 412356789012 from the first test.
    const res = await claim(SECOND);
    expect(res.status).toBe(409);
    expect((await res.json()).error).toBe("This transaction ID has already been submitted.");
    expect((await dbm.getBookingById(SECOND.id))?.paymentStatus).toBe("pending");
  });

  it("ignores honeypot submissions", async () => {
    const res = await claim(HONEY, { utr: "999988887777", website: "http://spam" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
    expect(await dbm.getBookingById(HONEY.id)).toMatchObject({ paymentStatus: "pending" });
  });

  it("rate-limits the 11th attempt from one IP", async () => {
    const attempt = () => post({ reference: "ZZZZZZZZ", phone: "9000000000", utr: "1" });
    for (let i = 0; i < 10; i++) await attempt();
    expect((await attempt()).status).toBe(429);
  });
});
