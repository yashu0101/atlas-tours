import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { PHONE_DISPLAY, SITE_CONFIG } from "@/lib/config";
import { travelAgencyJsonLd } from "@/lib/seo";

// C-09: SITE_CONFIG is the single source of truth for public contact details.
describe("site contact config", () => {
  it("formats the display phone from SITE_CONFIG.phone", () => {
    expect(SITE_CONFIG.phone).toMatch(/^\+91\d{10}$/);
    expect(PHONE_DISPLAY).toBe(`+91 ${SITE_CONFIG.phone.slice(3)}`);
  });

  it("keeps the WhatsApp number in sync with the phone", () => {
    expect(`+${SITE_CONFIG.whatsapp}`).toBe(SITE_CONFIG.phone);
  });

  it("uses SITE_CONFIG in the TravelAgency JSON-LD", () => {
    const ld = travelAgencyJsonLd();
    expect(ld.telephone).toBe(SITE_CONFIG.phone);
    expect(ld.email).toBe(SITE_CONFIG.email);
  });

  it("has no hardcoded phone/email literals in components", () => {
    const dir = join(process.cwd(), "src", "components");
    const files = readdirSync(dir).filter(f => /\.tsx?$/.test(f) && statSync(join(dir, f)).isFile());
    const digits = SITE_CONFIG.whatsapp.slice(2); // national number
    const offenders = files.filter(f => {
      const src = readFileSync(join(dir, f), "utf8");
      return src.includes(digits) || src.includes(SITE_CONFIG.email) || /@gmail\.com/.test(src);
    });
    expect(offenders).toEqual([]);
  });
});

// Q-7: Hero stats and the Counter section read the same numbers from SITE_STATS.
describe("site stats", () => {
  it("has no hardcoded stat numbers in Hero or Counter", () => {
    for (const f of ["Hero.tsx", "Counter.tsx"]) {
      const src = readFileSync(join(process.cwd(), "src", "components", f), "utf8");
      expect(src, f).toContain("SITE_STATS");
      expect(src, f).not.toMatch(/"\d+\+"|num:\s*\d/);
    }
  });
});
