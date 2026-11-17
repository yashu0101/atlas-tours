// WCAG 2.x contrast helpers (E-10). Used by tests/unit/contrast.test.ts.
// Colours are "#rgb", "#rrggbb" or "rgba(r,g,b,a)"; a translucent foreground is
// composited over the background before measuring, as a browser would paint it.

type RGB = [number, number, number];
type RGBA = [number, number, number, number];

export function parseColor(input: string): RGBA {
  const c = input.trim().toLowerCase();
  if (c === "#fff" || c === "white") return [255, 255, 255, 1];
  const hex = c.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/);
  if (hex) {
    let h = hex[1];
    if (h.length === 3) h = h.split("").map((x) => x + x).join("");
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), 1];
  }
  const fn = c.match(/^rgba?\(([^)]+)\)$/);
  if (fn) {
    const [r, g, b, a = "1"] = fn[1].split(",").map((s) => s.trim());
    return [Number(r), Number(g), Number(b), Number(a)];
  }
  throw new Error(`Unsupported colour: ${input}`);
}

/** Paint `fg` (possibly translucent) over an opaque `bg`. */
export function composite(fg: string, bg: string): RGB {
  const [r, g, b, a] = parseColor(fg);
  const [br, bgg, bb] = parseColor(bg);
  return [r * a + br * (1 - a), g * a + bgg * (1 - a), b * a + bb * (1 - a)];
}

export function luminance([r, g, b]: RGB): number {
  const lin = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** Contrast ratio of `fg` painted on `bg` (1–21). `bg` may itself be translucent over `base`. */
export function contrast(fg: string, bg: string, base = "#ffffff"): number {
  const bgRgb = composite(bg, base);
  const bgHex = `rgb(${bgRgb.map((v) => Math.round(v)).join(",")})`;
  const fgRgb = composite(fg, bgHex);
  const l1 = luminance(fgRgb);
  const l2 = luminance(bgRgb);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

export const AA_TEXT = 4.5;
export const AA_LARGE = 3;
