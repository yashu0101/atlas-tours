import { describe, expect, it } from "vitest";
import {
  addBlog, addFAQ, addGalleryImage, addOffer, addPackage, addReview,
  deleteBlog, deleteFAQ, deleteGalleryImage, deleteOffer, deletePackage, deleteReview,
  getBlogs, getFAQs, getGallery, getOffers, getPackageById, getPackages, getReviews, isPostgres,
  updateBlog, updateFAQ, updateGalleryImage, updateOffer, updatePackage, updateReview,
} from "@/lib/db";
import type { TourPackage } from "@/lib/types";
import { isIsoString, setupPgDb } from "../helpers/pglite-sql";

// Postgres backend (pg* functions in db.ts) against a real in-process Postgres (PGlite).
setupPgDb();

const newPackage = (over: Partial<TourPackage> = {}): Omit<TourPackage, "id" | "createdAt"> => ({
  name: "Kashi Darshan", destination: "Varanasi", duration: "2 Days", price: 4999, originalPrice: 5999,
  image: "/images/package.jpg", description: "Temples and ghats",
  highlights: ["Ganga Aarti", "Boat ride"], itinerary: ["Day 1: Arrive", "Day 2: Depart"], inclusions: ["Hotel"],
  category: "spiritual", ...over,
});

describe("Postgres backend: packages", () => {
  it("is selected by the test seam", () => {
    expect(isPostgres()).toBe(true);
  });

  it("adds a package with a server-side id and round-trips arrays, integers and createdAt", async () => {
    const added = await addPackage({ ...newPackage(), id: "client-id" } as Omit<TourPackage, "id" | "createdAt">);
    expect(added.id).not.toBe("client-id");
    expect(isIsoString(added.createdAt)).toBe(true);

    const [p] = await getPackages();
    expect(p).toMatchObject({
      id: added.id, name: "Kashi Darshan", price: 4999, originalPrice: 5999,
      highlights: ["Ganga Aarti", "Boat ride"], itinerary: ["Day 1: Arrive", "Day 2: Depart"], inclusions: ["Hotel"],
      category: "spiritual", hidden: false, createdAt: added.createdAt,
    });
    expect(typeof p.price).toBe("number");
    expect(isIsoString(p.createdAt)).toBe(true);
  });

  it("stores originalPrice 0 as 0 and a missing originalPrice as undefined", async () => {
    await addPackage(newPackage({ name: "zero", originalPrice: 0 }));
    await addPackage(newPackage({ name: "none", originalPrice: undefined }));
    const byName = Object.fromEntries((await getPackages()).map(p => [p.name, p]));
    expect(byName.zero.originalPrice).toBe(0);
    expect(byName.none.originalPrice).toBeUndefined();
    expect("originalPrice" in byName.none).toBe(true); // mapped key, undefined value (dropped by JSON)
  });

  it("lists newest first", async () => {
    const a = await addPackage(newPackage({ name: "first" }));
    await new Promise(r => setTimeout(r, 5));
    const b = await addPackage(newPackage({ name: "second" }));
    expect((await getPackages()).map(p => p.id)).toEqual([b.id, a.id]);
  });

  it("updates only the keys present, clears nullable fields with null and never rewrites id/createdAt", async () => {
    const added = await addPackage(newPackage());
    const updated = await updatePackage(added.id, {
      name: "Renamed", highlights: ["Only one"], originalPrice: null,
      id: "hijack", createdAt: "1999-01-01T00:00:00.000Z",
    } as Parameters<typeof updatePackage>[1]);
    expect(updated).toMatchObject({
      id: added.id, name: "Renamed", price: 4999, highlights: ["Only one"], itinerary: ["Day 1: Arrive", "Day 2: Depart"],
      createdAt: added.createdAt,
    });
    expect(updated!.originalPrice).toBeUndefined();

    // undefined leaves the value alone
    const again = await updatePackage(added.id, { price: 100, name: undefined });
    expect(again).toMatchObject({ name: "Renamed", price: 100 });
  });

  it("returns the unchanged row for an empty patch, and null for an unknown id", async () => {
    const added = await addPackage(newPackage());
    expect(await updatePackage(added.id, {})).toMatchObject({ id: added.id, name: "Kashi Darshan" });
    expect(await updatePackage("nope", { name: "x" })).toBeNull();
    expect(await updatePackage("nope", {})).toBeNull();
  });

  it("deletes by id", async () => {
    const added = await addPackage(newPackage());
    expect(await deletePackage(added.id)).toBe(true);
    expect(await deletePackage(added.id)).toBe(false);
    expect(await getPackages()).toEqual([]);
  });

  it("getPackageById returns one package (hidden too) or null", async () => {
    const a = await addPackage(newPackage({ name: "A", hidden: true }));
    await addPackage(newPackage({ name: "B" }));
    expect(await getPackageById(a.id)).toMatchObject({ id: a.id, name: "A", hidden: true, highlights: ["Ganga Aarti", "Boat ride"], createdAt: a.createdAt });
    expect(await getPackageById("missing")).toBeNull();
  });

  it("toggles hidden", async () => {
    const added = await addPackage(newPackage({ hidden: true }));
    expect((await getPackages())[0].hidden).toBe(true);
    expect((await updatePackage(added.id, { hidden: false }))!.hidden).toBe(false);
  });
});

describe("Postgres backend: reviews", () => {
  it("adds, updates, clears packageName and deletes", async () => {
    const r = await addReview({ name: "Asha", rating: 5, text: "Great", city: "Pune", packageName: "Kashi", active: false, source: "customer" });
    expect(isIsoString(r.createdAt)).toBe(true);
    const [got] = await getReviews();
    expect(got).toMatchObject({ id: r.id, name: "Asha", rating: 5, packageName: "Kashi", active: false, source: "customer" });

    const updated = await updateReview(r.id, { active: true, packageName: null });
    expect(updated).toMatchObject({ active: true, rating: 5, text: "Great", source: "customer" });
    expect(updated!.packageName).toBeUndefined();

    expect(await deleteReview(r.id)).toBe(true);
    expect(await getReviews()).toEqual([]);
  });

  it("maps a missing source to undefined (admin review)", async () => {
    await addReview({ name: "B", rating: 4, text: "ok", city: "X", active: true });
    const [got] = await getReviews();
    expect(got.source).toBeUndefined();
    expect(got.packageName).toBeUndefined();
  });
});

describe("Postgres backend: gallery and blogs", () => {
  it("gallery CRUD", async () => {
    const g = await addGalleryImage({ src: "/images/a.jpg", caption: "Ghat", category: "Varanasi", active: true });
    expect(await getGallery()).toMatchObject([{ id: g.id, src: "/images/a.jpg", caption: "Ghat", active: true }]);
    expect(await updateGalleryImage(g.id, { caption: "Dashashwamedh", active: false })).toMatchObject({ caption: "Dashashwamedh", active: false, src: "/images/a.jpg" });
    expect(await updateGalleryImage("missing", { caption: "x" })).toBeNull();
    expect(await deleteGalleryImage(g.id)).toBe(true);
    expect(await deleteGalleryImage(g.id)).toBe(false);
  });

  it("blog CRUD", async () => {
    const b = await addBlog({ title: "T", excerpt: "E", content: "C", image: "", category: "Travel", author: "A", active: true });
    const [got] = await getBlogs();
    expect(got).toMatchObject({ id: b.id, title: "T", excerpt: "E", content: "C", image: "", author: "A", active: true });
    expect(isIsoString(got.createdAt)).toBe(true);
    expect(await updateBlog(b.id, { title: "T2" })).toMatchObject({ title: "T2", content: "C" });
    expect(await deleteBlog(b.id)).toBe(true);
  });
});

describe("Postgres backend: FAQs", () => {
  it("sorts by order and clears Hindi fields with null", async () => {
    const third = await addFAQ({ question: "Q3", answer: "A3", active: true, order: 3 });
    await addFAQ({ question: "Q1", questionHi: "प्र1", answer: "A1", answerHi: "उ1", active: true, order: 1 });
    await addFAQ({ question: "Q2", answer: "A2", active: false, order: 2 });
    const faqs = await getFAQs();
    expect(faqs.map(f => f.question)).toEqual(["Q1", "Q2", "Q3"]);
    expect(faqs[0]).toMatchObject({ questionHi: "प्र1", answerHi: "उ1", order: 1 });
    expect(faqs[1].questionHi).toBeUndefined();

    await updateFAQ(third.id, { order: 0 });
    expect((await getFAQs())[0].id).toBe(third.id);

    const cleared = await updateFAQ(faqs[0].id, { questionHi: null, answerHi: null });
    expect(cleared!.questionHi).toBeUndefined();
    expect(cleared!.answerHi).toBeUndefined();
    expect(cleared!.question).toBe("Q1");

    expect(await deleteFAQ(third.id)).toBe(true);
    expect(await getFAQs()).toHaveLength(2);
  });
});

describe("Postgres backend: offers", () => {
  it("CRUD with an optional code", async () => {
    const o = await addOffer({ title: "Diwali", description: "Festive", discount: 15, code: "DIWALI", validFrom: "2026-10-01", validTo: "2026-11-30", active: true });
    expect(await getOffers()).toMatchObject([{ id: o.id, discount: 15, code: "DIWALI", validFrom: "2026-10-01", validTo: "2026-11-30" }]);
    const updated = await updateOffer(o.id, { code: null, discount: 20 });
    expect(updated).toMatchObject({ discount: 20, title: "Diwali" });
    expect(updated!.code).toBeUndefined();
    expect(await deleteOffer(o.id)).toBe(true);
    expect(await getOffers()).toEqual([]);
  });
});
