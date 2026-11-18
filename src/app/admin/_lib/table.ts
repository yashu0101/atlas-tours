import type { Review } from "@/lib/types";

/**
 * Pure list helpers for the admin: the pager label of the server-paginated Bookings /
 * Enquiries tables (filtering, sorting and CSV live server-side since review point #6:
 * src/lib/inbox-filters.ts, src/lib/inbox-csv.ts) and the N-5 review moderation filter.
 * No React, no DOM: unit-tested in tests/unit/admin-table.test.ts.
 */

export type PageSlice = {
  /** Current page (1-based). */
  page: number;
  pageCount: number;
  total: number;
  /** 1-based index of the first row shown (0 when empty) and of the last row shown. */
  first: number;
  last: number;
};

/** The pager state for one page of `rowCount` rows of a server response `{ total, page, pageSize }`. */
export function pageSlice({ total, page, pageSize }: { total: number; page: number; pageSize: number }, rowCount: number): PageSlice {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  return { page, pageCount, total, first: total && rowCount ? start + 1 : 0, last: start + rowCount };
}

/** Newest first, without mutating the input. Unparseable dates sort last. */
export function newestFirst<T extends { createdAt: string }>(items: readonly T[]): T[] {
  const time = (s: string) => { const t = Date.parse(s); return Number.isNaN(t) ? -Infinity : t; };
  return [...items].sort((a, b) => time(b.createdAt) - time(a.createdAt));
}

/** "Showing 1–25 of 80" (en dash). */
export const showingLabel = ({ first, last, total }: PageSlice) =>
  total ? `Showing ${first}–${last} of ${total}` : "Showing 0 of 0";

// ---------- reviews (N-5 moderation) ----------

export type ReviewFilter = "all" | "awaiting" | "active" | "inactive";
export const REVIEW_FILTERS: readonly ReviewFilter[] = ["all", "awaiting", "active", "inactive"];
export const REVIEW_FILTER_LABELS: Record<ReviewFilter, string> = { all: "All", awaiting: "Awaiting approval", active: "Active", inactive: "Inactive" };

/** Same rule as the public site (`isPublicReview`): only an explicit `false` hides a review. */
export const isReviewActive = (r: Review) => r.active !== false;
/** A customer-submitted review that has not been activated yet. */
export const isAwaitingApproval = (r: Review) => r.source === "customer" && !isReviewActive(r);

/** The three non-"all" filters partition the list: awaiting, active, other inactive. */
export function reviewFilterMatches(r: Review, filter: ReviewFilter): boolean {
  switch (filter) {
    case "all": return true;
    case "awaiting": return isAwaitingApproval(r);
    case "active": return isReviewActive(r);
    case "inactive": return !isReviewActive(r) && !isAwaitingApproval(r);
  }
}

export function reviewFilterCounts(reviews: readonly Review[]): Record<ReviewFilter, number> {
  const counts = { all: 0, awaiting: 0, active: 0, inactive: 0 };
  for (const r of reviews) for (const f of REVIEW_FILTERS) if (reviewFilterMatches(r, f)) counts[f]++;
  return counts;
}
