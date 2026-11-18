import { NextRequest } from "next/server";

/**
 * Fixed-window rate limiter (B-02, B-04) with an optional shared store.
 *
 * - When `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are both set, counters live in
 *   Upstash Redis (REST API over `fetch`, no client library), so every serverless instance shares
 *   them and a cold start doesn't reset them. Keys are namespaced `atlas:rl:<key>`.
 * - Otherwise counters live in this process's memory: on serverless or with several instances
 *   each instance counts separately and a cold start resets them (best-effort damping only).
 *
 * If an Upstash call fails or times out, that call falls back to the in-memory limiter and the
 * failure is logged once (until Upstash works again). It never fails closed: a Redis outage must
 * not lock the admin out of login or block the public forms.
 */

// ---------------------------------------------------------------------------
// In-memory store
// ---------------------------------------------------------------------------

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

function memCount(key: string): number {
  return live(key, Date.now())?.count ?? 0;
}

function memHit(key: string, windowMs: number): number {
  const now = Date.now();
  const b = live(key, now);
  if (b) return ++b.count;
  prune(now);
  buckets.set(key, { count: 1, resetAt: now + windowMs });
  return 1;
}

// ---------------------------------------------------------------------------
// Upstash Redis store (REST API)
// ---------------------------------------------------------------------------

export const REDIS_KEY_PREFIX = "atlas:rl:";
const REDIS_TIMEOUT_MS = 1500;

let redisFailureLogged = false;

/** Upstash REST credentials, read on every call so env changes (and tests) take effect. */
function upstash(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  return url && token ? { url: url.replace(/\/+$/, ""), token } : null;
}

type RedisReply = { result?: unknown; error?: string };

/**
 * Runs `commands` as one MULTI/EXEC transaction (`POST /multi-exec`, body = 2-D JSON array,
 * response = one `{ result }` / `{ error }` per command). Throws on any HTTP, network,
 * timeout or per-command error.
 */
async function redis(cfg: { url: string; token: string }, commands: (string | number)[][]): Promise<unknown[]> {
  const res = await fetch(`${cfg.url}/multi-exec`, {
    method: "POST",
    headers: { Authorization: `Bearer ${cfg.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(commands),
    signal: AbortSignal.timeout(REDIS_TIMEOUT_MS),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Upstash responded ${res.status}`);
  const data: unknown = await res.json();
  if (!Array.isArray(data) || data.length !== commands.length) {
    throw new Error(`Unexpected Upstash response: ${JSON.stringify(data).slice(0, 200)}`);
  }
  return (data as RedisReply[]).map((r) => {
    if (!r || typeof r !== "object" || r.error) throw new Error(`Upstash error: ${r?.error ?? "malformed reply"}`);
    return r.result;
  });
}

function toCount(v: unknown): number {
  const n = typeof v === "string" ? Number(v) : v;
  return typeof n === "number" && Number.isFinite(n) ? n : 0;
}

/**
 * Runs `remote` against Upstash when configured, else (or when it fails) `local`.
 */
async function withStore<T>(
  remote: (cfg: { url: string; token: string }, redisKey: string) => Promise<T>,
  local: () => T,
  key: string,
): Promise<T> {
  const cfg = upstash();
  if (!cfg) return local();
  try {
    const out = await remote(cfg, REDIS_KEY_PREFIX + key);
    redisFailureLogged = false;
    return out;
  } catch (err) {
    if (!redisFailureLogged) {
      redisFailureLogged = true;
      console.error("[rate-limit] Upstash Redis unavailable; falling back to the in-memory limiter:", err);
    }
    return local();
  }
}

/**
 * Records one hit in Redis and returns the new count. `SET key 0 PX window NX` starts the window
 * only on the first hit (so later hits never extend it — fixed window), then `INCR` counts; both
 * run in one MULTI/EXEC round trip. INCR keeps the key's TTL.
 */
async function redisHit(cfg: { url: string; token: string }, redisKey: string, windowMs: number): Promise<number> {
  const [, count] = await redis(cfg, [
    ["SET", redisKey, "0", "PX", Math.max(1, Math.ceil(windowMs)), "NX"],
    ["INCR", redisKey],
  ]);
  return toCount(count);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** True when `key` has already reached `limit` hits in the current window. */
export async function isRateLimited(key: string, limit: number): Promise<boolean> {
  const count = await withStore(
    async (cfg, k) => toCount((await redis(cfg, [["GET", k]]))[0]),
    () => memCount(key),
    key,
  );
  return count >= limit;
}

/** Records one hit for `key` in a window of `windowMs` (the window starts on the first hit). */
export async function recordHit(key: string, windowMs: number): Promise<void> {
  await withStore((cfg, k) => redisHit(cfg, k, windowMs), () => memHit(key, windowMs), key);
}

/**
 * Records a hit and returns true if the request is over `limit` in the window. With Redis this
 * is a single round trip; a blocked request is still counted there, which doesn't matter
 * because the window is fixed (it never extends the block).
 */
export async function consume(key: string, limit: number, windowMs: number): Promise<boolean> {
  return withStore(
    async (cfg, k) => (await redisHit(cfg, k, windowMs)) > limit,
    () => {
      if (memCount(key) >= limit) return true;
      memHit(key, windowMs);
      return false;
    },
    key,
  );
}

/** Clears the counter for `key` (e.g. after a successful login). */
export async function resetLimit(key: string): Promise<void> {
  // Always clear the in-memory bucket too, in case an earlier call fell back to it.
  buckets.delete(key);
  await withStore(async (cfg, k) => { await redis(cfg, [["DEL", k]]); }, () => undefined, key);
}

/**
 * Best-effort client IP, used only as a rate-limit key.
 *
 * Trust model: these headers are only as trustworthy as the proxy in front of the app.
 * - On Vercel (`VERCEL` env var, set by the platform) the edge sets `x-vercel-forwarded-for`,
 *   `x-real-ip` and `x-forwarded-for` to the connecting client's IP and overwrites client-sent
 *   values ("to prevent IP spoofing", https://vercel.com/docs/headers/request-headers), so they
 *   are read in that order.
 * - Anywhere else only the first `x-forwarded-for` entry is read: other proxies (nginx,
 *   Cloudflare, Render, Fly…) set or append that header but pass `x-vercel-forwarded-for` /
 *   `x-real-ip` through from the client, which would let a client pick its own bucket.
 * Without any proxy (e.g. `next start` exposed directly) every header is client-controlled.
 */
export function clientIp(req: NextRequest): string {
  const headers = process.env.VERCEL ? ["x-vercel-forwarded-for", "x-real-ip", "x-forwarded-for"] : ["x-forwarded-for"];
  for (const name of headers) {
    const first = req.headers.get(name)?.split(",")[0].trim();
    if (first) return first;
  }
  return "unknown";
}
