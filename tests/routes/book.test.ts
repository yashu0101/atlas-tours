import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import "../helpers/no-upstash";
import { makePackage, uniqueIp, useTempDb } from "../helpers/temp-db";
import { EMPTY_BOOKING_FORM, buildBookingPayload } from "@/app/packages/package-utils";

type Route = typeof import("@/app/api/book/route");

let route: Route;
let db: ReturnType<typeof useTempDb>;

beforeAll(async () => {
  db = useTempDb({
    packages: [
      makePackage({ id: "pkg-1", name: "Ganga Aarti Tour", price: 2500 }),
      makePackage({ id: "pkg-hidden", name: "Secret Tour", price: 9999, hidden: true }),
    ],
  });
  route = await import("@/app/api/book/route");
});

afterAll(() => db.cleanup());

let ip: string;
beforeEach(() => {
  ip = uniqueIp();
});

const post = (body: unknown) =>
  route.POST(
    new NextRequest("http://localhost/api/book", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "content-type": "application/json", "x-forwarded-for": ip },
    }),
  );

// Exactly what BookingForm sends.
const formPayload = (packageId = "pkg-1") =>
  buildBookingPayload(
    {
      ...EMPTY_BOOKING_FORM,
      name: "Asha",
      phone: "+91 98765 43210",
      email: "asha@example.com",
      travelers: "3",
      travelDate: "2099-12-01",
      city: "Pune",
    },
    packageId,
  );

describe("POST /api/book with the BookingForm payload (G-01)", () => {
  it("saves the booking with a server-computed amount = price x travelers", async () => {
    const res = await post({ ...formPayload(), amount: 1, packageName: "Hacked" });
    expect(res.status).toBe(200);
    const saved = await res.json();
    expect(saved).toMatchObject({
      packageId: "pkg-1",
      packageName: "Ganga Aarti Tour",
      amount: 7500,
      travelers: 3,
      city: "Pune",
      paymentStatus: "pending",
      bookingStatus: "pending",
    });
    expect(db.read().bookings.some((b) => b.id === saved.id)).toBe(true);
  });

  it("404s for a hidden package", async () => {
    const res = await post(formPayload("pkg-hidden"));
    expect(res.status).toBe(404);
  });

  it("trips the honeypot: 200 without saving", async () => {
    const before = db.read().bookings.length;
    const res = await post({ ...formPayload(), website: "http://spam.example" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
    expect(db.read().bookings).toHaveLength(before);
  });

  it("rejects an invalid phone with 400", async () => {
    const res = await post({ ...formPayload(), phone: "abc" });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/phone/);
  });

  it("rate-limits after 5 requests per minute per IP", async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 6; i++) statuses.push((await post({ ...formPayload(), phone: "bad" })).status);
    expect(statuses.slice(0, 5).every((s) => s === 400)).toBe(true);
    expect(statuses[5]).toBe(429);
  });
});
