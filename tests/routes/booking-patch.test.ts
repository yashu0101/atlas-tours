import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { useTempDb } from "../helpers/temp-db";
import { booking } from "../helpers/inbox-fixtures";
import type { NotifyEvent } from "@/lib/notify";

// N-13: PATCH /api/bookings — editable amount, UTR reset, and the confirm / paid email triggers.

const session = vi.hoisted(() => ({ token: undefined as string | undefined }));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (name === "admin_session" && session.token ? { name, value: session.token } : undefined),
  }),
}));
const { notifyAfterResponse } = vi.hoisted(() => ({ notifyAfterResponse: vi.fn<(e: NotifyEvent) => void>() }));
vi.mock("@/lib/notify", () => ({ notifyAfterResponse }));

const id = (n: number) => `${n.toString(16).padStart(8, "0")}-0000-4000-8000-${String(n).padStart(12, "0")}`;
const FRESH = booking({ id: id(1) });
const AMOUNT = booking({ id: id(2) });
const CONFIRMED = booking({ id: id(3), bookingStatus: "confirmed" });
const VERIFYING = booking({ id: id(4), bookingStatus: "confirmed", paymentStatus: "verifying", utr: "412356789012", paymentSubmittedAt: "2026-11-11T06:00:00.000Z" });
const REJECTED = booking({ id: id(5), bookingStatus: "confirmed", paymentStatus: "verifying", utr: "412356789013", paymentSubmittedAt: "2026-11-11T06:00:00.000Z" });
const FAILED = booking({ id: id(6), paymentStatus: "failed" });

let route: typeof import("@/app/api/bookings/route");
let dbm: typeof import("@/lib/db");
let db: ReturnType<typeof useTempDb>;
let adminToken: string;

beforeAll(async () => {
  db = useTempDb({ bookings: [FRESH, AMOUNT, CONFIRMED, VERIFYING, REJECTED, FAILED] });
  route = await import("@/app/api/bookings/route");
  dbm = await import("@/lib/db");
  adminToken = await (await import("@/lib/auth")).createSession("admin@atlastours.com");
});
afterAll(() => db.cleanup());
beforeEach(() => {
  session.token = adminToken;
  notifyAfterResponse.mockClear();
});

const patch = (body: unknown) =>
  route.PATCH(
    new NextRequest("http://localhost/api/bookings", {
      method: "PATCH",
      body: JSON.stringify(body),
      headers: { "content-type": "application/json" },
    }),
  );

describe("PATCH /api/bookings", () => {
  it("edits the amount", async () => {
    const res = await patch({ id: AMOUNT.id, amount: 9000 });
    expect(res.status).toBe(200);
    expect((await dbm.getBookingById(AMOUNT.id))?.amount).toBe(9000);
    expect(notifyAfterResponse).not.toHaveBeenCalled();
  });

  it.each([9000.5, "abc", 0, -5, 10_000_001, null])("rejects amount %j", async (amount) => {
    expect((await patch({ id: AMOUNT.id, amount })).status).toBe(400);
  });

  it("404s for an unknown booking", async () => {
    expect((await patch({ id: "nope", amount: 5 })).status).toBe(404);
  });

  it("emails the customer once when a pending booking becomes confirmed", async () => {
    const res = await patch({ id: FRESH.id, bookingStatus: "confirmed" });
    expect(res.status).toBe(200);
    expect(notifyAfterResponse).toHaveBeenCalledTimes(1);
    expect(notifyAfterResponse).toHaveBeenCalledWith({ type: "booking-confirmed", booking: await res.json() });
    notifyAfterResponse.mockClear();
    await patch({ id: FRESH.id, bookingStatus: "confirmed" });
    expect(notifyAfterResponse).not.toHaveBeenCalled();
  });

  it("does not send the pay link when the booking is not awaiting payment", async () => {
    await patch({ id: FAILED.id, bookingStatus: "confirmed" });
    expect(notifyAfterResponse).not.toHaveBeenCalled();
  });

  it("sends payment-received when a booking becomes paid, once", async () => {
    const res = await patch({ id: VERIFYING.id, paymentStatus: "paid" });
    expect(res.status).toBe(200);
    expect(notifyAfterResponse).toHaveBeenCalledTimes(1);
    expect(notifyAfterResponse).toHaveBeenCalledWith({ type: "payment-received", booking: await res.json() });
    notifyAfterResponse.mockClear();
    await patch({ id: VERIFYING.id, paymentStatus: "paid" });
    expect(notifyAfterResponse).not.toHaveBeenCalled();
  });

  it("clears the UTR when a claim is rejected back to pending", async () => {
    const res = await patch({ id: REJECTED.id, paymentStatus: "pending" });
    expect(res.status).toBe(200);
    const saved = await dbm.getBookingById(REJECTED.id);
    expect(saved?.paymentStatus).toBe("pending");
    expect(saved?.utr).toBeUndefined();
    expect(saved?.paymentSubmittedAt).toBeUndefined();
    expect(notifyAfterResponse).not.toHaveBeenCalled(); // already confirmed: no second pay link
  });

  it("still 400s with nothing to update and 401s without a session", async () => {
    expect((await patch({ id: CONFIRMED.id })).status).toBe(400);
    session.token = undefined;
    expect((await patch({ id: CONFIRMED.id, amount: 5 })).status).toBe(401);
  });
});
