import { NextResponse } from "next/server";
import { authenticateAdmin, createSession, sessionCookieOptions, verifySession, COOKIE_NAME } from "@/lib/auth";
import { HttpError, isEmail, readJson, withHandler } from "@/lib/api";
import { audit } from "@/lib/audit";
import { pruneAdminSessions, pruneAuditLog, revokeAdminSession, updateAdminUser } from "@/lib/db";
import { clientIp, consume, isRateLimited, recordHit, resetLimit } from "@/lib/rate-limit";
import { ENV_ADMIN_ID } from "@/lib/types";

// B-02: at most 5 failed attempts per IP per 15 minutes (shared via Upstash or in memory per instance — see rate-limit.ts).
const MAX_FAILURES = 5;
const FAILURE_WINDOW_MS = 15 * 60 * 1000;

// Review finding: failed logins are audited, but at most this many per hour across ALL IPs, so
// a flood (e.g. spoofed IPs off Vercel) can't push real entries out of the Audit log tab.
const FAILED_LOGIN_AUDITS_PER_HOUR = 50;
// Audit entries older than this are deleted on login (the log is not kept forever).
const AUDIT_RETENTION_MS = 180 * 24 * 60 * 60 * 1000;

export const POST = withHandler(async (req) => {
  const ip = clientIp(req);
  const key = `login:${ip}`;
  if (await isRateLimited(key, MAX_FAILURES)) throw new HttpError(429, "Too many login attempts. Try again later.");

  const { email, password } = await readJson(req);
  const who = await authenticateAdmin(email, password);
  if (!who) {
    await recordHit(key, FAILURE_WINDOW_MS);
    // Only something shaped like an e-mail is recorded (a password typed into the e-mail box is not).
    const attempted = typeof email === "string" && isEmail(email.trim()) ? email.trim().toLowerCase() : "(invalid email)";
    if (!(await consume("audit:login_failed", FAILED_LOGIN_AUDITS_PER_HOUR, 60 * 60 * 1000))) await audit(attempted, "login_failed");
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
  await resetLimit(key);

  // Logging in again replaces the cookie; end the session it replaces too (review finding).
  const previous = await verifySession();
  if (previous.authenticated) await revokeAdminSession(previous.sessionId).catch(err => console.error("[auth] revoking previous session failed:", err));

  const token = await createSession(who.email, { userId: who.userId, userAgent: req.headers.get("user-agent"), ip });
  if (who.userId !== ENV_ADMIN_ID) await updateAdminUser(who.userId, { lastLoginAt: new Date().toISOString() });
  await audit(who, "login");
  // Opportunistic cleanup of expired/revoked session rows; never fails the login.
  await pruneAdminSessions().catch(err => console.error("[auth] pruning sessions failed:", err));
  await pruneAuditLog(new Date(Date.now() - AUDIT_RETENTION_MS)).catch(err => console.error("[audit] pruning failed:", err));

  const res = NextResponse.json({ success: true, email: who.email });
  res.cookies.set(COOKIE_NAME, token, sessionCookieOptions());
  return res;
});
