import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import "../helpers/no-upstash";
import { addBooking, getBookingById, updateBooking } from "@/lib/db";
import { POST } from "@/app/api/payment-claim/route";
import { bookingReference } from "@/lib/booking-ref";
import { setupPgDb } from "../helpers/pglite-sql";

// N-13: the race where two customers submit the same UTR after both passed the findBookingByUtr
// pre-check. Forced here by making the pre-check miss, so the unique index must catch it.
vi.mock("@/lib/db", async (orig) => ({
  ...(await orig<typeof import("@/lib/db")>()),
  findBookingByUtr: vi.fn(async () => null),
}));

setupPgDb();

const input = { name: "Meena", phone: "9876543210", email: "m@example.com", city: "Delhi", packageId: "pkg-1", packageName: "Kashi", travelers: 3, travelDate: "2026-12-10", amount: 14997 };

describe("POST /api/payment-claim on Postgres", () => {
  it("turns a unique-index violation into the duplicate-UTR 409", async () => {
    const a = await addBooking(input);
    const b = await addBooking(input);
    await updateBooking(a.id, { bookingStatus: "confirmed", utr: "412356789012" });
    await updateBooking(b.id, { bookingStatus: "confirmed" });

    const res = await POST(
      new NextRequest("http://localhost/api/payment-claim", {
        method: "POST",
        body: JSON.stringify({ reference: bookingReference(b.id), phone: input.phone, utr: "4123 5678 9012" }),
        headers: { "content-type": "application/json", "x-forwarded-for": "10.9.8.7" },
      }),
    );
    expect(res.status).toBe(409);
    expect((await res.json()).error).toBe("This transaction ID has already been submitted.");
    expect(await getBookingById(b.id)).toMatchObject({ paymentStatus: "pending" });
    expect((await getBookingById(b.id))?.utr).toBeUndefined();
  });
});
