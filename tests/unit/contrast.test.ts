import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { AA_LARGE, AA_TEXT, contrast } from "../helpers/contrast";

// E-10: WCAG AA contrast for the public site. Theme colours are read from globals.css so a
// change to a variable is checked here; hardcoded component colours are listed inline.

const css = readFileSync(fileURLToPath(new URL("../../src/app/globals.css", import.meta.url)), "utf8");

function readVars(selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`);
  if (start < 0) throw new Error(`No ${selector} block in globals.css`);
  const block = css.slice(start, css.indexOf("}", start));
  const vars: Record<string, string> = {};
  for (const m of block.matchAll(/(--[\w-]+):\s*([^;]+);/g)) vars[m[1]] = m[2].trim();
  return vars;
}

const light = readVars(":root");
const dark = { ...light, ...readVars('[data-theme="dark"]') };
type Theme = typeof light;

/** Paint `top` over `under` and return an opaque rgb() string (for stacked translucent layers). */
function flatten(top: string, under: string): string {
  const m = top.match(/rgba?\(([^)]+)\)/);
  if (!m) return top;
  const [r, g, b, a = "1"] = m[1].split(",").map((s) => s.trim());
  const base = under.startsWith("#") ? hexToRgb(under) : (under.match(/\d+(\.\d+)?/g) ?? []).map(Number);
  const mix = (c: number, i: number) => Math.round(c * Number(a) + base[i] * (1 - Number(a)));
  return `rgb(${[Number(r), Number(g), Number(b)].map(mix).join(",")})`;
}
function hexToRgb(hex: string): number[] {
  const h = hex.length === 4 ? hex.slice(1).split("").map((x) => x + x).join("") : hex.slice(1);
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}

type Pair = [label: string, fg: (t: Theme) => string, bg: (t: Theme) => string, min: number];
const v = (name: string) => (t: Theme) => t[name];
const c = (value: string) => () => value;
const tint = (overlay: string, under: (t: Theme) => string) => (t: Theme) => flatten(overlay, under(t));

// Pairs that depend on the theme variables — checked in both themes.
const themed: Pair[] = [
  ["body text on page", v("--text"), v("--bg"), AA_TEXT],
  ["secondary text on page", v("--text2"), v("--bg"), AA_TEXT],
  ["secondary text on bg2", v("--text2"), v("--bg2"), AA_TEXT],
  ["secondary text on bg3 (Offers)", v("--text2"), v("--bg3"), AA_TEXT],
  ["secondary text on card", v("--text2"), v("--card-bg"), AA_TEXT],
  ["primary headings/links on page", v("--primary"), v("--bg"), AA_TEXT],
  ["primary on bg2", v("--primary"), v("--bg2"), AA_TEXT],
  ["primary on card", v("--primary"), v("--card-bg"), AA_TEXT],
  ["primary chip text on chip tint (dark)", v("--primary"), tint("rgba(91,143,217,0.12)", v("--card-bg")), AA_TEXT],
  ["orange text on page", v("--orange-text"), v("--bg"), AA_TEXT],
  ["orange text on card", v("--orange-text"), v("--card-bg"), AA_TEXT],
  ["orange badge on bg2 tint", v("--orange-text"), tint("rgba(230,126,34,0.1)", v("--bg2")), AA_TEXT],
  ["orange badge on bg3 tint (Offers)", v("--orange-text"), tint("rgba(230,126,34,0.1)", v("--bg3")), AA_TEXT],
  ["Gallery filter hover tint", v("--orange-text"), tint("rgba(230,126,34,0.2)", v("--bg2")), AA_TEXT],
  ["booking estimate total on tint", v("--orange-text"), tint("rgba(230,126,34,0.08)", v("--card-bg")), AA_TEXT],
  ["success message on tint", v("--success-text"), tint("rgba(39,174,96,0.1)", v("--card-bg")), AA_TEXT],
  ["offer status ok on card", v("--success-text"), v("--card-bg"), AA_TEXT],
  ["offer status error on card", v("--error-text"), v("--card-bg"), AA_TEXT],
  ["input border vs card (UI)", v("--input-border"), v("--card-bg"), AA_LARGE],
  ["muted fallback #6e6e6e / --text2 on bg3", (t) => (t === light ? "#6e6e6e" : t["--text2"]), v("--bg3"), AA_TEXT],
  ["blog date #767676 / --text2 on card", (t) => (t === light ? "#767676" : t["--text2"]), v("--card-bg"), AA_TEXT],
];

// Pairs on fixed (theme-independent) surfaces: brand fills, navy sections, photo scrims.
// Photo scrims are measured over a bright sky tone (#c0d8ea, from the hero poster).
const SKY = "#c0d8ea";
const fixed: Pair[] = [
  ["dark text on orange stop", v("--on-accent"), c("#e67e22"), AA_TEXT],
  ["dark text on gold stop", v("--on-accent"), c("#f39c12"), AA_TEXT],
  ["struck-through price on orange", c("rgba(10,22,40,0.8)"), c("#e67e22"), AA_TEXT],
  ["white on discount green", c("#ffffff"), c("#1e874a"), AA_TEXT],
  ["gold text on Reviews navy", v("--gold-text"), c("#1a3a6b"), AA_TEXT],
  ["gold text on Reviews card", v("--gold-text"), c(flatten("rgba(255,255,255,0.08)", "#1a3a6b")), AA_TEXT],
  ["gold badge on Reviews tint", v("--gold-text"), c(flatten("rgba(243,156,18,0.2)", "#1a3a6b")), AA_TEXT],
  ["Reviews meta on card", c("rgba(255,255,255,0.7)"), c(flatten("rgba(255,255,255,0.08)", "#1a3a6b")), AA_TEXT],
  ["Reviews dot vs navy (UI)", c("rgba(255,255,255,0.4)"), c("#1a3a6b"), AA_LARGE],
  ["Counter label on card", c("rgba(255,255,255,0.7)"), c(flatten("rgba(255,255,255,0.08)", "#1a3a6b")), AA_TEXT],
  ["Footer link/muted text", c("rgba(255,255,255,0.74)"), c("#0f2548"), AA_TEXT],
  ["Footer muted text (bottom of gradient)", c("rgba(255,255,255,0.74)"), c("#081429"), AA_TEXT],
  ["Footer headings (gold)", c("#f6b144"), c("#0f2548"), AA_TEXT],
  ["Footer primary button text", c("#0a1628"), c("#e67e22"), AA_TEXT],
  ["WhatsApp timestamp", c("#767676"), c("#ffffff"), AA_TEXT],
  ["WhatsApp input border (UI)", c("#949494"), c("#ffffff"), AA_LARGE],
  ["WhatsApp badge", c("#ffffff"), c("#c0392b"), AA_TEXT],
  ["package WhatsApp button text", c("#178841"), c("#ffffff"), AA_TEXT],
  ["login error", c("#f3a69e"), c(flatten("rgba(231,76,60,0.2)", flatten("rgba(255,255,255,0.05)", "#1a3a6b"))), AA_TEXT],
  ["login input border (UI)", c("rgba(255,255,255,0.42)"), c(flatten("rgba(255,255,255,0.05)", "#1a3a6b")), AA_LARGE],
  ["hero white text, centre scrim", c("rgba(255,255,255,0.85)"), c(flatten("rgba(15,37,72,0.8)", SKY)), AA_TEXT],
  ["hero scroll hint, centre scrim", c("rgba(255,255,255,0.8)"), c(flatten("rgba(15,37,72,0.8)", SKY)), AA_TEXT],
  ["hero stat label on glass", c("rgba(255,255,255,0.9)"), c(flatten("rgba(255,255,255,0.1)", flatten("rgba(15,37,72,0.8)", SKY))), AA_TEXT],
  ["hero gold subtitle, centre scrim", v("--gold-text"), c(flatten("rgba(15,37,72,0.8)", SKY)), AA_TEXT],
  ["hero gold stat value on glass (large)", v("--gold-text"), c(flatten("rgba(255,255,255,0.1)", flatten("rgba(15,37,72,0.8)", SKY))), AA_LARGE],
  ["package hero breadcrumb", c("#ffffff"), c(flatten("rgba(10,22,40,0.65)", SKY)), AA_TEXT],
  ["package hero meta", c("rgba(255,255,255,0.9)"), c(flatten("rgba(10,22,40,0.65)", SKY)), AA_TEXT],
  ["package hero category badge", c("#ffffff"), c(flatten("rgba(230,126,34,0.2)", flatten("rgba(10,22,40,0.65)", SKY))), AA_TEXT],
  ["gallery caption at the bottom of the overlay", c("#ffffff"), c(flatten("rgba(26,58,107,0.63)", SKY)), AA_TEXT],
];

describe("E-10 colour contrast", () => {
  for (const [name, theme] of [["light", light], ["dark", dark]] as const) {
    describe(`${name} theme`, () => {
      it.each(themed)("%s", (_label, fg, bg, min) => {
        expect(contrast(fg(theme), bg(theme))).toBeGreaterThanOrEqual(min);
      });
    });
  }
  describe("fixed surfaces", () => {
    it.each(fixed)("%s", (_label, fg, bg, min) => {
      expect(contrast(fg(light), bg(light))).toBeGreaterThanOrEqual(min);
    });
  });
});
