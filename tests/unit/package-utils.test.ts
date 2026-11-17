import { describe, expect, it } from "vitest";
import { SITE_CONFIG } from "@/lib/config";
import {
  EMPTY_BOOKING_FORM,
  bookingErrorMessage,
  buildBookingPayload,
  clampTravelers,
  estimateTotal,
  filterByCategory,
  formatPrice,
  packageCategories,
  packagePath,
  stripDayPrefix,
  whatsappLink,
} from "@/app/packages/package-utils";

describe("package categories (G-06)", () => {
  const pkgs = [
    { id: "a", category: "heritage" as const },
    { id: "b", category: "spiritual" as const },
    { id: "c", category: "spiritual" as const },
  ];

  it("lists only categories present, in the fixed display order", () => {
    expect(packageCategories(pkgs)).toEqual(["spiritual", "heritage"]);
    expect(packageCategories([])).toEqual([]);
  });

  it("filters by category; 'all' returns everything", () => {
    expect(filterByCategory(pkgs, "all").map((p) => p.id)).toEqual(["a", "b", "c"]);
    expect(filterByCategory(pkgs, "spiritual").map((p) => p.id)).toEqual(["b", "c"]);
    expect(filterByCategory(pkgs, "adventure")).toEqual([]);
  });
});

describe("formatting helpers", () => {
  it("formats prices with the fixed en-IN locale", () => {
    expect(formatPrice(1234567)).toBe("12,34,567");
    expect(formatPrice(undefined)).toBe("");
  });

  it("strips a leading 'Day N:' prefix only", () => {
    expect(stripDayPrefix("Day 2: Kashi Vishwanath")).toBe("Kashi Vishwanath");
    expect(stripDayPrefix("Arrival in Varanasi")).toBe("Arrival in Varanasi");
  });

  it("builds encoded package paths and WhatsApp links from SITE_CONFIG", () => {
    expect(packagePath("pkg varanasi")).toBe("/packages/pkg%20varanasi");
    const link = whatsappLink("Hi! I am interested");
    expect(link.startsWith(`https://wa.me/${SITE_CONFIG.whatsapp}?text=`)).toBe(true);
    expect(link).not.toContain(" ");
  });
});

describe("booking form helpers (G-01)", () => {
  it("clamps travelers like the server (1-100, invalid -> 1)", () => {
    expect(clampTravelers("3")).toBe(3);
    expect(clampTravelers("")).toBe(1);
    expect(clampTravelers("0")).toBe(1);
    expect(clampTravelers("abc")).toBe(1);
    expect(clampTravelers("2.7")).toBe(2);
    expect(clampTravelers(500)).toBe(100);
  });

  it("estimates the total as price x travelers", () => {
    expect(estimateTotal(8999, "2")).toBe(17998);
    expect(estimateTotal(8999, "")).toBe(8999);
  });

  it("builds a payload with only the fields /api/book reads (no amount/packageName)", () => {
    const payload = buildBookingPayload(
      {
        ...EMPTY_BOOKING_FORM,
        name: "  Asha ",
        phone: " +91 98765 43210 ",
        email: "a@b.co",
        travelers: "4",
        travelDate: "2026-12-01",
        city: " Pune ",
      },
      "pkg-varanasi",
    );
    expect(payload).toEqual({
      packageId: "pkg-varanasi",
      name: "Asha",
      phone: "+91 98765 43210",
      email: "a@b.co",
      city: "Pune",
      travelDate: "2026-12-01",
      travelers: 4,
      website: "",
    });
  });

  it("maps error responses to user-facing messages", () => {
    expect(bookingErrorMessage(429, { error: "Too many requests" })).toMatch(/wait a minute/);
    expect(bookingErrorMessage(404, { error: "Package not found" })).toMatch(/no longer available/);
    expect(bookingErrorMessage(400, { error: "phone is not a valid phone number" })).toMatch(/phone is not a valid phone number/);
    expect(bookingErrorMessage(500, null)).toMatch(/Something went wrong/);
    expect(bookingErrorMessage(400, null)).toMatch(/Something went wrong/);
  });
});
