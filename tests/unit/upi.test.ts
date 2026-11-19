import { describe, it, expect } from "vitest";
import { upiPayLink, UPI_PAY_LINK, normalizeUtr, isAwaitingPayment } from "@/lib/upi";

describe("upi", () => {
  it("builds a per-booking link with amount and reference", () => {
    expect(upiPayLink({ amount: 17998, reference: "3F9A21BC" })).toBe(
      "upi://pay?pa=d2095760-1@okicici&pn=Dilip&am=17998.00&cu=INR&tn=Atlas%20booking%203F9A21BC"
    );
  });
  it("builds the generic link without amount", () => {
    expect(UPI_PAY_LINK).toBe("upi://pay?pa=d2095760-1@okicici&pn=Dilip&cu=INR");
  });
  it.each([
    ["412356789012", "412356789012"],
    [" 4123 5678-9012 ", "412356789012"],
  ])("normalizes UTR %s", (i, o) => expect(normalizeUtr(i)).toBe(o));
  it.each(["41235678901", "4123567890123", "41235678901A", ""])("rejects UTR %s", (i) =>
    expect(normalizeUtr(i)).toBeNull()
  );
  it.each([
    ["confirmed", "pending", true],
    ["confirmed", "failed", true],
    ["confirmed", "verifying", false],
    ["confirmed", "paid", false],
    ["confirmed", "refunded", false],
    ["pending", "pending", false],
    ["pending", "failed", false],
    ["cancelled", "failed", false],
  ])("isAwaitingPayment(%s, %s) = %s", (bookingStatus, paymentStatus, expected) =>
    expect(isAwaitingPayment({ bookingStatus, paymentStatus })).toBe(expected)
  );
});
