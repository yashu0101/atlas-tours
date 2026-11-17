import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { timingSafeEqual, createHash } from "crypto";
import { compare as bcryptCompare } from "bcryptjs";

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

type AdminCredentials = { email: string } & ({ passwordHash: string } | { password: string });

/**
 * Returns the configured admin credentials, or null in production if any are missing.
 * `ADMIN_PASSWORD_HASH` (bcrypt) takes precedence over plaintext `ADMIN_PASSWORD`.
 */
function resolveAdminCredentials(): AdminCredentials | null {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  if (!isProduction()) {
    const devEmail = email || DEV_ADMIN_EMAIL;
    return passwordHash ? { email: devEmail, passwordHash } : { email: devEmail, password: password || DEV_ADMIN_PASSWORD };
  }
  const missing: string[] = [];
  if (!email) missing.push("ADMIN_EMAIL");
  if (!password && !passwordHash) missing.push("ADMIN_PASSWORD (or ADMIN_PASSWORD_HASH)");
  if (missing.length) {
    logConfigError(`${missing.join(" and ")} not set. Admin login is disabled in production until configured.`);
    return null;
  }
  return passwordHash ? { email: email!, passwordHash } : { email: email!, password: password! };
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

// B-08: tokens are bound to this app (iss/aud) and to the admin role.
const JWT_ISSUER = "atlas-tours";
const JWT_AUDIENCE = "atlas-tours-admin";
const SESSION_MAX_AGE_SECONDS = 24 * 60 * 60;

/**
 * Session revocation (B-08): every token embeds the current `SESSION_VERSION`
 * env var (default "1") as the `sv` claim, and `verifySession` rejects tokens whose
 * `sv` differs. To log every admin out (e.g. after a leaked cookie or password
 * change), bump SESSION_VERSION (e.g. "1" -> "2") and redeploy/restart.
 * Rotating JWT_SECRET has the same effect.
 */
function sessionVersion(): string {
  return process.env.SESSION_VERSION || "1";
}

/** Cookie flags shared by login (set) and logout (clear) so the browser treats them as the same cookie. */
export function sessionCookieOptions(maxAge: number = SESSION_MAX_AGE_SECONDS) {
  return { httpOnly: true, secure: isProduction(), sameSite: "strict" as const, path: "/", maxAge };
}

export async function createSession(email: string) {
  const secret = getJwtSecret();
  if (!secret) throw new Error("Cannot create session: JWT_SECRET is not configured");
  return new SignJWT({ email, role: "admin", sv: sessionVersion() })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
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
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      requiredClaims: ["exp", "iat"],
    });
    if (payload.role !== "admin" || payload.sv !== sessionVersion() || typeof payload.email !== "string") {
      return { authenticated: false };
    }
    return { authenticated: true, email: payload.email };
  } catch {
    return { authenticated: false };
  }
}

/**
 * Single entry point for admin login checks. Fails closed in production when
 * ADMIN_EMAIL / ADMIN_PASSWORD(_HASH) / JWT_SECRET are missing or invalid.
 * With ADMIN_PASSWORD_HASH set, the password is verified with bcrypt; otherwise
 * it falls back to a constant-time plaintext comparison. Email and password are
 * always both checked so timing doesn't reveal which one was wrong.
 */
export async function verifyAdminCredentials(email: unknown, password: unknown): Promise<boolean> {
  const creds = resolveAdminCredentials();
  const secretOk = getJwtSecret() !== null;
  if (!creds || !secretOk) return false;
  const emailOk = safeEqual(email, creds.email);
  let passwordOk = false;
  if ("passwordHash" in creds) {
    try {
      passwordOk = typeof password === "string" && (await bcryptCompare(password, creds.passwordHash));
    } catch (err) {
      logConfigError(`ADMIN_PASSWORD_HASH is not a valid bcrypt hash (${err instanceof Error ? err.message : String(err)}).`);
    }
  } else {
    passwordOk = safeEqual(password, creds.password);
  }
  return emailOk && passwordOk;
}

export { COOKIE_NAME };
