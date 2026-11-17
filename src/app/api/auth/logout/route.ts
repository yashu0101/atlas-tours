import { NextResponse } from "next/server";
import { COOKIE_NAME, sessionCookieOptions } from "@/lib/auth";

export async function POST() {
  const res = NextResponse.json({ success: true });
  // Same flags as login (B-08) so the browser matches and clears the same cookie.
  res.cookies.set(COOKIE_NAME, "", sessionCookieOptions(0));
  return res;
}
