import { describe, expect, it } from "vitest";
import {
  isPublicBlog,
  isPublicFAQ,
  isPublicGalleryImage,
  isPublicOffer,
  isPublicPackage,
  isPublicReview,
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
