import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { getBlogs, getPackages } from "@/lib/db";
import { isPublicBlog, isPublicPackage } from "@/lib/visibility";

// Read from the DB per request, like the pages, so new/hidden content is reflected immediately.
export const dynamic = "force-dynamic";

/** Loads one entity list; a DB failure must not take the whole sitemap down. */
async function loadVisible<T>(label: string, load: () => Promise<T[]>, isPublic: (item: T) => boolean): Promise<T[]> {
  try {
    const items = await load();
    return Array.isArray(items) ? items.filter(isPublic) : [];
  } catch (err) {
    console.error(`[sitemap] failed to load ${label}:`, err);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [packages, blogs] = await Promise.all([
    loadVisible("packages", getPackages, isPublicPackage),
    loadVisible("blogs", getBlogs, isPublicBlog),
  ]);

  return [
    {
      url: `${SITE_URL}/`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    // N-5 / N-6 public forms. /track, /wishlist and /compare are per-visitor pages (noindex).
    ...["/plan-trip", "/reviews/new"].map((path) => ({
      url: `${SITE_URL}${path}`,
      changeFrequency: "yearly" as const,
      priority: 0.5,
    })),
    ...packages.map((p) => ({
      url: `${SITE_URL}/packages/${encodeURIComponent(p.id)}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...blogs.map((b) => ({
      url: `${SITE_URL}/blog/${encodeURIComponent(b.id)}`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
