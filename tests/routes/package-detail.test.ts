import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { makePackage, useTempDb } from "../helpers/temp-db";
import type { BlogPost } from "@/lib/types";

type PageModule = typeof import("@/app/packages/[id]/page");
type SitemapModule = typeof import("@/app/sitemap");

let page: PageModule;
let sitemap: SitemapModule;
let db: ReturnType<typeof useTempDb>;

const blog = (id: string, active: boolean): BlogPost => ({
  id,
  title: id,
  excerpt: "",
  content: "",
  image: "",
  category: "Guide",
  author: "Atlas Team",
  active,
  createdAt: "2026-01-01T00:00:00.000Z",
});

beforeAll(async () => {
  db = useTempDb({
    packages: [
      makePackage({ id: "visible", name: "Ganga Aarti Tour", description: "Evening aarti on the ghats.", image: "https://example.com/a.jpg" }),
      makePackage({ id: "hidden", name: "Secret Tour", hidden: true }),
    ],
    blogs: [blog("b-live", true), blog("b-off", false)],
  });
  page = await import("@/app/packages/[id]/page");
  sitemap = await import("@/app/sitemap");
});

afterAll(() => db.cleanup());

const params = (id: string) => ({ params: Promise.resolve({ id }) });

describe("/packages/[id] (G-03)", () => {
  it("builds metadata with title, description, canonical and the package image", async () => {
    const meta = await page.generateMetadata(params("visible"));
    expect(meta.title).toBe("Ganga Aarti Tour");
    expect(meta.description).toBe("Evening aarti on the ghats.");
    expect(meta.alternates?.canonical).toBe("/packages/visible");
    expect(JSON.stringify(meta.openGraph?.images)).toContain("https://example.com/a.jpg");
  });

  it("calls notFound() for hidden and unknown packages", async () => {
    for (const id of ["hidden", "missing"]) {
      await expect(page.default(params(id))).rejects.toMatchObject({ digest: expect.stringMatching(/404/) });
      const meta = await page.generateMetadata(params(id));
      expect(meta.robots).toMatchObject({ index: false });
    }
  });

  it("renders a visible package without throwing", async () => {
    await expect(page.default(params("visible"))).resolves.toBeTruthy();
  });
});

describe("sitemap", () => {
  it("lists visible package and blog detail URLs only", async () => {
    const urls = (await sitemap.default()).map((e) => e.url);
    expect(urls.some((u) => u.endsWith("/packages/visible"))).toBe(true);
    expect(urls.some((u) => u.endsWith("/packages/hidden"))).toBe(false);
    expect(urls.some((u) => u.endsWith("/blog/b-live"))).toBe(true);
    expect(urls.some((u) => u.endsWith("/blog/b-off"))).toBe(false);
    // N-5/N-6 form pages are listed; per-visitor pages (N-4/N-7) are not.
    expect(urls.some((u) => u.endsWith("/plan-trip"))).toBe(true);
    expect(urls.some((u) => u.endsWith("/reviews/new"))).toBe(true);
    expect(urls.some((u) => /\/(track|wishlist|compare)$/.test(u))).toBe(false);
  });
});
