import { NextResponse } from "next/server";
import { createSession, verifyAdminCredentials, sessionCookieOptions, COOKIE_NAME } from "@/lib/auth";
import { HttpError, readJson, withHandler } from "@/lib/api";
import { clientIp, isRateLimited, recordHit, resetLimit } from "@/lib/rate-limit";

// B-02: at most 5 failed attempts per IP per 15 minutes (shared via Upstash or in memory per instance — see rate-limit.ts).
const MAX_FAILURES = 5;
const FAILURE_WINDOW_MS = 15 * 60 * 1000;

export const POST = withHandler(async (req) => {
  const key = `login:${clientIp(req)}`;
  if (await isRateLimited(key, MAX_FAILURES)) throw new HttpError(429, "Too many login attempts. Try again later.");

  const { email, password } = await readJson(req);
  if (!(await verifyAdminCredentials(email, password))) {
    await recordHit(key, FAILURE_WINDOW_MS);
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
  await resetLimit(key);

  const token = await createSession(email as string); // verified to be the admin email above
  const res = NextResponse.json({ success: true, email });
  res.cookies.set(COOKIE_NAME, token, sessionCookieOptions());
  return res;
});
