import { NextResponse } from "next/server";
import { COOKIE_NAME, sessionCookieOptions } from "@/lib/auth";
import { requireAdmin, withHandler } from "@/lib/api";
import { audit } from "@/lib/audit";
import { revokeAdminSessionsForUser } from "@/lib/db";

/**
 * N-8 "Sign out all devices": revokes every session of the signed-in admin, including this
 * one, and clears the cookie. Returns `{ success: true, revoked: n }`.
 */
export const POST = withHandler(async () => {
  const admin = await requireAdmin();
  const revoked = await revokeAdminSessionsForUser(admin.userId);
  await audit(admin, "signout_all", { entity: "sessions", entityId: admin.userId });
  const res = NextResponse.json({ success: true, revoked });
  res.cookies.set(COOKIE_NAME, "", sessionCookieOptions(0));
  return res;
});
