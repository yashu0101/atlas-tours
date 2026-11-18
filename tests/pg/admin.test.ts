import { describe, expect, it } from "vitest";
import {
  addAdminSession, addAdminUser, addAuditEntry, deleteAdminUser, DuplicateEmailError, getAdminSession, getAdminUserByEmail,
  getAdminUserById, getAdminUsers, getAuditLog, pruneAdminSessions, revokeAdminSession, revokeAdminSessionsForUser, updateAdminUser,
} from "@/lib/db";
import { AUDIT_ACTIONS } from "@/lib/audit";
import { isIsoString, setupPgDb } from "../helpers/pglite-sql";

// N-8 on the Postgres path (PGlite): admin users, sessions and the audit log.
const pg = setupPgDb();

const HASH = "$2b$12$" + "a".repeat(53); // 60 chars, bcrypt-shaped
const user = (email: string, over = {}) => ({ email, name: "U", passwordHash: HASH, active: true, ...over });
const hour = 3600_000;
const session = (id: string, userId: string, over = {}) => ({
  id, userId, email: "u@example.com", createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + hour).toISOString(), ...over,
});

describe("Postgres: admin users", () => {
  it("round-trips a user, stores the email lower-case and reads optional fields as undefined", async () => {
    const u = await addAdminUser(user("Mixed@Example.COM"));
    expect(u.email).toBe("mixed@example.com");
    const read = await getAdminUserById(u.id);
    expect(read).toEqual({ ...u, lastLoginAt: undefined });
    expect(isIsoString(read!.createdAt)).toBe(true);
    expect(await getAdminUserByEmail(" MIXED@example.com ")).toMatchObject({ id: u.id });
    expect(await getAdminUserByEmail("nobody@example.com")).toBeNull();

    const at = new Date().toISOString();
    expect(await updateAdminUser(u.id, { lastLoginAt: at, active: false, name: "N" })).toMatchObject({ lastLoginAt: at, active: false, name: "N" });
    expect((await getAdminUsers()).map(x => x.id)).toEqual([u.id]);
    expect(await deleteAdminUser(u.id)).toBe(true);
    expect(await getAdminUserById(u.id)).toBeNull();
  });

  it("rejects a duplicate email case-insensitively (unique index on lower(email))", async () => {
    await addAdminUser(user("dup@example.com"));
    await expect(addAdminUser(user("DUP@example.com"))).rejects.toBeInstanceOf(DuplicateEmailError);
    // The index itself, bypassing the app's lower-casing:
    await expect(pg.db.query("INSERT INTO admin_users (id,email,name,password_hash,created_at) VALUES ('x','Dup@example.com','n',$1,now())", [HASH]))
      .rejects.toThrow();
  });

  it("enforces the CHECK constraints", async () => {
    await expect(pg.db.query("INSERT INTO admin_users (id,email,name,password_hash,created_at) VALUES ('a','Upper@x.com','n',$1,now())", [HASH]))
      .rejects.toThrow(/admin_users_email_lowercase/);
    await expect(pg.db.query("INSERT INTO admin_users (id,email,name,password_hash,created_at) VALUES ('b','b@x.com','n','plaintext',now())"))
      .rejects.toThrow(/admin_users_password_hash_bcrypt/);
    await expect(addAdminSession(session("s", "env", { userAgent: "x".repeat(513) }))).rejects.toThrow(/admin_sessions_user_agent_length/);
    await expect(addAdminSession(session("s", "env", { expiresAt: new Date(Date.now() - hour).toISOString() })))
      .rejects.toThrow(/admin_sessions_expiry_after_creation/);
    await expect(addAuditEntry({ actorEmail: "a", action: "hack" as "create", details: [] })).rejects.toThrow(/audit_log_action_valid/);
  });
});

describe("Postgres: admin sessions", () => {
  it("adds, reads, revokes one and revokes all of a user except one", async () => {
    await addAdminSession(session("s1", "u1", { userAgent: "UA", ip: "1.2.3.4" }));
    await addAdminSession(session("s2", "u1"));
    await addAdminSession(session("s3", "u1"));
    await addAdminSession(session("other", "u2"));
    const s1 = await getAdminSession("s1");
    expect(s1).toMatchObject({ id: "s1", userId: "u1", userAgent: "UA", ip: "1.2.3.4", revokedAt: undefined });
    expect(isIsoString(s1!.expiresAt)).toBe(true);

    await revokeAdminSession("s1");
    const revoked = (await getAdminSession("s1"))!.revokedAt;
    expect(isIsoString(revoked)).toBe(true);
    await revokeAdminSession("s1"); // idempotent: keeps the first timestamp
    expect((await getAdminSession("s1"))!.revokedAt).toBe(revoked);

    expect(await revokeAdminSessionsForUser("u1", "s3")).toBe(1); // s2 only (s1 already revoked)
    expect((await getAdminSession("s2"))!.revokedAt).toBeTruthy();
    expect((await getAdminSession("s3"))!.revokedAt).toBeUndefined();
    expect(await revokeAdminSessionsForUser("u1")).toBe(1);
    expect((await getAdminSession("other"))!.revokedAt).toBeUndefined();
  });

  it("prunes expired and long-revoked rows only", async () => {
    const old = new Date(Date.now() - 3 * 24 * hour);
    await addAdminSession(session("expired", "env", { createdAt: new Date(old.getTime() - hour).toISOString(), expiresAt: old.toISOString() }));
    await addAdminSession(session("old-revoked", "env", { revokedAt: old.toISOString() }));
    await addAdminSession(session("just-revoked", "env", { revokedAt: new Date().toISOString() }));
    await addAdminSession(session("live", "env"));
    expect(await pruneAdminSessions()).toBe(2);
    const left = (await pg.db.query<{ id: string }>("SELECT id FROM admin_sessions ORDER BY id")).rows.map(r => r.id);
    expect(left).toEqual(["just-revoked", "live"]);
  });
});

describe("Postgres: audit log", () => {
  it("accepts every AuditAction, stores details as JSONB and lists newest first with a limit", async () => {
    for (const action of AUDIT_ACTIONS) await addAuditEntry({ actorEmail: "a@example.com", action, details: ["x"] });
    const e = await addAuditEntry({ actorEmail: "b@example.com", action: "update", entity: "packages", entityId: "p1", details: ["price", "hidden"] });
    const log = await getAuditLog(500);
    expect(log).toHaveLength(AUDIT_ACTIONS.length + 1);
    expect(log[0]).toEqual(e);
    expect((await getAuditLog(2))).toHaveLength(2);
    const plain = log.find(x => x.action === "login")!;
    expect(plain.entity).toBeUndefined();
    expect(plain.details).toEqual(["x"]);
    const times = log.map(x => Date.parse(x.createdAt));
    expect(times).toEqual([...times].sort((a, b) => b - a));
  });
});

describe("Postgres: login and sessions end to end", () => {
  it("authenticates a DB user and the session check reads the session row", async () => {
    const { authenticateAdmin, hashPassword } = await import("@/lib/auth");
    const u = await addAdminUser({ email: "pg@example.com", name: "PG", passwordHash: await hashPassword("a long password"), active: true });
    expect(await authenticateAdmin("PG@example.com", "a long password")).toEqual({ email: "pg@example.com", userId: u.id });
    expect(await authenticateAdmin("pg@example.com", "wrong password")).toBeNull();
    await updateAdminUser(u.id, { active: false });
    expect(await authenticateAdmin("pg@example.com", "a long password")).toBeNull();
    expect(await authenticateAdmin("admin@atlastours.com", "admin123")).toEqual({ email: "admin@atlastours.com", userId: "env" });
  });
});
