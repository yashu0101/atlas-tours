import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { timingSafeEqual, createHash, createHmac, randomUUID } from "crypto";
import { compare as bcryptCompare, hash as bcryptHash } from "bcryptjs";
import { addAdminSession, getAdminSession, getAdminUserByEmail, getAdminUserById, normalizeEmail } from "./db";
import { ENV_ADMIN_ID } from "./types";

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

/** Who is acting: returned by `verifySession()` / `requireAdmin()` for attribution (N-8). */
export interface AdminIdentity {
  email: string;
  /** AdminUser id, or `ENV_ADMIN_ID` ("env") for the env-var admin. */
  userId: string;
  /** The session row id (= the JWT's jti). */
  sessionId: string;
}

export type SessionCheck = ({ authenticated: true } & AdminIdentity) | { authenticated: false };

/**
 * Env-admin credential tag (review finding): an HMAC (keyed with the JWT secret, so it reveals
 * nothing about the password) of the env admin's email + password/hash. It is embedded in env
 * sessions as the `ec` claim and re-checked on every request, so rotating ADMIN_PASSWORD or
 * ADMIN_PASSWORD_HASH ends every env-admin session, just like a DB user's password change.
 */
function envCredentialTag(secret: Uint8Array, creds: AdminCredentials): string {
  const cred = "passwordHash" in creds ? "h:" + creds.passwordHash : "p:" + creds.password;
  return createHmac("sha256", Buffer.from(secret))
    .update("env-cred\n" + normalizeEmail(creds.email) + "\n" + cred)
    .digest("base64url")
    .slice(0, 32);
}

/** Logs a deploy hint when the N-8 tables are missing (Postgres 42P01: migration v6 not applied). */
function hintIfSchemaMissing(err: unknown): void {
  if ((err as { code?: unknown } | null)?.code === "42P01") {
    logConfigError("Admin session tables are missing: run POST /api/seed to apply the database migrations (v6). Admin login is unavailable until then.");
  }
}

/** Longest User-Agent kept on a session row (the Postgres CHECK allows 512). */
const MAX_USER_AGENT = 512;

/**
 * Signs a session JWT and stores its server-side row (N-8). The token carries a random
 * `jti` = the `admin_sessions` row id; `verifySession` requires that row to exist and to be
 * neither revoked nor expired, so logout and "sign out all devices" take effect at once.
 * `userId` defaults to the env admin.
 */
export async function createSession(
  email: string,
  opts: { userId?: string; userAgent?: string | null; ip?: string | null } = {},
): Promise<string> {
  const secret = getJwtSecret();
  if (!secret) throw new Error("Cannot create session: JWT_SECRET is not configured");
  const jti = randomUUID();
  const userId = opts.userId ?? ENV_ADMIN_ID;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_MAX_AGE_SECONDS * 1000);
  let ec: string | undefined;
  if (userId === ENV_ADMIN_ID) {
    const creds = resolveAdminCredentials();
    if (!creds) throw new Error("Cannot create an env-admin session: admin credentials are not configured");
    ec = envCredentialTag(secret, creds);
  }
  await addAdminSession({
    id: jti, userId, email, createdAt: now.toISOString(), expiresAt: expiresAt.toISOString(),
    userAgent: opts.userAgent ? opts.userAgent.slice(0, MAX_USER_AGENT) : undefined,
    ip: opts.ip ? opts.ip.slice(0, 64) : undefined,
  }).catch((err) => { hintIfSchemaMissing(err); throw err; });
  return new SignJWT({ email, role: "admin", sv: sessionVersion(), uid: userId, ...(ec ? { ec } : {}) })
    .setProtectedHeader({ alg: "HS256" })
    .setJti(jti)
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .setIssuedAt(Math.floor(now.getTime() / 1000))
    .sign(secret);
}

/**
 * Checks the session cookie: a valid JWT (alg/iss/aud/role/sv, B-08) AND a matching
 * `admin_sessions` row that is not revoked or expired AND an account that may still log in
 * (an active DB user, or the env admin while ADMIN_EMAIL still names it). One DB read for the
 * session plus one for a DB user per admin request. Any error = unauthenticated.
 */
export async function verifySession(): Promise<SessionCheck> {
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
      requiredClaims: ["exp", "iat", "jti"],
    });
    if (payload.role !== "admin" || payload.sv !== sessionVersion() || typeof payload.email !== "string" || typeof payload.jti !== "string") {
      return { authenticated: false };
    }
    const session = await getAdminSession(payload.jti);
    if (!session || session.revokedAt || !(Date.parse(session.expiresAt) > Date.now())) return { authenticated: false };
    if (session.email !== payload.email || session.userId !== payload.uid) return { authenticated: false };
    if (session.userId === ENV_ADMIN_ID) {
      const creds = resolveAdminCredentials();
      if (!creds || normalizeEmail(creds.email) !== normalizeEmail(session.email)) return { authenticated: false };
      // The env password/hash changed since this session was created: it no longer counts.
      if (typeof payload.ec !== "string" || !safeEqual(payload.ec, envCredentialTag(secret, creds))) return { authenticated: false };
    } else {
      const user = await getAdminUserById(session.userId);
      if (!user || !user.active) return { authenticated: false };
    }
    return { authenticated: true, email: session.email, userId: session.userId, sessionId: session.id };
  } catch (err) {
    // A bad token is normal; a DB failure is worth a log line (still fails closed).
    const code = (err as { code?: unknown } | null)?.code;
    if (!(typeof code === "string" && code.startsWith("ERR_J"))) { hintIfSchemaMissing(err); console.error("[auth] session check failed:", err); }
    return { authenticated: false };
  }
}

/** bcrypt cost for DB admin passwords. */
export const BCRYPT_COST = 12;
export const hashPassword = (password: string) => bcryptHash(password, BCRYPT_COST);

// bcrypt hash compared against when no account matches, so an unknown e-mail costs the same
// time as a wrong password (no user enumeration by timing). Created once, lazily.
let dummyHash: Promise<string> | null = null;
const getDummyHash = () => (dummyHash ??= bcryptHash(randomUUID(), BCRYPT_COST));

/**
 * Single entry point for admin login checks (N-8). Returns who logged in, or null.
 *
 * - The env admin (ADMIN_EMAIL + ADMIN_PASSWORD(_HASH)) is the bootstrap/recovery login and
 *   keeps its fail-closed production behaviour (no env admin when its vars are missing).
 * - Otherwise the e-mail is looked up in admin_users (case-insensitive); inactive users fail.
 * - Fails closed for everyone when JWT_SECRET is missing/invalid in production.
 * - Every path does the same DB lookup and exactly one bcrypt compare (a dummy hash when nothing
 *   matches or the env admin uses a plaintext password), so timing reveals neither which
 *   accounts exist (including whether an email is the env admin's) nor which half was wrong.
 * - If ADMIN_EMAIL equals a DB user's email, the env admin wins (that DB user can only sign in
 *   with the env password); this is logged as a configuration error.
 */
export async function authenticateAdmin(email: unknown, password: unknown): Promise<{ email: string; userId: string } | null> {
  if (getJwtSecret() === null) return null;
  const creds = resolveAdminCredentials();
  const given = typeof email === "string" ? normalizeEmail(email) : "";
  const pw = typeof password === "string" ? password : "";
  const compare = async (hash: string, what: string) => {
    try { return await bcryptCompare(pw, hash); } catch (err) {
      logConfigError(`${what} is not a valid bcrypt hash (${err instanceof Error ? err.message : String(err)}).`);
      return false;
    }
  };

  // Always looked up, even for the env admin's email: skipping it would make that email
  // measurably faster to reject and so reveal it (review finding).
  const user = given ? await getAdminUserByEmail(given) : null;

  if (creds && given && safeEqual(given, normalizeEmail(creds.email))) {
    if (user) logConfigError("ADMIN_EMAIL is also a DB admin user's email; that user can only sign in with the env password. Remove or rename one of them.");
    let ok: boolean;
    if ("passwordHash" in creds) ok = await compare(creds.passwordHash, "ADMIN_PASSWORD_HASH");
    else { await compare(await getDummyHash(), "dummy"); ok = safeEqual(password, creds.password); }
    return ok ? { email: creds.email, userId: ENV_ADMIN_ID } : null;
  }

  const ok = await compare(user?.passwordHash ?? (await getDummyHash()), "admin_users.password_hash");
  return ok && user && user.active ? { email: user.email, userId: user.id } : null;
}

/** Back-compat wrapper: true when `authenticateAdmin` accepts the credentials. */
export async function verifyAdminCredentials(email: unknown, password: unknown): Promise<boolean> {
  return (await authenticateAdmin(email, password)) !== null;
}

/** The env admin's e-mail (lower-case), or null when it is not configured (production without vars). */
export function envAdminEmail(): string | null {
  const creds = resolveAdminCredentials();
  return creds ? normalizeEmail(creds.email) : null;
}

export { COOKIE_NAME };
