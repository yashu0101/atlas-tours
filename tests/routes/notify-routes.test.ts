import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import "../helpers/no-upstash";
import { makePackage, uniqueIp, useTempDb } from "../helpers/temp-db";
import { istDateKey } from "@/lib/visibility";
import type { NotifyEvent } from "@/lib/notify";

/**
 * G-02 / N-10: every public form route schedules exactly one notification after saving, with
 * the saved record; honeypot-tripped and invalid submissions schedule none. The notify module is
 * mocked here — its sending logic is covered by tests/unit/notify.test.ts.
 */
const { notifyAfterResponse } = vi.hoisted(() => ({ notifyAfterResponse: vi.fn<(e: NotifyEvent) => void>() }));
vi.mock("@/lib/notify", () => ({ notifyAfterResponse }));

let book: typeof import("@/app/api/book/route");
let enquiry: typeof import("@/app/api/enquiry/route");
let review: typeof import("@/app/api/review/route");
let trip: typeof import("@/app/api/trip-request/route");
let db: ReturnType<typeof useTempDb>;

beforeAll(async () => {
  db = useTempDb({ packages: [makePackage({ id: "pkg-1", name: "Ganga Aarti Tour", price: 2500 })] });
  book = await import("@/app/api/book/route");
  enquiry = await import("@/app/api/enquiry/route");
  review = await import("@/app/api/review/route");
  trip = await import("@/app/api/trip-request/route");
});

afterAll(() => db.cleanup());

beforeEach(() => {
  notifyAfterResponse.mockClear();
});

const post = (url: string, body: unknown) =>
  new NextRequest(`http://localhost${url}`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json", "x-forwarded-for": uniqueIp() },
  });

const contact = { name: "Asha", phone: "+91 98765 43210", email: "asha@example.com", travelers: 2, travelDate: "2099-12-01" };
const lastEvent = () => notifyAfterResponse.mock.calls.at(-1)?.[0];

describe("public form routes schedule notifications", () => {
  it("/api/book: one booking event with the saved booking", async () => {
    const res = await book.POST(post("/api/book", { ...contact, packageId: "pkg-1", city: "Pune" }));
    expect(res.status).toBe(200);
    const saved = await res.json();
    expect(notifyAfterResponse).toHaveBeenCalledTimes(1);
    expect(lastEvent()).toEqual({ type: "booking", booking: saved });
  });

  it("/api/enquiry: one enquiry event with the resolved package name", async () => {
    const res = await enquiry.POST(post("/api/enquiry", { ...contact, packageId: "pkg-1", message: "Hi" }));
    expect(res.status).toBe(200);
    const saved = await res.json();
    expect(notifyAfterResponse).toHaveBeenCalledTimes(1);
    expect(lastEvent()).toEqual({ type: "enquiry", enquiry: saved, packageName: "Ganga Aarti Tour" });
  });

  it("/api/trip-request: trip plan and callback events with the saved enquiry", async () => {
    expect((await trip.POST(post("/api/trip-request", { ...contact, kind: "trip-plan", destinations: "Sarnath" }))).status).toBe(200);
    let ev = lastEvent();
    expect(ev?.type).toBe("enquiry");
    if (ev?.type !== "enquiry") throw new Error("unreachable");
    expect(ev.enquiry).toMatchObject({ kind: "trip-plan", name: "Asha", email: "asha@example.com" });
    expect(ev.enquiry.id).toBe(db.read().enquiries.at(-1)!.id);
    expect(ev.callback).toBeUndefined();

    const today = istDateKey(new Date());
    expect(
      (await trip.POST(post("/api/trip-request", { ...contact, kind: "callback", callbackDate: today, callbackSlot: "evening" }))).status,
    ).toBe(200);
    ev = lastEvent();
    if (ev?.type !== "enquiry") throw new Error("expected an enquiry event");
    expect(ev.enquiry.kind).toBe("callback");
    expect(ev.callback).toEqual({ date: today, slot: "evening" });
    expect(notifyAfterResponse).toHaveBeenCalledTimes(2);
  });

  it("/api/review: one review event with the saved (inactive) review", async () => {
    const text = "Wonderful evening aarti, very well organised.";
    const res = await review.POST(post("/api/review", { name: "Ravi", city: "Delhi", rating: 5, text, packageId: "pkg-1" }));
    expect(res.status).toBe(200);
    expect(notifyAfterResponse).toHaveBeenCalledTimes(1);
    const ev = lastEvent();
    if (ev?.type !== "review") throw new Error("expected a review event");
    expect(ev.review).toMatchObject({ name: "Ravi", text, rating: 5, active: false, source: "customer", packageName: "Ganga Aarti Tour" });
    expect(ev.review.id).toBe(db.read().reviews.find((r) => r.text === text)!.id);
  });

  it.each([
    ["/api/book", () => book, { ...contact, packageId: "pkg-1" }],
    ["/api/enquiry", () => enquiry, { ...contact, message: "Hi" }],
    ["/api/trip-request", () => trip, { ...contact, destinations: "Sarnath" }],
    ["/api/review", () => review, { name: "Ravi", rating: 5, text: "Wonderful evening aarti, very well organised." }],
  ] as const)("%s: honeypot and invalid submissions notify nobody", async (url, route, valid) => {
    expect((await route().POST(post(url, { ...valid, website: "spam.example" }))).status).toBe(200);
    expect((await route().POST(post(url, { ...valid, name: "" }))).status).toBe(400);
    expect(notifyAfterResponse).not.toHaveBeenCalled();
  });

  it("/api/book: an unknown package notifies nobody", async () => {
    expect((await book.POST(post("/api/book", { ...contact, packageId: "nope" }))).status).toBe(404);
    expect(notifyAfterResponse).not.toHaveBeenCalled();
  });
});
