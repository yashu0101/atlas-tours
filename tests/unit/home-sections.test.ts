import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Offers from "@/components/Offers";
import Gallery, { filterGallery, galleryCategories } from "@/components/Gallery";
import type { GalleryImage, Offer } from "@/lib/types";

const offer = (o: Partial<Offer>): Offer => ({
  id: "o",
  title: "Offer",
  description: "",
  discount: 0,
  validFrom: "",
  validTo: "",
  active: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  ...o,
});

describe("Offers section (G-05)", () => {
  it("renders title, description, discount, code with a copy button and validity", () => {
    const html = renderToStaticMarkup(
      createElement(Offers, {
        initialOffers: [
          offer({ id: "x1", title: "Monsoon Saver", description: "Save on monsoon trips", discount: 12, code: "RAIN12", validTo: "2099-07-31" }),
        ],
      }),
    );
    expect(html).toContain('id="offers"');
    expect(html).toContain("Monsoon Saver");
    expect(html).toContain("Save on monsoon trips");
    expect(html).toContain("12% OFF");
    expect(html).toContain("RAIN12");
    expect(html).toContain('aria-label="Copy code RAIN12"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain("31 Jul 2099");
  });

  it("omits the code row, discount badge and validity when not set", () => {
    const html = renderToStaticMarkup(createElement(Offers, { initialOffers: [offer({ title: "Plain" })] }));
    expect(html).toContain("Plain");
    expect(html).not.toContain("Copy code");
    expect(html).not.toContain("% OFF");
    expect(html).not.toContain("Valid till");
  });
});

describe("gallery category tabs (G-06)", () => {
  const img = (id: string, category: string) => ({ id, category }) as GalleryImage;
  const images = [img("1", "Varanasi"), img("2", "Rajasthan"), img("3", " Varanasi "), img("4", ""), img("5", "Heritage")];

  it("lists distinct non-empty categories in first-seen order", () => {
    expect(galleryCategories(images)).toEqual(["Varanasi", "Rajasthan", "Heritage"]);
  });

  it("filters by category; All returns everything", () => {
    expect(filterGallery(images, "Varanasi").map((i) => i.id)).toEqual(["1", "3"]);
    expect(filterGallery(images, "All").map((i) => i.id)).toEqual(["1", "2", "3", "4", "5"]);
  });

  const full = (id: string, category: string): GalleryImage => ({
    id, src: "/images/placeholder.jpg", caption: id, category, active: true, createdAt: "",
  });

  it("renders All + category buttons with aria-pressed when there are 2+ categories", () => {
    const html = renderToStaticMarkup(createElement(Gallery, { initialImages: [full("g1", "Varanasi"), full("g2", "Rajasthan")] }));
    expect(html).toContain('aria-label="Filter gallery by category"');
    expect(html).toMatch(/aria-pressed="true"[^>]*>All</);
    expect(html).toMatch(/aria-pressed="false"[^>]*>Varanasi</);
    expect(html).toMatch(/aria-pressed="false"[^>]*>Rajasthan</);
  });

  it("hides the filters with a single category", () => {
    const html = renderToStaticMarkup(createElement(Gallery, { initialImages: [full("g1", "Varanasi"), full("g2", "Varanasi")] }));
    expect(html).not.toContain("Filter gallery by category");
    expect(html).not.toMatch(/<button[^>]*aria-pressed/);
  });
});
