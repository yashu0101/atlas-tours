import { NextRequest, NextResponse } from "next/server";
import { createSession, getAdminCredentials, COOKIE_NAME } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  const creds = getAdminCredentials();
  if (email !== creds.email || password !== creds.password) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
  const token = await createSession(email);
  const res = NextResponse.json({ success: true, email });
  res.cookies.set(COOKIE_NAME, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 86400, path: "/" });
  return res;
}
