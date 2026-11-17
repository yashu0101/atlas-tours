import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { clientIp, consume, isRateLimited, recordHit, resetLimit } from "@/lib/rate-limit";

describe("rate limiter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows `limit` hits per window, then blocks", () => {
    const key = "test:consume";
    for (let i = 0; i < 3; i++) expect(consume(key, 3, 60_000)).toBe(false);
    expect(consume(key, 3, 60_000)).toBe(true);
    expect(isRateLimited(key, 3)).toBe(true);
    resetLimit(key);
  });

  it("resets once the window has elapsed", () => {
    const key = "test:window";
    for (let i = 0; i < 2; i++) consume(key, 2, 60_000);
    expect(consume(key, 2, 60_000)).toBe(true);

    vi.advanceTimersByTime(59_999);
    expect(isRateLimited(key, 2)).toBe(true);

    vi.advanceTimersByTime(1);
    expect(isRateLimited(key, 2)).toBe(false);
    expect(consume(key, 2, 60_000)).toBe(false);
    resetLimit(key);
  });

  it("does not extend the window on later hits (fixed window)", () => {
    const key = "test:fixed";
    recordHit(key, 10_000);
    vi.advanceTimersByTime(9_000);
    recordHit(key, 10_000);
    expect(isRateLimited(key, 2)).toBe(true);
    vi.advanceTimersByTime(1_000);
    expect(isRateLimited(key, 2)).toBe(false);
    resetLimit(key);
  });

  it("tracks keys independently and resetLimit clears one key", () => {
    consume("test:a", 1, 60_000);
    consume("test:b", 1, 60_000);
    expect(isRateLimited("test:a", 1)).toBe(true);
    resetLimit("test:a");
    expect(isRateLimited("test:a", 1)).toBe(false);
    expect(isRateLimited("test:b", 1)).toBe(true);
    resetLimit("test:b");
  });
});

describe("clientIp", () => {
  const req = (headers: Record<string, string>) => new NextRequest("http://localhost/api/x", { headers });

  it("uses the first x-forwarded-for entry", () => {
    expect(clientIp(req({ "x-forwarded-for": " 1.2.3.4 , 10.0.0.1" }))).toBe("1.2.3.4");
  });

  it("falls back to x-real-ip, then 'unknown'", () => {
    expect(clientIp(req({ "x-real-ip": "5.6.7.8" }))).toBe("5.6.7.8");
    expect(clientIp(req({}))).toBe("unknown");
  });
});
