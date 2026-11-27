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
      makePackage({ id: "pkg-group", name: "Group Tour", price: 1000, minTravelers: 4 }),
      makePackage({
        id: "pkg-grid", name: "Kashmir Tour", price: 12700,
        pricing: {
          groupSizes: [2, 4],
          tiers: [
            { name: "3★ Budget", prices: [15400, 13600] },
            { name: "4★ Deluxe", prices: [20600, null] },
          ],
        },
      }),
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

  it("enforces the package's minimum group size (N-18)", async () => {
    const few = await post({ ...formPayload("pkg-group"), travelers: 3 });
    expect(few.status).toBe(400);
    expect((await few.json()).error).toMatch(/at least 4 travellers/);
    const enough = await post({ ...formPayload("pkg-group"), travelers: 4 });
    expect(enough.status).toBe(200);
    expect((await enough.json()).amount).toBe(4000);
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

describe("POST /api/book with a price grid (N-22)", () => {
  it("charges the chosen hotel category's rate for the group size and records the category", async () => {
    const res = await post({ ...formPayload("pkg-grid"), travelers: 5, option: "3★ Budget" });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ packageName: "Kashmir Tour — 3★ Budget", amount: 5 * 13600, travelers: 5 });

    const couple = await post({ ...formPayload("pkg-grid"), travelers: 2, option: "4★ Deluxe" });
    expect((await couple.json()).amount).toBe(2 * 20600);
  });

  it("sends the option chosen in the BookingForm", () => {
    expect(buildBookingPayload({ ...EMPTY_BOOKING_FORM, option: "3★ Budget" }, "pkg-grid")).toMatchObject({ option: "3★ Budget" });
    expect(buildBookingPayload(EMPTY_BOOKING_FORM, "pkg-1")).not.toHaveProperty("option");
  });

  it("400s without a known hotel category", async () => {
    for (const option of [undefined, "", "5★ Palace"]) {
      const res = await post({ ...formPayload("pkg-grid"), option });
      expect(res.status).toBe(400);
      expect((await res.json()).error).toMatch(/hotel category/);
    }
  });

  it("400s when the category has no rate for that group size", async () => {
    const res = await post({ ...formPayload("pkg-grid"), travelers: 4, option: "4★ Deluxe" });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/not available for 4 travellers/);
  });

  it("ignores an option on a package without a grid", async () => {
    const res = await post({ ...formPayload(), option: "anything" });
    expect(await res.json()).toMatchObject({ packageName: "Ganga Aarti Tour", amount: 7500 });
  });
});
