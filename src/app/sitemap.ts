import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// Single-page site for now; add package/blog detail routes here once they exist.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${SITE_URL}/`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
