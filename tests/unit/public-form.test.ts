import { describe, expect, it } from "vitest";
import { earliestTravelDate } from "@/lib/public-form";

describe("earliestTravelDate (past travel dates are rejected)", () => {
  it("is yesterday in India (IST), one day of slack for visitors behind IST", () => {
    // 2026-11-18 10:00 IST
    expect(earliestTravelDate(new Date("2026-11-18T04:30:00Z"))).toBe("2026-11-17");
  });

  it("follows the IST calendar day, not UTC", () => {
    // 2026-11-18 20:00 UTC = 2026-11-19 01:30 IST → yesterday in IST is the 18th
    expect(earliestTravelDate(new Date("2026-11-18T20:00:00Z"))).toBe("2026-11-18");
  });
});
