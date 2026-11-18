import "../helpers/no-upstash";
import fs from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, type NextResponse } from "next/server";
import { uniqueIp, useTempDb } from "../helpers/temp-db";
import type { AdminDB, AuditEntry, PublicAdminUser } from "@/lib/types";

const sessionCookie = (res: Response) => (res as NextResponse).cookies.get("admin_session");

// N-8: DB admin users, revocable server-side sessions, user management and the audit log,
// against the JSON backend (temp file). verifySession() reads the cookie via next/headers.
const session = vi.hoisted(() => ({ token: undefined as string | undefined }));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (name === "admin_session" && session.token ? { name, value: session.token } : undefined),
  }),
}));

let db: ReturnType<typeof useTempDb>;
let login: typeof import("@/app/api/auth/login/route");
let logout: typeof import("@/app/api/auth/logout/route");
let signoutAll: typeof import("@/app/api/auth/signout-all/route");
let me: typeof import("@/app/api/auth/me/route");
let users: typeof import("@/app/api/admin-users/route");
let auditRoute: typeof import("@/app/api/audit/route");
let packages: typeof import("@/app/api/packages/route");
let bookings: typeof import("@/app/api/bookings/route");

const ENV_EMAIL = "admin@atlastours.com";
const ENV_PASSWORD = "admin123";
const PASSWORD = "correct horse battery";

beforeAll(async () => {
  db = useTempDb({
    bookings: [{
      id: "b1", name: "N", phone: "9876543210", email: "n@example.com", city: "C", packageId: "p", packageName: "P",
      travelers: 1, travelDate: "2026-12-01", amount: 1, paymentStatus: "pending", bookingStatus: "pending", createdAt: "2026-01-01T00:00:00.000Z",
    }],
  });
  [login, logout, signoutAll, me, users, auditRoute, packages, bookings] = await Promise.all([
    import("@/app/api/auth/login/route"), import("@/app/api/auth/logout/route"), import("@/app/api/auth/signout-all/route"),
    import("@/app/api/auth/me/route"), import("@/app/api/admin-users/route"), import("@/app/api/audit/route"),
    import("@/app/api/packages/route"), import("@/app/api/bookings/route"),
  ]);
});
afterAll(() => db.cleanup());
beforeEach(() => { session.token = undefined; });

const adminFile = () => db.file.replace(/\.json$/, ".admin.json");
const readAdmin = (): AdminDB => JSON.parse(fs.readFileSync(adminFile(), "utf-8"));

const req = (url: string, method = "GET", body?: unknown, headers: Record<string, string> = {}) =>
  new NextRequest(`http://localhost${url}`, {
    method, body: body === undefined ? undefined : JSON.stringify(body),
    headers: { "content-type": "application/json", "x-forwarded-for": uniqueIp(), ...headers },
  });

/** Logs in through the real route; returns the session token (or the failed response). */
async function signIn(email: string, password: string): Promise<string> {
  const res = await login.POST(req("/api/auth/login", "POST", { email, password }));
  expect(res.status).toBe(200);
  const token = sessionCookie(res)?.value;
  expect(token).toBeTruthy();
  return token!;
}
const loginStatus = async (email: string, password: string) =>
  (await login.POST(req("/api/auth/login", "POST", { email, password }))).status;

/** GET /api/auth/me with `token`: the status tells whether the session is still valid. */
async function meWith(token: string) {
  session.token = token;
  const res = await me.GET();
  session.token = undefined;
  return res;
}

async function as<T>(token: string, fn: () => Promise<T>): Promise<T> {
  session.token = token;
  try { return await fn(); } finally { session.token = undefined; }
}

async function createUser(token: string, body: Record<string, unknown>) {
  return as(token, () => users.POST(req("/api/admin-users", "POST", body)));
}

let n = 0;
const uniqueEmail = () => `user${++n}.${Date.now()}@example.com`;

async function newUser(envToken: string, over: Record<string, unknown> = {}) {
  const email = uniqueEmail();
  const res = await createUser(envToken, { email, name: "Test User", password: PASSWORD, ...over });
  expect(res.status).toBe(200);
  return { email, user: (await res.json()) as PublicAdminUser };
}

const auditLog = () => readAdmin().auditLog;
const lastAudit = (): AuditEntry => auditLog().at(-1)!;

describe("login", () => {
  it("accepts the env admin and creates a server-side session", async () => {
    const token = await signIn(ENV_EMAIL, ENV_PASSWORD);
    const res = await meWith(token);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ authenticated: true, email: ENV_EMAIL, userId: "env" });
    const sessions = readAdmin().adminSessions.filter(s => s.userId === "env" && !s.revokedAt);
    expect(sessions.length).toBeGreaterThan(0);
    expect(lastAudit()).toMatchObject({ action: "login", actorEmail: ENV_EMAIL, details: [] });
  });

  it("accepts the env admin e-mail case-insensitively", async () => {
    expect(await loginStatus(" Admin@AtlasTours.com ", ENV_PASSWORD)).toBe(200);
  });

  it("accepts an active DB user (case-insensitive e-mail) and records lastLoginAt", async () => {
    const envToken = await signIn(ENV_EMAIL, ENV_PASSWORD);
    const { email, user } = await newUser(envToken);
    expect(user.lastLoginAt).toBeUndefined();

    const token = await signIn(email.toUpperCase(), PASSWORD);
    expect(await (await meWith(token)).json()).toEqual({ authenticated: true, email, userId: user.id });
    const stored = readAdmin().adminUsers.find(u => u.id === user.id)!;
    expect(stored.lastLoginAt).toBeTruthy();
    expect(lastAudit()).toMatchObject({ action: "login", actorEmail: email });
  });

  it("rejects a wrong password, an unknown e-mail and an inactive user with the same 401", async () => {
    const envToken = await signIn(ENV_EMAIL, ENV_PASSWORD);
    const { email } = await newUser(envToken, { active: false });
    for (const [e, p] of [[ENV_EMAIL, "wrong"], [uniqueEmail(), PASSWORD], [email, PASSWORD], [email, "wrong password!!"]]) {
      const res = await login.POST(req("/api/auth/login", "POST", { email: e, password: p }));
      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ error: "Invalid credentials" });
      expect(sessionCookie(res)).toBeUndefined();
    }
    expect(lastAudit()).toMatchObject({ action: "login_failed", actorEmail: email, details: [] });
  });

  it("does not record a non-email login input (e.g. a password typed in the e-mail box)", async () => {
    expect(await loginStatus("hunter2-secret", "x")).toBe(401);
    expect(lastAudit()).toMatchObject({ action: "login_failed", actorEmail: "(invalid email)" });
    expect(JSON.stringify(auditLog())).not.toContain("hunter2-secret");
  });

  it("still locks an IP out after 5 failures (unchanged)", async () => {
    const ip = uniqueIp();
    const attempt = () => login.POST(req("/api/auth/login", "POST", { email: ENV_EMAIL, password: "nope" }, { "x-forwarded-for": ip }));
    for (let i = 0; i < 5; i++) expect((await attempt()).status).toBe(401);
    expect((await attempt()).status).toBe(429);
  });
});

describe("sessions", () => {
  it("rejects a token whose session row does not exist", async () => {
    const token = await signIn(ENV_EMAIL, ENV_PASSWORD);
    const data = readAdmin();
    data.adminSessions = [];
    fs.writeFileSync(adminFile(), JSON.stringify(data));
    expect((await meWith(token)).status).toBe(401);
  });

  it("logout revokes the session, so the same token no longer works", async () => {
    const token = await signIn(ENV_EMAIL, ENV_PASSWORD);
    expect((await meWith(token)).status).toBe(200);
    const res = await as(token, () => logout.POST(req("/api/auth/logout", "POST")));
    expect(res.status).toBe(200);
    expect(sessionCookie(res)?.value).toBe("");
    expect((await meWith(token)).status).toBe(401);
    // ...and admin endpoints reject it too.
    expect((await as(token, () => users.GET(req("/api/admin-users")))).status).toBe(401);
    expect(lastAudit()).toMatchObject({ action: "logout", actorEmail: ENV_EMAIL });
  });

  it("sign out all devices revokes every session of that user, including the current one, and no one else's", async () => {
    const envToken = await signIn(ENV_EMAIL, ENV_PASSWORD);
    const { email, user } = await newUser(envToken);
    const a = await signIn(email, PASSWORD);
    const b = await signIn(email, PASSWORD);

    const res = await as(a, () => signoutAll.POST(req("/api/auth/signout-all", "POST")));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true, revoked: 2 });
    expect(sessionCookie(res)?.value).toBe("");
    expect((await meWith(a)).status).toBe(401);
    expect((await meWith(b)).status).toBe(401);
    expect((await meWith(envToken)).status).toBe(200);
    expect(lastAudit()).toMatchObject({ action: "signout_all", actorEmail: email, entity: "sessions", entityId: user.id });
    // Logging in again works.
    expect((await meWith(await signIn(email, PASSWORD))).status).toBe(200);
  });

  it("sign out all needs a session", async () => {
    expect((await signoutAll.POST(req("/api/auth/signout-all", "POST"))).status).toBe(401);
  });

  it("SESSION_VERSION still logs everyone out", async () => {
    const token = await signIn(ENV_EMAIL, ENV_PASSWORD);
    vi.stubEnv("SESSION_VERSION", "2");
    try {
      expect((await meWith(token)).status).toBe(401);
    } finally {
      vi.unstubAllEnvs();
      vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
      vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
    }
    expect((await meWith(token)).status).toBe(200);
  });

  it("rejects an expired session row even if the JWT is still valid", async () => {
    const token = await signIn(ENV_EMAIL, ENV_PASSWORD);
    const data = readAdmin();
    const row = data.adminSessions.at(-1)!;
    row.expiresAt = new Date(Date.now() - 1000).toISOString();
    fs.writeFileSync(adminFile(), JSON.stringify(data));
    expect((await meWith(token)).status).toBe(401);
  });

  it("prunes expired and long-revoked rows on login", async () => {
    const data = readAdmin();
    const old = new Date(Date.now() - 3 * 86400_000).toISOString();
    data.adminSessions.push(
      { id: "expired-row", userId: "env", email: ENV_EMAIL, createdAt: old, expiresAt: old },
      { id: "revoked-row", userId: "env", email: ENV_EMAIL, createdAt: old, expiresAt: new Date(Date.now() + 3600_000).toISOString(), revokedAt: old },
    );
    fs.writeFileSync(adminFile(), JSON.stringify(data));
    await signIn(ENV_EMAIL, ENV_PASSWORD);
    const ids = readAdmin().adminSessions.map(s => s.id);
    expect(ids).not.toContain("expired-row");
    expect(ids).not.toContain("revoked-row");
  });

  it("stores a capped user agent and the client IP", async () => {
    const res = await login.POST(req("/api/auth/login", "POST", { email: ENV_EMAIL, password: ENV_PASSWORD },
      { "user-agent": "x".repeat(2000), "x-forwarded-for": "203.0.113.9" }));
    expect(res.status).toBe(200);
    const row = readAdmin().adminSessions.at(-1)!;
    expect(row.userAgent).toHaveLength(512);
    expect(row.ip).toBe("203.0.113.9");
  });
});

describe("/api/admin-users", () => {
  it("is admin-only", async () => {
    expect((await users.GET(req("/api/admin-users"))).status).toBe(401);
    expect((await users.POST(req("/api/admin-users", "POST", { email: uniqueEmail(), name: "x", password: PASSWORD }))).status).toBe(401);
    expect((await users.PATCH(req("/api/admin-users", "PATCH", { id: "x", name: "y" }))).status).toBe(401);
    expect((await users.DELETE(req("/api/admin-users", "DELETE", { id: "x" }))).status).toBe(401);
  });

  it("never returns the password hash", async () => {
    const envToken = await signIn(ENV_EMAIL, ENV_PASSWORD);
    const email = uniqueEmail();
    const created = await createUser(envToken, { email: email.toUpperCase(), name: "Hash Check", password: PASSWORD });
    const createdText = await created.text();
    const user = JSON.parse(createdText) as PublicAdminUser;
    expect(user).toEqual({ id: expect.any(String), email, name: "Hash Check", active: true, createdAt: expect.any(String) });

    const listText = await (await as(envToken, () => users.GET(req("/api/admin-users")))).text();
    const patchText = await (await as(envToken, () => users.PATCH(req("/api/admin-users", "PATCH", { id: user.id, password: "another long password" })))).text();
    const auditText = await (await as(envToken, () => auditRoute.GET(req("/api/audit?limit=500")))).text();
    for (const text of [createdText, listText, patchText, auditText]) {
      expect(text).not.toMatch(/passwordHash|password_hash|\$2[aby]\$/);
      expect(text).not.toContain(PASSWORD);
      expect(text).not.toContain("another long password");
    }
    // The stored hash is bcrypt with cost >= 10.
    const stored = readAdmin().adminUsers.find(u => u.id === user.id)!;
    expect(stored.passwordHash).toMatch(/^\$2[aby]\$(1[0-9]|[2-3][0-9])\$/);
  });

  it("validates input", async () => {
    const envToken = await signIn(ENV_EMAIL, ENV_PASSWORD);
    const bad = async (body: Record<string, unknown>) => (await createUser(envToken, body)).status;
    expect(await bad({ email: "not-an-email", name: "x", password: PASSWORD })).toBe(400);
    expect(await bad({ email: uniqueEmail(), name: "", password: PASSWORD })).toBe(400);
    expect(await bad({ email: uniqueEmail(), name: "x", password: "short" })).toBe(400);
    expect(await bad({ email: uniqueEmail(), name: "x", password: "😀".repeat(19) })).toBe(400); // 76 bytes > 72
    expect(await bad({ email: uniqueEmail(), name: "x", password: 123456789012 })).toBe(400);
    expect(await bad({ email: uniqueEmail(), name: "x", password: PASSWORD, active: "yes" })).toBe(400);
    expect(await bad({ email: ENV_EMAIL.toUpperCase(), name: "x", password: PASSWORD })).toBe(409);
    const { email } = await newUser(envToken);
    expect(await bad({ email: email.toUpperCase(), name: "Dup", password: PASSWORD })).toBe(409);

    const patch = async (body: Record<string, unknown>) => (await as(envToken, () => users.PATCH(req("/api/admin-users", "PATCH", body)))).status;
    expect(await patch({ id: "no-such-user", name: "x" })).toBe(404);
    const { user } = await newUser(envToken);
    expect(await patch({ id: user.id })).toBe(400);
    expect(await patch({ id: user.id, password: "short" })).toBe(400);
    expect(await patch({ id: user.id, active: "no" })).toBe(400);
    expect((await as(envToken, () => users.DELETE(req("/api/admin-users", "DELETE", { id: "no-such-user" })))).status).toBe(404);
  });

  it("deactivating a user revokes their sessions and blocks login; reactivating allows it again", async () => {
    const envToken = await signIn(ENV_EMAIL, ENV_PASSWORD);
    const { email, user } = await newUser(envToken);
    const token = await signIn(email, PASSWORD);

    const res = await as(envToken, () => users.PATCH(req("/api/admin-users", "PATCH", { id: user.id, active: false })));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ id: user.id, active: false });
    expect((await meWith(token)).status).toBe(401);
    expect(readAdmin().adminSessions.filter(s => s.userId === user.id).every(s => s.revokedAt)).toBe(true);
    expect(lastAudit()).toMatchObject({ action: "update", actorEmail: ENV_EMAIL, entity: "admin_users", entityId: user.id, details: ["active"] });
    expect(await loginStatus(email, PASSWORD)).toBe(401);

    await as(envToken, () => users.PATCH(req("/api/admin-users", "PATCH", { id: user.id, active: true })));
    expect(await loginStatus(email, PASSWORD)).toBe(200);
  });

  it("a session dies as soon as its user is inactive, even before revocation", async () => {
    const envToken = await signIn(ENV_EMAIL, ENV_PASSWORD);
    const { email, user } = await newUser(envToken);
    const token = await signIn(email, PASSWORD);
    const data = readAdmin();
    data.adminUsers.find(u => u.id === user.id)!.active = false;
    fs.writeFileSync(adminFile(), JSON.stringify(data));
    expect((await meWith(token)).status).toBe(401);
  });

  it("deleting a user revokes their sessions", async () => {
    const envToken = await signIn(ENV_EMAIL, ENV_PASSWORD);
    const { email, user } = await newUser(envToken);
    const token = await signIn(email, PASSWORD);
    const res = await as(envToken, () => users.DELETE(req("/api/admin-users", "DELETE", { id: user.id })));
    expect(await res.json()).toEqual({ success: true });
    expect((await meWith(token)).status).toBe(401);
    expect(readAdmin().adminUsers.some(u => u.id === user.id)).toBe(false);
    expect(lastAudit()).toMatchObject({ action: "delete", entity: "admin_users", entityId: user.id, details: [] });
    expect(await loginStatus(email, PASSWORD)).toBe(401);
  });

  it("an admin cannot deactivate or delete themselves", async () => {
    const envToken = await signIn(ENV_EMAIL, ENV_PASSWORD);
    const { email, user } = await newUser(envToken);
    const token = await signIn(email, PASSWORD);
    const deactivate = await as(token, () => users.PATCH(req("/api/admin-users", "PATCH", { id: user.id, active: false })));
    expect(deactivate.status).toBe(400);
    expect(await deactivate.json()).toEqual({ error: "You cannot deactivate your own account" });
    const del = await as(token, () => users.DELETE(req("/api/admin-users", "DELETE", { id: user.id })));
    expect(del.status).toBe(400);
    expect((await meWith(token)).status).toBe(200);
    // Renaming yourself is fine.
    expect((await as(token, () => users.PATCH(req("/api/admin-users", "PATCH", { id: user.id, name: "Renamed" })))).status).toBe(200);
  });

  it("changing a user's password revokes their sessions; changing your own keeps the current one", async () => {
    const envToken = await signIn(ENV_EMAIL, ENV_PASSWORD);
    const { email, user } = await newUser(envToken);
    const current = await signIn(email, PASSWORD);
    const other = await signIn(email, PASSWORD);

    // Own password: current session survives, the other device is signed out.
    const res = await as(current, () => users.PATCH(req("/api/admin-users", "PATCH", { id: user.id, password: "my new password 1" })));
    expect(res.status).toBe(200);
    expect((await meWith(current)).status).toBe(200);
    expect((await meWith(other)).status).toBe(401);
    expect(lastAudit()).toMatchObject({ action: "password_change", actorEmail: email, entityId: user.id, details: [] });
    expect(await loginStatus(email, PASSWORD)).toBe(401);
    expect(await loginStatus(email, "my new password 1")).toBe(200);

    // Another admin resets it: every session of that user goes.
    await as(envToken, () => users.PATCH(req("/api/admin-users", "PATCH", { id: user.id, password: "reset by admin 22" })));
    expect((await meWith(current)).status).toBe(401);
    expect(await loginStatus(email, "reset by admin 22")).toBe(200);
  });

  it("DB users have the same permissions as the env admin (can manage users and content)", async () => {
    const envToken = await signIn(ENV_EMAIL, ENV_PASSWORD);
    const { email } = await newUser(envToken);
    const token = await signIn(email, PASSWORD);
    expect((await as(token, () => users.GET(req("/api/admin-users")))).status).toBe(200);
    const created = await createUser(token, { email: uniqueEmail(), name: "Made by DB user", password: PASSWORD });
    expect(created.status).toBe(200);
    expect((await as(token, () => packages.GET(req("/api/packages?all=1")))).status).toBe(200);
  });
});

describe("audit log", () => {
  it("records content create/update/delete with field names only", async () => {
    const token = await signIn(ENV_EMAIL, ENV_PASSWORD);
    const created = await as(token, () => packages.POST(req("/api/packages", "POST", { name: "Audit Tour", price: 1234, description: "secret value" })));
    expect(created.status).toBe(200);
    const pkg = (await created.json()) as { id: string };
    expect(lastAudit()).toMatchObject({ action: "create", actorEmail: ENV_EMAIL, entity: "packages", entityId: pkg.id });
    expect(lastAudit().details).toEqual(expect.arrayContaining(["name", "price", "description"]));

    await as(token, () => packages.PATCH(req("/api/packages", "PATCH", { id: pkg.id, price: 999, hidden: true })));
    expect(lastAudit()).toMatchObject({ action: "update", entity: "packages", entityId: pkg.id, details: ["price", "hidden"] });

    await as(token, () => packages.DELETE(req("/api/packages", "DELETE", { id: pkg.id })));
    expect(lastAudit()).toMatchObject({ action: "delete", entity: "packages", entityId: pkg.id, details: [] });

    const text = JSON.stringify(auditLog());
    expect(text).not.toContain("secret value");
    expect(text).not.toContain("Audit Tour");
    expect(text).not.toContain("1234");
  });

  it("records booking updates and deletes", async () => {
    const token = await signIn(ENV_EMAIL, ENV_PASSWORD);
    expect((await as(token, () => bookings.PATCH(req("/api/bookings", "PATCH", { id: "b1", bookingStatus: "confirmed" })))).status).toBe(200);
    expect(lastAudit()).toMatchObject({ action: "update", entity: "bookings", entityId: "b1", details: ["bookingStatus"] });
    expect((await as(token, () => bookings.DELETE(req("/api/bookings", "DELETE", { id: "b1" })))).status).toBe(200);
    expect(lastAudit()).toMatchObject({ action: "delete", entity: "bookings", entityId: "b1" });
  });

  it("does not record failed (401/404) writes", async () => {
    const before = auditLog().length;
    await packages.DELETE(req("/api/packages", "DELETE", { id: "nope" }));
    const token = await signIn(ENV_EMAIL, ENV_PASSWORD);
    const afterLogin = auditLog().length;
    expect(afterLogin).toBe(before + 1);
    expect((await as(token, () => packages.DELETE(req("/api/packages", "DELETE", { id: "nope" })))).status).toBe(404);
    expect(auditLog().length).toBe(afterLogin);
  });

  it("GET /api/audit is admin-only, newest first, with a capped limit", async () => {
    expect((await auditRoute.GET(req("/api/audit"))).status).toBe(401);
    const token = await signIn(ENV_EMAIL, ENV_PASSWORD);
    const all = (await (await as(token, () => auditRoute.GET(req("/api/audit?limit=500")))).json()) as AuditEntry[];
    expect(all[0]).toMatchObject({ action: "login", actorEmail: ENV_EMAIL });
    const times = all.map(e => Date.parse(e.createdAt));
    expect(times).toEqual([...times].sort((a, b) => b - a));
    const two = (await (await as(token, () => auditRoute.GET(req("/api/audit?limit=2")))).json()) as AuditEntry[];
    expect(two).toEqual(all.slice(0, 2));

    // Over the cap → 500 entries max; junk → the default (100).
    const data = readAdmin();
    for (let i = 0; i < 600; i++) {
      data.auditLog.push({ id: `bulk-${i}`, createdAt: new Date().toISOString(), actorEmail: "x@example.com", action: "update", details: [] });
    }
    fs.writeFileSync(adminFile(), JSON.stringify(data));
    expect(((await (await as(token, () => auditRoute.GET(req("/api/audit?limit=100000")))).json()) as unknown[]).length).toBe(500);
    expect(((await (await as(token, () => auditRoute.GET(req("/api/audit?limit=abc")))).json()) as unknown[]).length).toBe(100);
  });

  it("keeps logins and audit out of the git-tracked content file", () => {
    const content = JSON.parse(fs.readFileSync(db.file, "utf-8")) as Record<string, unknown>;
    expect(content).not.toHaveProperty("adminSessions");
    expect(content).not.toHaveProperty("auditLog");
    expect(content).not.toHaveProperty("adminUsers");
  });
});

describe("review fixes", () => {
  it("rotating the env admin's password ends existing env-admin sessions", async () => {
    const token = await signIn(ENV_EMAIL, ENV_PASSWORD);
    expect((await meWith(token)).status).toBe(200);
    vi.stubEnv("ADMIN_PASSWORD", "a-brand-new-password");
    try {
      expect((await meWith(token)).status).toBe(401);
    } finally {
      vi.unstubAllEnvs();
    }
    // Same credentials again → the tag matches again (it is derived, not stored).
    expect((await meWith(token)).status).toBe(200);
  });

  it("logging in again revokes the session the new cookie replaces", async () => {
    const first = await signIn(ENV_EMAIL, ENV_PASSWORD);
    const res = await as(first, () => login.POST(req("/api/auth/login", "POST", { email: ENV_EMAIL, password: ENV_PASSWORD })));
    expect(res.status).toBe(200);
    const second = sessionCookie(res)!.value;
    expect((await meWith(first)).status).toBe(401);
    expect((await meWith(second)).status).toBe(200);
  });

  it("stops auditing failed logins once the global hourly cap is reached", async () => {
    const { consume } = await import("@/lib/rate-limit");
    for (let i = 0; i < 60; i++) await consume("audit:login_failed", 50, 60 * 60 * 1000);
    const before = auditLog().filter(e => e.action === "login_failed").length;
    expect(await loginStatus("nobody@example.com", "wrong-password")).toBe(401);
    expect(auditLog().filter(e => e.action === "login_failed").length).toBe(before);
  });

  it("pruneAuditLog deletes entries older than the cutoff only", async () => {
    const { pruneAuditLog } = await import("@/lib/db");
    const all = auditLog();
    expect(all.length).toBeGreaterThan(1);
    const cutoff = new Date(Date.parse(all.at(-1)!.createdAt)); // the newest entry is kept
    const removed = await pruneAuditLog(cutoff);
    const left = auditLog();
    expect(removed).toBe(all.length - left.length);
    expect(left.every(e => Date.parse(e.createdAt) >= cutoff.getTime())).toBe(true);
    expect(left.length).toBeGreaterThan(0);
  });
});
