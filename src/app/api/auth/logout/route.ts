import { NextResponse } from "next/server";
import { COOKIE_NAME, sessionCookieOptions, verifySession } from "@/lib/auth";
import { withHandler } from "@/lib/api";
import { audit } from "@/lib/audit";
import { revokeAdminSession } from "@/lib/db";

// N-8: revokes the current server-side session, so a copy of this cookie stops working too.
export const POST = withHandler(async () => {
  const session = await verifySession();
  if (session.authenticated) {
    await revokeAdminSession(session.sessionId);
    await audit(session, "logout");
  }
  const res = NextResponse.json({ success: true });
  // Same flags as login (B-08) so the browser matches and clears the same cookie.
  res.cookies.set(COOKIE_NAME, "", sessionCookieOptions(0));
  return res;
});
