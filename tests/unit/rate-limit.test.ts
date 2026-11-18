import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { REDIS_KEY_PREFIX, clientIp, consume, isRateLimited, recordHit, resetLimit } from "@/lib/rate-limit";

const URL_VAR = "UPSTASH_REDIS_REST_URL";
const TOKEN_VAR = "UPSTASH_REDIS_REST_TOKEN";

// Never pick up real Upstash credentials from the shell: every test starts in memory mode.
beforeEach(() => {
  vi.stubEnv(URL_VAR, "");
  vi.stubEnv(TOKEN_VAR, "");
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("rate limiter (in memory)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows `limit` hits per window, then blocks", async () => {
    const key = "test:consume";
    for (let i = 0; i < 3; i++) expect(await consume(key, 3, 60_000)).toBe(false);
    expect(await consume(key, 3, 60_000)).toBe(true);
    expect(await isRateLimited(key, 3)).toBe(true);
    await resetLimit(key);
  });

  it("resets once the window has elapsed", async () => {
    const key = "test:window";
    for (let i = 0; i < 2; i++) await consume(key, 2, 60_000);
    expect(await consume(key, 2, 60_000)).toBe(true);

    vi.advanceTimersByTime(59_999);
    expect(await isRateLimited(key, 2)).toBe(true);

    vi.advanceTimersByTime(1);
    expect(await isRateLimited(key, 2)).toBe(false);
    expect(await consume(key, 2, 60_000)).toBe(false);
    await resetLimit(key);
  });

  it("does not extend the window on later hits (fixed window)", async () => {
    const key = "test:fixed";
    await recordHit(key, 10_000);
    vi.advanceTimersByTime(9_000);
    await recordHit(key, 10_000);
    expect(await isRateLimited(key, 2)).toBe(true);
    vi.advanceTimersByTime(1_000);
    expect(await isRateLimited(key, 2)).toBe(false);
    await resetLimit(key);
  });

  it("tracks keys independently and resetLimit clears one key", async () => {
    await consume("test:a", 1, 60_000);
    await consume("test:b", 1, 60_000);
    expect(await isRateLimited("test:a", 1)).toBe(true);
    await resetLimit("test:a");
    expect(await isRateLimited("test:a", 1)).toBe(false);
    expect(await isRateLimited("test:b", 1)).toBe(true);
    await resetLimit("test:b");
  });

  it("does not call fetch when Upstash is not configured (or only half configured)", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv(URL_VAR, "https://example.upstash.io");
    await consume("test:half", 5, 60_000);
    await resetLimit("test:half");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

/** A tiny fake of the Upstash `/multi-exec` endpoint backed by a Map (TTLs are ignored). */
function fakeUpstash() {
  const store = new Map<string, number>();
  const ttls = new Map<string, number>();
  const fetchMock = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
    const commands = JSON.parse(String(init?.body)) as (string | number)[][];
    const replies = commands.map(([cmd, key, ...args]) => {
      const k = String(key);
      switch (cmd) {
        case "SET": {
          if (args.includes("NX") && store.has(k)) return { result: null };
          store.set(k, Number(args[0]));
          ttls.set(k, Number(args[args.indexOf("PX") + 1]));
          return { result: "OK" };
        }
        case "INCR": {
          const n = (store.get(k) ?? 0) + 1;
          store.set(k, n);
          return { result: n };
        }
        case "GET":
          return { result: store.has(k) ? String(store.get(k)) : null };
        case "DEL":
          return { result: store.delete(k) ? 1 : 0 };
        default:
          return { error: `ERR unknown command ${cmd}` };
      }
    });
    return new Response(JSON.stringify(replies), { status: 200, headers: { "content-type": "application/json" } });
  });
  return { store, ttls, fetchMock };
}

describe("rate limiter (Upstash Redis)", () => {
  beforeEach(() => {
    vi.stubEnv(URL_VAR, "https://example.upstash.io/");
    vi.stubEnv(TOKEN_VAR, "test-token");
  });

  it("sends one MULTI/EXEC request with the bearer token: SET NX PX then INCR", async () => {
    const { fetchMock } = fakeUpstash();
    vi.stubGlobal("fetch", fetchMock);

    expect(await consume("login:1.2.3.4", 5, 900_000)).toBe(false);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://example.upstash.io/multi-exec");
    expect(init?.method).toBe("POST");
    expect((init?.headers as Record<string, string>).Authorization).toBe("Bearer test-token");
    expect(init?.signal).toBeInstanceOf(AbortSignal);
    expect(JSON.parse(String(init?.body))).toEqual([
      ["SET", `${REDIS_KEY_PREFIX}login:1.2.3.4`, "0", "PX", 900_000, "NX"],
      ["INCR", `${REDIS_KEY_PREFIX}login:1.2.3.4`],
    ]);
  });

  it("counts in Redis and blocks after `limit` hits; resetLimit deletes the key", async () => {
    const { store, ttls, fetchMock } = fakeUpstash();
    vi.stubGlobal("fetch", fetchMock);
    const key = "test:redis-consume";
    const rk = REDIS_KEY_PREFIX + key;

    for (let i = 0; i < 3; i++) expect(await consume(key, 3, 60_000)).toBe(false);
    expect(await consume(key, 3, 60_000)).toBe(true);
    expect(store.get(rk)).toBe(4);
    expect(ttls.get(rk)).toBe(60_000);
    expect(await isRateLimited(key, 3)).toBe(true);

    await resetLimit(key);
    expect(store.has(rk)).toBe(false);
    expect(JSON.parse(String(fetchMock.mock.calls.at(-1)?.[1]?.body))).toEqual([["DEL", rk]]);
    expect(await isRateLimited(key, 3)).toBe(false);
  });

  it("supports the login pattern: isRateLimited (GET) + recordHit", async () => {
    const { fetchMock } = fakeUpstash();
    vi.stubGlobal("fetch", fetchMock);
    const key = "test:redis-login";

    expect(await isRateLimited(key, 2)).toBe(false);
    await recordHit(key, 60_000);
    expect(await isRateLimited(key, 2)).toBe(false);
    await recordHit(key, 60_000);
    expect(await isRateLimited(key, 2)).toBe(true);
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual([["GET", REDIS_KEY_PREFIX + key]]);
  });

  it("falls back to memory when fetch rejects, and logs only once", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", fakeUpstash().fetchMock);
    await isRateLimited("test:redis-reject", 2); // a success clears any earlier "already logged" state
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    const key = "test:redis-reject";

    expect(await consume(key, 2, 60_000)).toBe(false);
    expect(await consume(key, 2, 60_000)).toBe(false);
    expect(await consume(key, 2, 60_000)).toBe(true); // counted in memory
    expect(errSpy).toHaveBeenCalledTimes(1);
    await resetLimit(key);
  });

  it("falls back to memory on a non-200 response or a command error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const key = "test:redis-500";

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("Unauthorized", { status: 401 })));
    expect(await consume(key, 1, 60_000)).toBe(false);
    expect(await consume(key, 1, 60_000)).toBe(true);

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: "ERR max requests limit exceeded" }), { status: 200 })),
    );
    expect(await isRateLimited(key, 1)).toBe(true); // still the in-memory count
    await resetLimit(key);
    expect(await isRateLimited(key, 1)).toBe(false);
  });

  it("logs again after Upstash recovers and then fails again", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { fetchMock } = fakeUpstash();
    vi.stubGlobal("fetch", fetchMock);
    await consume("test:relog", 10, 60_000); // a success clears any earlier "already logged" state
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("down")));
    await consume("test:relog", 10, 60_000);
    vi.stubGlobal("fetch", fetchMock);
    await consume("test:relog", 10, 60_000);
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("down again")));
    await consume("test:relog", 10, 60_000);
    expect(errSpy).toHaveBeenCalledTimes(2);
    vi.stubGlobal("fetch", fetchMock);
    await resetLimit("test:relog");
  });
});

describe("clientIp", () => {
  const req = (headers: Record<string, string>) => new NextRequest("http://localhost/api/x", { headers });

  afterEach(() => vi.unstubAllEnvs());

  it("on Vercel, prefers x-vercel-forwarded-for, then x-real-ip, over x-forwarded-for", () => {
    vi.stubEnv("VERCEL", "1");
    expect(
      clientIp(req({ "x-vercel-forwarded-for": "9.9.9.9", "x-real-ip": "5.6.7.8", "x-forwarded-for": "1.2.3.4" })),
    ).toBe("9.9.9.9");
    expect(clientIp(req({ "x-real-ip": " 5.6.7.8 ", "x-forwarded-for": "1.2.3.4" }))).toBe("5.6.7.8");
  });

  it("off Vercel, ignores client-settable x-vercel-forwarded-for / x-real-ip", () => {
    vi.stubEnv("VERCEL", "");
    expect(
      clientIp(req({ "x-vercel-forwarded-for": "9.9.9.9", "x-real-ip": "5.6.7.8", "x-forwarded-for": "1.2.3.4" })),
    ).toBe("1.2.3.4");
    expect(clientIp(req({ "x-real-ip": "5.6.7.8" }))).toBe("unknown");
  });

  it("falls back to the first x-forwarded-for entry, then 'unknown'", () => {
    expect(clientIp(req({ "x-forwarded-for": " 1.2.3.4 , 10.0.0.1" }))).toBe("1.2.3.4");
    expect(clientIp(req({}))).toBe("unknown");
  });
});
