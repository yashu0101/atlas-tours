import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "atlas-tours-default-secret"
);
const COOKIE_NAME = "admin_session";

export async function createSession(email: string) {
  return new SignJWT({ email, role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("24h")
    .setIssuedAt()
    .sign(SECRET);
}

export async function verifySession(): Promise<{ authenticated: boolean; email?: string }> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return { authenticated: false };
    const { payload } = await jwtVerify(token, SECRET);
    return { authenticated: true, email: payload.email as string };
  } catch {
    return { authenticated: false };
  }
}

export function getAdminCredentials() {
  return {
    email: process.env.ADMIN_EMAIL || "admin@atlastours.com",
    password: process.env.ADMIN_PASSWORD || "admin123",
  };
}

export { COOKIE_NAME };
