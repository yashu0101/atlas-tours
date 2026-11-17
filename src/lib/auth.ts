import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { timingSafeEqual, createHash } from "crypto";

const COOKIE_NAME = "admin_session";
const MIN_PROD_SECRET_LENGTH = 32;

// Dev-only fallbacks (documented in CLAUDE.md). Never used when NODE_ENV === "production".
const DEV_JWT_SECRET = "atlas-tours-default-secret";
const DEV_ADMIN_EMAIL = "admin@atlastours.com";
const DEV_ADMIN_PASSWORD = "admin123";

function isProduction() {
  return process.env.NODE_ENV === "production";
}

// Log each distinct config error once per process to avoid flooding logs on every request.
const loggedErrors = new Set<string>();
function logConfigError(msg: string) {
  if (loggedErrors.has(msg)) return;
  loggedErrors.add(msg);
  console.error(`[auth] ${msg}`);
}

/**
 * Resolved lazily at request time (never at module load) so `next build`,
 * which runs with NODE_ENV=production, does not fail when env vars are absent.
 * Returns null in production when the secret is missing or too short.
 */
function getJwtSecret(): Uint8Array | null {
  const secret = process.env.JWT_SECRET;
  if (!isProduction()) {
    return new TextEncoder().encode(secret || DEV_JWT_SECRET);
  }
  if (!secret) {
    logConfigError("JWT_SECRET is not set. Admin authentication is disabled in production until it is configured.");
    return null;
  }
  if (secret.length < MIN_PROD_SECRET_LENGTH) {
    logConfigError(
      `JWT_SECRET is too short (${secret.length} chars; minimum ${MIN_PROD_SECRET_LENGTH}). Admin authentication is disabled in production until it is fixed.`
    );
    return null;
  }
  return new TextEncoder().encode(secret);
}

/** Returns the configured admin credentials, or null in production if any are missing. */
function resolveAdminCredentials(): { email: string; password: string } | null {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!isProduction()) {
    return { email: email || DEV_ADMIN_EMAIL, password: password || DEV_ADMIN_PASSWORD };
  }
  const missing: string[] = [];
  if (!email) missing.push("ADMIN_EMAIL");
  if (!password) missing.push("ADMIN_PASSWORD");
  if (missing.length) {
    logConfigError(`${missing.join(" and ")} not set. Admin login is disabled in production until configured.`);
    return null;
  }
  return { email: email!, password: password! };
}

/**
 * Constant-time string comparison. Both inputs are hashed to fixed-length
 * digests first, so differing lengths neither throw nor leak via timing.
 */
export function safeEqual(a: unknown, b: unknown): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const ha = createHash("sha256").update(a, "utf8").digest();
  const hb = createHash("sha256").update(b, "utf8").digest();
  return timingSafeEqual(ha, hb) && a.length === b.length;
}

export async function createSession(email: string) {
  const secret = getJwtSecret();
  if (!secret) throw new Error("Cannot create session: JWT_SECRET is not configured");
  return new SignJWT({ email, role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("24h")
    .setIssuedAt()
    .sign(secret);
}

export async function verifySession(): Promise<{ authenticated: boolean; email?: string }> {
  try {
    const secret = getJwtSecret();
    if (!secret) return { authenticated: false };
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return { authenticated: false };
    const { payload } = await jwtVerify(token, secret);
    return { authenticated: true, email: payload.email as string };
  } catch {
    return { authenticated: false };
  }
}

/**
 * Constant-time credential check. Fails closed in production when
 * ADMIN_EMAIL / ADMIN_PASSWORD / JWT_SECRET are missing or invalid.
 */
export function verifyAdminCredentials(email: unknown, password: unknown): boolean {
  const creds = resolveAdminCredentials();
  const secretOk = getJwtSecret() !== null;
  if (!creds || !secretOk) return false;
  const emailOk = safeEqual(email, creds.email);
  const passwordOk = safeEqual(password, creds.password);
  return emailOk && passwordOk;
}

export { COOKIE_NAME };
