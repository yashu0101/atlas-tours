import { describe, expect, it } from "vitest";
import { newestFirst, pageSlice, reviewFilterCounts, reviewFilterMatches, showingLabel } from "@/app/admin/_lib/table";
import type { Review } from "@/lib/types";

// Filtering / CSV moved server-side (review point #6): see inbox-filters.test.ts, inbox-csv.test.ts.

describe("newestFirst", () => {
  it("sorts by createdAt descending without mutating, unparseable last", () => {
    const items = [
      { id: "a", createdAt: "2026-01-01T00:00:00Z" },
      { id: "bad", createdAt: "nope" },
      { id: "c", createdAt: "2026-03-01T00:00:00Z" },
    ];
    expect(newestFirst(items).map(i => i.id)).toEqual(["c", "a", "bad"]);
    expect(items.map(i => i.id)).toEqual(["a", "bad", "c"]);
  });
});

describe("pageSlice (server page → pager)", () => {
  it("labels a page of a server response", () => {
    const p1 = pageSlice({ total: 80, page: 1, pageSize: 25 }, 25);
    expect(p1).toMatchObject({ page: 1, pageCount: 4, first: 1, last: 25 });
    expect(showingLabel(p1)).toBe("Showing 1–25 of 80");
    const p4 = pageSlice({ total: 80, page: 4, pageSize: 25 }, 5);
    expect(showingLabel(p4)).toBe("Showing 76–80 of 80");
    expect(p4.pageCount).toBe(4);
  });

  it("handles an empty result", () => {
    const p = pageSlice({ total: 0, page: 1, pageSize: 25 }, 0);
    expect(p).toMatchObject({ page: 1, pageCount: 1, total: 0, first: 0, last: 0 });
    expect(showingLabel(p)).toBe("Showing 0 of 0");
  });
});

describe("review moderation filters", () => {
  const review = (over: Partial<Review>): Review => ({
    id: "r", name: "N", rating: 5, text: "t", city: "c", active: true, createdAt: "2026-01-01T00:00:00Z", ...over,
  });
  const reviews = [
    review({ id: "admin-active" }),
    review({ id: "admin-inactive", active: false }),
    review({ id: "customer-waiting", source: "customer", active: false }),
    review({ id: "customer-approved", source: "customer", active: true }),
  ];

  it("partitions reviews into awaiting / active / inactive", () => {
    const ids = (f: Parameters<typeof reviewFilterMatches>[1]) => reviews.filter(r => reviewFilterMatches(r, f)).map(r => r.id);
    expect(ids("all")).toHaveLength(4);
    expect(ids("awaiting")).toEqual(["customer-waiting"]);
    expect(ids("active")).toEqual(["admin-active", "customer-approved"]);
    expect(ids("inactive")).toEqual(["admin-inactive"]);
  });

  it("counts each filter", () => {
    expect(reviewFilterCounts(reviews)).toEqual({ all: 4, awaiting: 1, active: 2, inactive: 1 });
  });
});
