import { describe, expect, it } from "vitest";
import {
  durationDays,
  isPackageSort,
  lowestPrice,
  relatedPackages,
  searchPackages,
  sortPackages,
} from "@/app/packages/package-utils";
import { makePackage } from "../helpers/temp-db";

const varanasi = makePackage({
  id: "v",
  name: "Divine Varanasi",
  destination: "Varanasi, Prayagraj",
  duration: "4 Days / 3 Nights",
  price: 8999,
  highlights: ["Ganga Aarti", "Kashi Vishwanath Temple"],
  category: "spiritual",
});
const rajasthan = makePackage({
  id: "r",
  name: "Royal Rajasthan",
  destination: "Jaipur, Udaipur",
  duration: "6 Days / 5 Nights",
  price: 15999,
  highlights: ["Amber Fort"],
  category: "heritage",
});
const odisha = makePackage({
  id: "o",
  name: "Sacred Odisha",
  destination: "Puri, Konark",
  duration: "5 Days",
  price: 11999,
  highlights: ["Jagannath Temple"],
  category: "spiritual",
});
const custom = makePackage({ id: "c", name: "Custom", duration: "Flexible", price: 500, category: "cultural" });
const all = [varanasi, rajasthan, odisha];

describe("durationDays", () => {
  it("reads the first number of a free-text duration", () => {
    expect(durationDays("4 Days / 3 Nights")).toBe(4);
    expect(durationDays("10 days")).toBe(10);
    expect(durationDays("Flexible")).toBeNull();
    expect(durationDays(undefined)).toBeNull();
  });
});

describe("searchPackages", () => {
  it("returns everything for a blank query", () => {
    expect(searchPackages(all, "  ")).toEqual(all);
  });

  it("matches name, destination and highlights case-insensitively", () => {
    expect(searchPackages(all, "jaipur").map((p) => p.id)).toEqual(["r"]);
    expect(searchPackages(all, "TEMPLE").map((p) => p.id)).toEqual(["v", "o"]);
    expect(searchPackages(all, "royal").map((p) => p.id)).toEqual(["r"]);
  });

  it("requires every word to match", () => {
    expect(searchPackages(all, "temple puri").map((p) => p.id)).toEqual(["o"]);
    expect(searchPackages(all, "temple jaipur")).toEqual([]);
  });
});

describe("sortPackages", () => {
  it("keeps the admin order for recommended and never mutates the input", () => {
    const input = [...all];
    expect(sortPackages(input, "recommended")).toEqual(all);
    sortPackages(input, "price-desc");
    expect(input).toEqual(all);
  });

  it("sorts by price both ways", () => {
    expect(sortPackages(all, "price-asc").map((p) => p.id)).toEqual(["v", "o", "r"]);
    expect(sortPackages(all, "price-desc").map((p) => p.id)).toEqual(["r", "o", "v"]);
  });

  it("sorts by day count, putting durations without a number last", () => {
    expect(sortPackages([custom, ...all], "duration-asc").map((p) => p.id)).toEqual(["v", "o", "r", "c"]);
  });

  it("validates sort values from the URL", () => {
    expect(isPackageSort("price-asc")).toBe(true);
    expect(isPackageSort("cheapest")).toBe(false);
    expect(isPackageSort(undefined)).toBe(false);
  });
});

describe("lowestPrice", () => {
  it("returns the minimum or null", () => {
    expect(lowestPrice(all)).toBe(8999);
    expect(lowestPrice([])).toBeNull();
  });
});

describe("relatedPackages", () => {
  it("excludes the current package and lists the same category first", () => {
    expect(relatedPackages([rajasthan, varanasi, custom, odisha], varanasi).map((p) => p.id)).toEqual(["o", "r", "c"]);
  });

  it("respects the limit", () => {
    expect(relatedPackages([varanasi, rajasthan, odisha, custom], varanasi, 2)).toHaveLength(2);
  });
});
