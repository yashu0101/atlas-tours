import { describe, expect, it } from "vitest";
import { getBlogs, getFAQs, getGallery, getOffers, getPackages, getReviews, seedContent, updatePackage } from "@/lib/db";
import { SEED_BLOGS, SEED_FAQS, SEED_GALLERY, SEED_OFFERS, SEED_PACKAGES, SEED_REVIEWS } from "@/lib/seed-data";
import { setupPgDb } from "../helpers/pglite-sql";

setupPgDb();

describe("seedContent (Postgres)", () => {
  it("inserts the default content, then inserts nothing on a re-run", async () => {
    const first = await seedContent();
    expect(first).toEqual({
      packages: SEED_PACKAGES.length, reviews: SEED_REVIEWS.length, gallery: SEED_GALLERY.length,
      blogs: SEED_BLOGS.length, faqs: SEED_FAQS.length, offers: SEED_OFFERS.length,
    });
    expect(await seedContent()).toEqual({ packages: 0, reviews: 0, gallery: 0, blogs: 0, faqs: 0, offers: 0 });
  });

  it("reads the seed back exactly as the JSON backend stores it", async () => {
    await seedContent();
    const byId = <T extends { id: string }>(xs: readonly T[]) => [...xs].sort((a, b) => a.id.localeCompare(b.id));
    // JSON.parse(JSON.stringify(...)) drops undefined optional fields, like an API response does.
    // exclusions is a NOT NULL DEFAULT [] column, so a seed package without it reads back as [].
    const plain = <T>(x: T): T => JSON.parse(JSON.stringify(x));
    expect(plain(byId(await getPackages()))).toEqual(plain(byId(SEED_PACKAGES.map(p => ({ ...p, hidden: !!p.hidden, exclusions: p.exclusions ?? [] })))));
    expect(plain(byId(await getReviews()))).toEqual(plain(byId(SEED_REVIEWS)));
    expect(plain(byId(await getGallery()))).toEqual(plain(byId(SEED_GALLERY)));
    expect(plain(byId(await getBlogs()))).toEqual(plain(byId(SEED_BLOGS)));
    expect(plain(await getFAQs())).toEqual(plain([...SEED_FAQS].sort((a, b) => a.order - b.order)));
    expect(await getOffers()).toEqual([]);
  });

  it("never overwrites a row an admin has edited", async () => {
    await seedContent();
    const id = SEED_PACKAGES[0].id;
    await updatePackage(id, { name: "Edited by admin" });
    await seedContent();
    expect((await getPackages()).find(p => p.id === id)!.name).toBe("Edited by admin");
  });
});
