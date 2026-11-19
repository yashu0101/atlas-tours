import { describe, expect, it } from "vitest";
import { parseItineraryDay, tripRoute } from "@/app/packages/package-utils";
import { SEED_PACKAGES } from "@/lib/seed-data";

// N-18: detailed itinerary lines ("Day N: Title | point | Overnight in Place") and the route strip.

describe("parseItineraryDay", () => {
  it("splits title, points and the overnight stay", () => {
    expect(parseItineraryDay("Day 3: Jaipur → Jodhpur | Morning departure | Mehrangarh Fort | Overnight in Jodhpur")).toEqual({
      title: "Jaipur → Jodhpur",
      points: ["Morning departure", "Mehrangarh Fort"],
      overnight: "Jodhpur",
    });
  });

  it("accepts 'Overnight at', 'Overnight:' and capitalises the place", () => {
    expect(parseItineraryDay("Day 1: A | Overnight at Bhubaneswar").overnight).toBe("Bhubaneswar");
    expect(parseItineraryDay("Day 1: A | Overnight: Puri").overnight).toBe("Puri");
    expect(parseItineraryDay("Day 1: A | overnight at sam desert camp").overnight).toBe("Sam desert camp");
  });

  it("keeps old single-line entries as a title only", () => {
    expect(parseItineraryDay("Day 2: Kashi Vishwanath, Sarnath, Local Temples")).toEqual({
      title: "Kashi Vishwanath, Sarnath, Local Temples",
      points: [],
      overnight: null,
    });
  });

  it("ignores empty points", () => {
    expect(parseItineraryDay("Day 1: A | | B |").points).toEqual(["B"]);
  });
});

describe("tripRoute", () => {
  it("merges consecutive nights and adds start and end", () => {
    const rajasthan = SEED_PACKAGES.find((p) => p.id === "pkg-rajasthan")!;
    expect(tripRoute(rajasthan.itinerary, rajasthan.startsFrom)).toEqual([
      { place: "Prayagraj", nights: 0, kind: "start" },
      { place: "Jaipur", nights: 2, kind: "stay" },
      { place: "Jodhpur", nights: 1, kind: "stay" },
      { place: "Jaisalmer", nights: 1, kind: "stay" },
      { place: "Sam desert camp", nights: 1, kind: "stay" },
      { place: "Udaipur", nights: 2, kind: "stay" },
      { place: "Prayagraj", nights: 0, kind: "end" },
    ]);
  });

  it("does not repeat the start when the trip begins with a stay there", () => {
    const odisha = SEED_PACKAGES.find((p) => p.id === "pkg-odisha")!;
    expect(tripRoute(odisha.itinerary, odisha.startsFrom)).toEqual([
      { place: "Bhubaneswar", nights: 1, kind: "stay" },
      { place: "Puri", nights: 3, kind: "stay" },
      { place: "Bhubaneswar", nights: 1, kind: "stay" },
    ]);
  });

  it("nights add up to the package duration", () => {
    for (const id of ["pkg-rajasthan", "pkg-odisha"]) {
      const p = SEED_PACKAGES.find((x) => x.id === id)!;
      const nights = tripRoute(p.itinerary, p.startsFrom).reduce((n, s) => n + s.nights, 0);
      expect(p.duration).toContain(`${nights} Nights`);
    }
  });

  it("is empty when no overnight stays are given", () => {
    expect(tripRoute(["Day 1: Arrival", "Day 2: Departure"], "Varanasi")).toEqual([]);
  });
});
