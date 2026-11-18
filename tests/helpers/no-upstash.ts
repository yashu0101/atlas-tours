import { afterAll, beforeAll, vi } from "vitest";

/**
 * Import for its side effect in any test file that hits a rate-limited route: clears the
 * Upstash env vars for that file so the in-memory limiter is used and no test ever reaches a
 * real Redis instance configured in the developer's shell.
 */
beforeAll(() => {
  vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
  vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
});
afterAll(() => {
  vi.unstubAllEnvs();
});
