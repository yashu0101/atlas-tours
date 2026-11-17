import { useCallback, useSyncExternalStore } from "react";
import {
  COMPARE_KEY,
  COMPARE_MAX,
  WISHLIST_KEY,
  WISHLIST_MAX,
  parseIds,
  sanitizeIds,
  toggleId,
} from "./wishlist-ids";

export * from "./wishlist-ids";

/**
 * Wishlist ("saved") and comparison selections (N-7), stored per browser in localStorage
 * (`atlas-wishlist`, `atlas-compare`) as JSON arrays of package ids. No server state.
 *
 * Hydration: `useSyncExternalStore` with an empty server snapshot, so the server render and
 * the first client render both see an empty list; React then re-renders with the stored ids.
 * Every storage access is wrapped in try/catch (private mode, blocked storage, quota); when
 * storage is unavailable the selection is kept in memory for the current page view.
 * Other tabs stay in sync through the `storage` event.
 */

export type ListKey = typeof WISHLIST_KEY | typeof COMPARE_KEY;

const EMPTY: readonly string[] = Object.freeze([]);
const maxFor = (key: ListKey) => (key === COMPARE_KEY ? COMPARE_MAX : WISHLIST_MAX);

/** Parsed value per key, reused while the raw string is unchanged (snapshots must be stable). */
const cache = new Map<ListKey, { raw: string | null; ids: readonly string[] }>();
/** Used instead of localStorage after a failed write. */
const memoryOnly = new Map<ListKey, readonly string[]>();
const listeners = new Set<() => void>();

function readRaw(key: ListKey): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function snapshot(key: ListKey): readonly string[] {
  const mem = memoryOnly.get(key);
  if (mem) return mem;
  const raw = readRaw(key);
  const hit = cache.get(key);
  if (hit && hit.raw === raw) return hit.ids;
  const ids = raw ? Object.freeze(parseIds(raw, maxFor(key))) : EMPTY;
  cache.set(key, { raw, ids });
  return ids;
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  const onStorage = (e: StorageEvent) => {
    if (e.key === null) memoryOnly.clear();
    else if (e.key === WISHLIST_KEY || e.key === COMPARE_KEY) memoryOnly.delete(e.key);
    else return;
    onChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

const serverSnapshot = () => EMPTY;

/** Current ids (empty on the server). For event handlers; components use the hooks. */
export function getIds(key: ListKey): readonly string[] {
  return typeof window === "undefined" ? EMPTY : snapshot(key);
}

export function setIds(key: ListKey, ids: readonly string[]): void {
  const clean = Object.freeze(sanitizeIds(ids, maxFor(key)));
  try {
    if (clean.length) window.localStorage.setItem(key, JSON.stringify(clean));
    else window.localStorage.removeItem(key);
    memoryOnly.delete(key);
  } catch {
    memoryOnly.set(key, clean);
  }
  listeners.forEach((l) => l());
}

/** Ids stored under `key`; empty on the server and during hydration. */
export function useStoredIds(key: ListKey): readonly string[] {
  const getSnapshot = useCallback(() => snapshot(key), [key]);
  return useSyncExternalStore(subscribe, getSnapshot, serverSnapshot);
}

export function useWishlist() {
  const ids = useStoredIds(WISHLIST_KEY);
  const toggle = useCallback((id: string) => setIds(WISHLIST_KEY, toggleId(getIds(WISHLIST_KEY), id, WISHLIST_MAX)), []);
  const remove = useCallback((id: string) => setIds(WISHLIST_KEY, getIds(WISHLIST_KEY).filter((x) => x !== id)), []);
  return { ids, has: (id: string) => ids.includes(id), toggle, remove };
}

export function useCompare() {
  const ids = useStoredIds(COMPARE_KEY);
  const toggle = useCallback((id: string) => setIds(COMPARE_KEY, toggleId(getIds(COMPARE_KEY), id, COMPARE_MAX)), []);
  const clear = useCallback(() => setIds(COMPARE_KEY, []), []);
  return { ids, has: (id: string) => ids.includes(id), isFull: ids.length >= COMPARE_MAX, toggle, clear };
}
