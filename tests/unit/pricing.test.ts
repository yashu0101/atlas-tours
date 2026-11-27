import { describe, expect, it } from "vitest";
import { groupSizeLabel, hasPricing, lowestRate, parsePricing, rateFor } from "@/lib/pricing";
import type { PackagePricing } from "@/lib/types";

// N-22: brochure price grid (hotel category × group size).
const grid: PackagePricing = {
  groupSizes: [2, 4, 6],
  tiers: [
    { name: "3★ Budget", prices: [15400, 13600, 13100], extraBed: 6900, childNoBed: 4500 },
    { name: "4★ Deluxe", prices: [20600, null, 18300] },
  ],
};

describe("rateFor", () => {
  it("uses the largest group size not above the number of travellers", () => {
    const [budget] = grid.tiers;
    expect(rateFor(grid, budget, 2)).toBe(15400);
    expect(rateFor(grid, budget, 3)).toBe(15400);
    expect(rateFor(grid, budget, 4)).toBe(13600);
    expect(rateFor(grid, budget, 5)).toBe(13600);
    expect(rateFor(grid, budget, 40)).toBe(13100);
  });

  it("charges the first column to groups smaller than it", () => {
    expect(rateFor(grid, grid.tiers[0], 1)).toBe(15400);
  });

  it("is null for a column without a rate", () => {
    expect(rateFor(grid, grid.tiers[1], 4)).toBeNull();
  });
});

describe("helpers", () => {
  it("lowestRate ignores empty cells", () => {
    expect(lowestRate(grid)).toBe(13100);
  });

  it("hasPricing needs columns and categories", () => {
    expect(hasPricing({ pricing: grid })).toBe(true);
    expect(hasPricing({})).toBe(false);
    expect(hasPricing({ pricing: { groupSizes: [2], tiers: [] } })).toBe(false);
  });

  it("labels the last column as open-ended", () => {
    expect(groupSizeLabel([2, 4, 6], 0)).toBe("2 Pax");
    expect(groupSizeLabel([2, 4, 6], 2)).toBe("6+ Pax");
    expect(groupSizeLabel([2], 0)).toBe("2 Pax");
  });
});

describe("parsePricing", () => {
  it("accepts a valid grid, coerces numeric strings and drops empty extras", () => {
    const r = parsePricing({
      groupSizes: ["2", 4],
      tiers: [{ name: " 3★ Deluxe ", prices: ["16000", ""], extraBed: "", childNoBed: "4800" }],
    });
    expect(r).toEqual({ ok: true, value: { groupSizes: [2, 4], tiers: [{ name: "3★ Deluxe", prices: [16000, null], childNoBed: 4800 }] } });
  });

  it.each([
    ["not an object", []],
    ["no group sizes", { groupSizes: [], tiers: [{ name: "a", prices: [] }] }],
    ["decreasing group sizes", { groupSizes: [4, 2], tiers: [{ name: "a", prices: [1, 1] }] }],
    ["zero group size", { groupSizes: [0], tiers: [{ name: "a", prices: [1] }] }],
    ["no categories", { groupSizes: [2], tiers: [] }],
    ["unnamed category", { groupSizes: [2], tiers: [{ name: " ", prices: [1] }] }],
    ["duplicate category", { groupSizes: [2], tiers: [{ name: "a", prices: [1] }, { name: "a", prices: [2] }] }],
    ["price count mismatch", { groupSizes: [2, 4], tiers: [{ name: "a", prices: [1] }] }],
    ["decimal price", { groupSizes: [2], tiers: [{ name: "a", prices: [99.5] }] }],
    ["negative price", { groupSizes: [2], tiers: [{ name: "a", prices: [-1] }] }],
    ["all prices empty", { groupSizes: [2], tiers: [{ name: "a", prices: [null] }] }],
    ["bad extra bed", { groupSizes: [2], tiers: [{ name: "a", prices: [1], extraBed: "x" }] }],
  ])("rejects %s", (_label, input) => {
    expect(parsePricing(input).ok).toBe(false);
  });
});
