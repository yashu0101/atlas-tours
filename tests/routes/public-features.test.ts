import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import "../helpers/no-upstash";
import { makePackage, uniqueIp, useTempDb } from "../helpers/temp-db";
import { bookingReference, parseBookingReference } from "@/lib/booking-ref";
import { tripRequestMessage } from "@/lib/trip-request";
import { istDateKey } from "@/lib/visibility";
import type { Booking } from "@/lib/types";

// N-4 booking status, N-5 customer reviews, N-6 trip/callback requests.

type ReviewRoute = typeof import("@/app/api/review/route");
type StatusRoute = typeof import("@/app/api/booking-status/route");
type TripRoute = typeof import("@/app/api/trip-request/route");

const BOOKING: Booking = {
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

let reviewRoute: ReviewRoute;
let statusRoute: StatusRoute;
let tripRoute: TripRoute;
let db: ReturnType<typeof useTempDb>;

beforeAll(async () => {
  db = useTempDb({
    packages: [makePackage({ id: "pkg-1", name: "Ganga Aarti Tour" }), makePackage({ id: "pkg-hidden", name: "Secret", hidden: true })],
    bookings: [BOOKING],
  });
  reviewRoute = await import("@/app/api/review/route");
  statusRoute = await import("@/app/api/booking-status/route");
  tripRoute = await import("@/app/api/trip-request/route");
});

afterAll(() => db.cleanup());

let ip: string;
beforeEach(() => {
  ip = uniqueIp();
});

const req = (url: string, body: unknown) =>
  new NextRequest(`http://localhost${url}`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
  });

describe("booking reference helpers", () => {
  it("formats the first 8 characters upper-cased", () => {
    expect(bookingReference(BOOKING.id)).toBe("3F9A2C1B");
  });
  it.each([
    ["3F9A2C1B", "3f9a2c1b"],
    ["#3f9a2c1b", "3f9a2c1b"],
    [" 3F9A 2C1B ", "3f9a2c1b"],
    ["3F9A-2C1B", "3f9a2c1b"],
    [BOOKING.id.toUpperCase(), BOOKING.id],
  ])("parses %j", (input, expected) => {
    expect(parseBookingReference(input)).toBe(expected);
  });
  it.each(["", "3F9A2C", "3F9A2C1B9", "3f9a%", "zzzzzzzz", "3f9a2c1_"])("rejects %j", (input) => {
    expect(parseBookingReference(input)).toBeNull();
  });
});

describe("POST /api/booking-status", () => {
  const lookup = (body: unknown) => statusRoute.POST(req("/api/booking-status", body));

  it("returns only status fields when reference and phone match", async () => {
    const res = await lookup({ reference: "3f9a2c1b", phone: "098765-43210" });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual({
      reference: "3F9A2C1B",
      firstName: "Asha",
      packageName: "Ganga Aarti Tour",
      travelDate: "2099-12-01",
      travelers: 2,
      amount: 5000,
      bookingStatus: "confirmed",
      paymentStatus: "pending",
      createdAt: BOOKING.createdAt,
    });
    expect(data).not.toHaveProperty("email");
    expect(data).not.toHaveProperty("id");
  });

  it("gives the same 404 for a wrong phone and an unknown reference", async () => {
    const wrongPhone = await lookup({ reference: "3F9A2C1B", phone: "9999999999" });
    const unknownRef = await lookup({ reference: "AAAAAAAA", phone: "9876543210" });
    expect(wrongPhone.status).toBe(404);
    expect(unknownRef.status).toBe(404);
    expect(await wrongPhone.json()).toEqual(await unknownRef.json());
  });

  it("rejects malformed input with 400", async () => {
    expect((await lookup({ reference: "%%%%%%%%", phone: "9876543210" })).status).toBe(400);
    expect((await lookup({ reference: "3F9A2C1B" })).status).toBe(400);
    expect((await lookup({ reference: "3F9A2C1B", phone: "12" })).status).toBe(400);
  });

  it("rate-limits repeated lookups from one IP", async () => {
    let last = 0;
    for (let i = 0; i < 11; i++) last = (await lookup({ reference: "AAAAAAAA", phone: "9876543210" })).status;
    expect(last).toBe(429);
  });
});

describe("POST /api/review", () => {
  const submit = (body: unknown) => reviewRoute.POST(req("/api/review", body));
  const valid = { name: "Ravi", city: "Delhi", rating: 5, text: "Wonderful evening aarti, very well organised." };

  it("saves an inactive customer review and does not echo it", async () => {
    const res = await submit({ ...valid, packageId: "pkg-1", active: true, source: "admin", id: "evil" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
    const saved = db.read().reviews.find((r) => r.text === valid.text);
    expect(saved).toMatchObject({ ...valid, packageName: "Ganga Aarti Tour", active: false, source: "customer" });
    expect(saved?.id).not.toBe("evil");
  });

  it("drops a hidden or unknown package", async () => {
    await submit({ ...valid, text: "Hidden package review text here.", packageId: "pkg-hidden" });
    const saved = db.read().reviews.find((r) => r.text === "Hidden package review text here.");
    expect(saved).toBeDefined();
    expect(saved).not.toHaveProperty("packageName");
  });

  it.each([
    [{ ...valid, rating: 0 }],
    [{ ...valid, rating: 6 }],
    [{ ...valid, rating: 4.5 }],
    [{ ...valid, text: "Too short" }],
    [{ ...valid, text: "x".repeat(1001) }],
    [{ ...valid, name: "" }],
  ])("rejects invalid input %#", async (body) => {
    expect((await submit(body)).status).toBe(400);
  });

  it("trips the honeypot without saving", async () => {
    const before = db.read().reviews.length;
    expect((await submit({ ...valid, website: "spam.example" })).status).toBe(200);
    expect(db.read().reviews.length).toBe(before);
  });
});

describe("POST /api/trip-request", () => {
  // A fresh IP per call: several cases send more than the 5/min form limit.
  const send = (body: unknown) => { ip = uniqueIp(); return tripRoute.POST(req("/api/trip-request", body)); };
  const contact = { name: "Meera", phone: "9876543210", email: "meera@example.com", travelers: 3, travelDate: "2099-01-10" };
  const today = istDateKey(new Date());
  const lastEnquiry = () => db.read().enquiries.at(-1)!;

  it("saves a trip plan as an enquiry with a labelled message", async () => {
    const res = await send({
      ...contact,
      kind: "trip-plan",
      destinations: "Varanasi, Sarnath",
      days: 4,
      budget: "10k-25k",
      interests: ["spiritual", "food", "spiritual"],
      message: "Elderly parents, need easy walking.",
    });
    expect(res.status).toBe(200);
    const saved = lastEnquiry();
    expect(saved).toMatchObject({ ...contact, kind: "trip-plan", status: "new" });
    expect(saved.message).toBe(
      "Trip plan request\nDestinations: Varanasi, Sarnath\nDuration: 4 days\nBudget: ₹10,000 – ₹25,000 per person\n" +
        "Interests: Temples & spiritual, Food & local markets\n\nElderly parents, need easy walking.",
    );
  });

  it("saves a callback request with date and slot", async () => {
    expect((await send({ name: "Meera", phone: "9876543210", kind: "callback", callbackDate: today, callbackSlot: "evening" })).status).toBe(200);
    const saved = lastEnquiry();
    expect(saved.kind).toBe("callback");
    expect(saved.message).toContain(`Call back: ${today}, Evening (4 PM – 8 PM IST)`);
  });

  it("requires date and slot for a callback, within the next 30 days", async () => {
    expect((await send({ ...contact, kind: "callback", callbackSlot: "morning" })).status).toBe(400);
    expect((await send({ ...contact, kind: "callback", callbackDate: today })).status).toBe(400);
    expect((await send({ ...contact, kind: "callback", callbackDate: "2020-01-01", callbackSlot: "morning" })).status).toBe(400);
    expect((await send({ ...contact, kind: "callback", callbackDate: "2099-01-01", callbackSlot: "morning" })).status).toBe(400);
  });

  it("rejects unknown option values and an empty trip plan", async () => {
    expect((await send({ ...contact, destinations: "Goa", budget: "free" })).status).toBe(400);
    expect((await send({ ...contact, destinations: "Goa", interests: ["casino"] })).status).toBe(400);
    expect((await send({ ...contact, destinations: "Goa", interests: "food" })).status).toBe(400);
    expect((await send({ ...contact, destinations: "Goa", days: 0 })).status).toBe(400);
    expect((await send({ ...contact, kind: "contact", destinations: "Goa" })).status).toBe(400);
    expect((await send({ ...contact })).status).toBe(400);
  });

  it("uses the singular for a 1-day trip", () => {
    expect(tripRequestMessage({ kind: "trip-plan", destinations: "", days: 1, interests: [], notes: "" })).toContain("Duration: 1 day");
  });
});
