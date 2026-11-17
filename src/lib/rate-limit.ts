import { NextRequest } from "next/server";

/**
 * Minimal fixed-window, in-memory rate limiter (B-02, B-04).
 *
 * LIMITATION: state lives in this server process only. On serverless or with
 * several instances each instance counts separately, and a cold start resets
 * the counters — this is best-effort abuse damping, not a hard guarantee.
 * Swap for a shared store (e.g. Upstash/Redis) if stronger limits are needed.
 */

interface Bucket { count: number; resetAt: number }
const buckets = new Map<string, Bucket>();
const MAX_KEYS = 10_000;

function prune(now: number) {
  if (buckets.size < MAX_KEYS) return;
  for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
  // Still full (e.g. under a flood of distinct IPs): drop the oldest entries.
  for (const k of buckets.keys()) {
    if (buckets.size < MAX_KEYS) break;
    buckets.delete(k);
  }
}

function live(key: string, now: number): Bucket | undefined {
  const b = buckets.get(key);
  if (b && b.resetAt <= now) { buckets.delete(key); return undefined; }
  return b;
}

/** True when `key` has already reached `limit` hits in the current window. */
export function isRateLimited(key: string, limit: number): boolean {
  const b = live(key, Date.now());
  return !!b && b.count >= limit;
}

/** Records one hit for `key` in a window of `windowMs`. */
export function recordHit(key: string, windowMs: number): void {
  const now = Date.now();
  const b = live(key, now);
  if (b) { b.count++; return; }
  prune(now);
  buckets.set(key, { count: 1, resetAt: now + windowMs });
}

/** Records a hit and returns true if it exceeds `limit` in the window. */
export function consume(key: string, limit: number, windowMs: number): boolean {
  if (isRateLimited(key, limit)) return true;
  recordHit(key, windowMs);
  return false;
}

export function resetLimit(key: string): void {
  buckets.delete(key);
}

/**
 * Best-effort client IP. `x-forwarded-for` is trustworthy only behind a proxy
 * that overwrites it (e.g. Vercel); elsewhere it can be spoofed.
 */
export function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}
