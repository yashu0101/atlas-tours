import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";

// The session id (jti) stays server-side; the admin UI needs the email and user id
// (to stop an admin deactivating or deleting their own account).
export async function GET() {
  const session = await verifySession();
  if (!session.authenticated) return NextResponse.json({ authenticated: false }, { status: 401 });
  return NextResponse.json({ authenticated: true, email: session.email, userId: session.userId });
}
