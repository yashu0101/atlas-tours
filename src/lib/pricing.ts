import type { PackagePricing, PricingTier } from "./types";

/**
 * N-22: price grid of a package — hotel categories (rows) × group sizes (columns), as on the
 * client's brochures ("3★ Deluxe, 4 PAX: ₹14,200 per person"), plus optional extra-bed and
 * child-without-bed rates per category. Shared by the API (validation, booking amount), the
 * package page and the booking form, so the customer's estimate and the saved amount agree.
 */

export const PRICING_LIMITS = {
  maxGroupSizes: 10,
  maxTiers: 12,
  maxTierName: 100,
  maxTravelers: 100,
  maxPrice: 10_000_000,
} as const;

/**
 * The per-person rate of `tier` for a group of `travelers`: the column of the largest group
 * size ≤ travelers (a group of 5 pays the 4-pax rate); smaller groups than the first column
 * pay the first column. `null` when the brochure has no rate for that column.
 */
export function rateFor(pricing: PackagePricing, tier: PricingTier, travelers: number): number | null {
  const sizes = pricing.groupSizes;
  if (sizes.length === 0) return null;
  let col = 0;
  for (let i = 0; i < sizes.length; i++) if (sizes[i] <= travelers) col = i;
  const rate = tier.prices[col];
  return typeof rate === "number" ? rate : null;
}

/** Lowest per-person rate in the grid (what a card's "from" price should be), or null. */
export function lowestRate(pricing: PackagePricing): number | null {
  let min: number | null = null;
  for (const t of pricing.tiers) for (const p of t.prices) if (typeof p === "number" && (min === null || p < min)) min = p;
  return min;
}

/** True when the package has a usable grid (at least one column and one category). */
export const hasPricing = (p: { pricing?: PackagePricing | null }): p is { pricing: PackagePricing } =>
  !!p.pricing && p.pricing.groupSizes.length > 0 && p.pricing.tiers.length > 0;

export const findTier = (pricing: PackagePricing, name: string): PricingTier | undefined =>
  pricing.tiers.find(t => t.name === name);

/** Column header, e.g. "2 Pax" — or "12+ Pax" for the last column. */
export const groupSizeLabel = (sizes: readonly number[], i: number): string =>
  `${sizes[i]}${i === sizes.length - 1 && sizes.length > 1 ? "+" : ""} Pax`;

const isWholeIn = (v: unknown, min: number, max: number): v is number =>
  typeof v === "number" && Number.isInteger(v) && v >= min && v <= max;

/**
 * Validates an untrusted pricing value (API input). Returns the cleaned grid, or an error
 * message. Prices are whole rupees; `null` means "no rate for this column". Numeric strings
 * (from HTML inputs) are accepted.
 */
export function parsePricing(input: unknown): { ok: true; value: PackagePricing } | { ok: false; error: string } {
  const fail = (error: string) => ({ ok: false as const, error: `pricing: ${error}` });
  const num = (v: unknown): unknown => (typeof v === "string" && v.trim() ? Number(v) : v);
  if (!input || typeof input !== "object" || Array.isArray(input)) return fail("must be an object");
  const { groupSizes, tiers } = input as { groupSizes?: unknown; tiers?: unknown };

  if (!Array.isArray(groupSizes) || groupSizes.length < 1 || groupSizes.length > PRICING_LIMITS.maxGroupSizes) {
    return fail(`needs 1 to ${PRICING_LIMITS.maxGroupSizes} group sizes`);
  }
  const sizes = groupSizes.map(num);
  if (!sizes.every(s => isWholeIn(s, 1, PRICING_LIMITS.maxTravelers))) return fail(`group sizes must be whole numbers from 1 to ${PRICING_LIMITS.maxTravelers}`);
  for (let i = 1; i < sizes.length; i++) {
    if ((sizes[i] as number) <= (sizes[i - 1] as number)) return fail("group sizes must increase from left to right");
  }

  if (!Array.isArray(tiers) || tiers.length < 1 || tiers.length > PRICING_LIMITS.maxTiers) {
    return fail(`needs 1 to ${PRICING_LIMITS.maxTiers} hotel categories`);
  }
  const names = new Set<string>();
  const cleanTiers: PricingTier[] = [];
  for (const raw of tiers) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return fail("each hotel category must be an object");
    const t = raw as Record<string, unknown>;
    const name = typeof t.name === "string" ? t.name.trim() : "";
    if (!name || name.length > PRICING_LIMITS.maxTierName) return fail(`each hotel category needs a name of at most ${PRICING_LIMITS.maxTierName} characters`);
    if (names.has(name)) return fail(`hotel category "${name}" is listed twice`);
    names.add(name);
    if (!Array.isArray(t.prices) || t.prices.length !== sizes.length) return fail(`"${name}" needs one price per group size`);
    const prices = t.prices.map(p => (p === null || p === "" ? null : num(p)));
    if (!prices.every(p => p === null || isWholeIn(p, 0, PRICING_LIMITS.maxPrice))) return fail(`"${name}" prices must be whole rupees from 0 to ${PRICING_LIMITS.maxPrice}`);
    if (!prices.some(p => p !== null)) return fail(`"${name}" needs at least one price`);
    const tier: PricingTier = { name, prices: prices as (number | null)[] };
    for (const key of ["extraBed", "childNoBed"] as const) {
      const v = t[key] === "" ? null : num(t[key]);
      if (v === undefined || v === null) continue;
      if (!isWholeIn(v, 0, PRICING_LIMITS.maxPrice)) return fail(`"${name}" ${key} must be whole rupees from 0 to ${PRICING_LIMITS.maxPrice}`);
      tier[key] = v;
    }
    cleanTiers.push(tier);
  }
  return { ok: true, value: { groupSizes: sizes as number[], tiers: cleanTiers } };
}
