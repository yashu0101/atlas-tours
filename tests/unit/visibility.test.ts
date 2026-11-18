import { describe, expect, it } from "vitest";
import {
  isPublicBlog,
  isPublicFAQ,
  isPublicGalleryImage,
  isOfferPublicAt,
  isPublicOffer,
  isPublicPackage,
  isPublicReview,
  istDateKey,
} from "@/lib/visibility";
import type { BlogPost, FAQ, GalleryImage, Offer, Review, TourPackage } from "@/lib/types";

describe("isPublicPackage", () => {
  const pkg = (hidden?: boolean) => ({ hidden }) as TourPackage;

  it("shows packages unless hidden is true", () => {
    expect(isPublicPackage(pkg(undefined))).toBe(true);
    expect(isPublicPackage(pkg(false))).toBe(true);
    expect(isPublicPackage(pkg(true))).toBe(false);
  });
});

describe("active-flag entities", () => {
  const cases = [
    ["review", (active?: boolean) => isPublicReview({ active } as Review)],
    ["gallery image", (active?: boolean) => isPublicGalleryImage({ active } as GalleryImage)],
    ["blog", (active?: boolean) => isPublicBlog({ active } as BlogPost)],
    ["faq", (active?: boolean) => isPublicFAQ({ active } as FAQ)],
    ["offer", (active?: boolean) => isPublicOffer({ active } as Offer)],
  ] as const;

  it.each(cases)("%s is public unless active is explicitly false", (_name, isPublic) => {
    expect(isPublic(true)).toBe(true);
    expect(isPublic(undefined)).toBe(true);
    expect(isPublic(false)).toBe(false);
  });
});

describe("isOfferPublicAt (G-05: active and not expired)", () => {
  const offer = (o: Partial<Offer>) => ({ active: true, validTo: "", ...o }) as Offer;
  // 2026-03-10 20:00 UTC = 2026-03-11 01:30 IST
  const lateUtc = new Date("2026-03-10T20:00:00.000Z");
  const noonUtc = new Date("2026-03-10T06:30:00.000Z"); // 12:00 IST on 2026-03-10

  it("istDateKey uses the IST calendar date", () => {
    expect(istDateKey(noonUtc)).toBe("2026-03-10");
    expect(istDateKey(lateUtc)).toBe("2026-03-11");
  });

  it("hides inactive offers regardless of dates", () => {
    expect(isOfferPublicAt(offer({ active: false, validTo: "2099-01-01" }), noonUtc)).toBe(false);
  });

  it("treats validTo as inclusive in IST", () => {
    expect(isOfferPublicAt(offer({ validTo: "2026-03-10" }), noonUtc)).toBe(true);
    expect(isOfferPublicAt(offer({ validTo: "2026-03-11" }), noonUtc)).toBe(true);
    expect(isOfferPublicAt(offer({ validTo: "2026-03-09" }), noonUtc)).toBe(false);
    // Already the 11th in India, so an offer ending on the 10th is over.
    expect(isOfferPublicAt(offer({ validTo: "2026-03-10" }), lateUtc)).toBe(false);
  });

  it("uses only the date part of a full ISO validTo", () => {
    expect(isOfferPublicAt(offer({ validTo: "2026-03-10T00:00:00.000Z" }), noonUtc)).toBe(true);
  });

  it("treats a missing, empty or unparseable validTo as no expiry", () => {
    expect(isOfferPublicAt(offer({ validTo: "" }), noonUtc)).toBe(true);
    expect(isOfferPublicAt(offer({ validTo: undefined as unknown as string }), noonUtc)).toBe(true);
    expect(isOfferPublicAt(offer({ validTo: "soon" }), noonUtc)).toBe(true);
  });

  it("does not enforce validFrom (upcoming offers may be announced)", () => {
    expect(isOfferPublicAt(offer({ validFrom: "2026-12-01", validTo: "2026-12-31" }), noonUtc)).toBe(true);
  });

  it("isPublicOffer hides the expired seed offers", () => {
    expect(isPublicOffer(offer({ validTo: "2025-12-31" }))).toBe(false);
    expect(isPublicOffer(offer({ validTo: "2999-12-31" }))).toBe(true);
  });

  it("isPublicOffer is safe to pass straight to Array.filter", () => {
    const list = [offer({ id: "a", validTo: "2999-12-31" }), offer({ id: "b", validTo: "2000-01-01" })];
    expect(list.filter(isPublicOffer).map((o) => o.id)).toEqual(["a"]);
  });
});
