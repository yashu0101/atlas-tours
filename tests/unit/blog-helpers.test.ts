import { describe, expect, it } from "vitest";
import { formatISTDate } from "@/app/blog/_lib/format-date";
import { contentParagraphs, metaDescription } from "@/app/blog/_lib/content";
import { blogPostingJsonLd, jsonLdString, SITE_URL } from "@/lib/seo";

describe("formatISTDate", () => {
  it("formats in IST like en-IN short dates", () => {
    expect(formatISTDate("2024-06-01T00:00:00.000Z")).toBe("1 Jun 2024");
    expect(formatISTDate("2024-09-15T12:00:00.000Z")).toBe("15 Sept 2024");
  });

  it("rolls over to the next day at 18:30 UTC (IST midnight)", () => {
    expect(formatISTDate("2024-06-01T18:29:00.000Z")).toBe("1 Jun 2024");
    expect(formatISTDate("2024-06-01T18:30:00.000Z")).toBe("2 Jun 2024");
  });

  it("keeps the calendar day of date-only strings", () => {
    expect(formatISTDate("2025-12-31")).toBe("31 Dec 2025");
  });

  it("returns an empty string for unparseable input", () => {
    expect(formatISTDate("")).toBe("");
    expect(formatISTDate("not a date")).toBe("");
  });
});

describe("contentParagraphs", () => {
  it("splits on blank lines, keeps single line breaks, drops empties", () => {
    expect(contentParagraphs("One\nstill one\n\n\nTwo\r\n\r\nThree  \n\n  ")).toEqual(["One\nstill one", "Two", "Three"]);
  });

  it("returns [] for empty content", () => {
    expect(contentParagraphs("")).toEqual([]);
  });

  it("never interprets HTML (returns it as text)", () => {
    expect(contentParagraphs("<script>alert(1)</script>")).toEqual(["<script>alert(1)</script>"]);
  });
});

describe("metaDescription", () => {
  it("prefers the excerpt and collapses whitespace", () => {
    expect(metaDescription({ excerpt: "Short\n  excerpt", content: "Long content" })).toBe("Short excerpt");
  });

  it("falls back to content and caps the length on a word boundary", () => {
    const out = metaDescription({ excerpt: "", content: "word ".repeat(100) });
    expect(out.length).toBeLessThanOrEqual(160);
    expect(out.endsWith("word…")).toBe(true);
  });
});

describe("blogPostingJsonLd", () => {
  const post = {
    id: "b1",
    title: "Temples of Varanasi",
    excerpt: "Sacred temples",
    image: "/images/package.jpg",
    author: "Atlas Team",
    category: "Spiritual",
    createdAt: "2024-06-01T00:00:00.000Z",
  };

  it("builds a BlogPosting with absolute URLs", () => {
    const ld = blogPostingJsonLd(post);
    expect(ld["@type"]).toBe("BlogPosting");
    expect(ld.headline).toBe(post.title);
    expect(ld.datePublished).toBe(post.createdAt);
    expect(ld.image).toEqual([`${SITE_URL}/images/package.jpg`]);
    expect(ld.url).toBe(`${SITE_URL}/blog/b1`);
    expect(ld.author).toEqual({ "@type": "Organization", name: "Atlas Team" });
  });

  it("keeps https image URLs and serialises safely", () => {
    const ld = blogPostingJsonLd({ ...post, image: "https://example.com/a.jpg", title: "</script><b>" });
    expect(ld.image).toEqual(["https://example.com/a.jpg"]);
    expect(jsonLdString(ld)).not.toContain("</script>");
  });
});
