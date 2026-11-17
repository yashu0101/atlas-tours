import type { BlogPost } from "@/lib/types";

/**
 * Splits plain-text blog content into paragraphs on blank lines (G-07).
 * Single line breaks stay inside a paragraph (rendered with `white-space: pre-line`).
 * Content is never treated as HTML.
 */
export function contentParagraphs(content: string): string[] {
  return content
    .replace(/\r\n?/g, "\n")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

/** Meta description: the excerpt, or the start of the content, collapsed to one line and capped at ~160 chars. */
export function metaDescription(post: Pick<BlogPost, "excerpt" | "content">, max = 160): string {
  const text = (post.excerpt || post.content || "").replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}
