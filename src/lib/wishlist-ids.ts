/**
 * Pure id-list helpers for the wishlist and comparison (N-7). No React and no DOM, so the
 * server `/compare` page can use them too (`src/lib/wishlist.ts` is a client module).
 */

export const WISHLIST_KEY = "atlas-wishlist";
export const COMPARE_KEY = "atlas-compare";
export const COMPARE_MAX = 3;
/** Upper bound for the wishlist so a tampered stored value can't grow without limit. */
export const WISHLIST_MAX = 50;
const MAX_ID_LENGTH = 100;

/** Cleans an untrusted value into an id list: strings only, trimmed, non-empty, deduped, capped at `max`. */
export function sanitizeIds(data: unknown, max: number = WISHLIST_MAX): string[] {
  if (!Array.isArray(data)) return [];
  const out: string[] = [];
  for (const v of data) {
    if (out.length >= max) break;
    if (typeof v !== "string") continue;
    const id = v.trim();
    if (!id || id.length > MAX_ID_LENGTH || out.includes(id)) continue;
    out.push(id);
  }
  return out;
}

/** Parses a stored JSON value; anything malformed becomes `[]`. */
export function parseIds(raw: string | null | undefined, max: number = WISHLIST_MAX): string[] {
  if (!raw) return [];
  try {
    return sanitizeIds(JSON.parse(raw), max);
  } catch {
    return [];
  }
}

/** Appends `id` unless it is already there or the list is full (never evicts). */
export function addWithMax(ids: readonly string[], id: string, max: number): string[] {
  if (ids.includes(id) || ids.length >= max) return [...ids];
  return [...ids, id];
}

/** Removes `id` if present, otherwise adds it (subject to `max`). */
export function toggleId(ids: readonly string[], id: string, max: number = Infinity): string[] {
  if (ids.includes(id)) return ids.filter((x) => x !== id);
  return addWithMax(ids, id, max);
}

/** Ids from a `?ids=a,b,c` query value (repeated params are joined), sanitised, at most `max`. */
export function parseIdsParam(value: string | string[] | undefined | null, max: number = COMPARE_MAX): string[] {
  const joined = Array.isArray(value) ? value.join(",") : value ?? "";
  return sanitizeIds(joined.split(","), max);
}

export const comparePath = (ids: readonly string[]): string =>
  `/compare?ids=${ids.slice(0, COMPARE_MAX).map(encodeURIComponent).join(",")}`;
