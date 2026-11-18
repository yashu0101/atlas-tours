import { addAuditEntry } from "./db";
import type { AuditAction } from "./types";

/**
 * Admin audit log (N-8). `audit()` records who did what; `details` holds the NAMES of the
 * fields that were sent/changed — never their values, and never passwords or hashes.
 *
 * Best effort: a failed write is logged and swallowed, so it can never fail the admin's
 * action (which has already happened when this runs).
 */

// Runtime copy of AuditAction; `satisfies` keeps it in step with types.ts. The Postgres CHECK
// (migration v6 in db-schema.ts) lists the same values: a new action needs a migration.
export const AUDIT_ACTIONS = Object.keys({
  create: 1, update: 1, delete: 1, login: 1, logout: 1, login_failed: 1, signout_all: 1, password_change: 1,
} satisfies Record<AuditAction, 1>) as AuditAction[];

/** Fields that must never appear in `details`, even as a name the caller passed by mistake. */
const SECRET_FIELDS = new Set(["password", "passwordHash", "password_hash"]);

const MAX_EMAIL = 254;

export async function audit(
  actor: { email: string } | string,
  action: AuditAction,
  target: { entity?: string; entityId?: string; fields?: readonly string[] } = {},
): Promise<void> {
  try {
    const email = (typeof actor === "string" ? actor : actor.email).slice(0, MAX_EMAIL);
    await addAuditEntry({
      actorEmail: email,
      action,
      entity: target.entity,
      entityId: target.entityId?.slice(0, 200),
      details: [...new Set(target.fields ?? [])].filter(f => !SECRET_FIELDS.has(f)).map(f => f.slice(0, 100)),
    });
  } catch (err) {
    console.error(`[audit] failed to record ${action}${target.entity ? ` ${target.entity}` : ""}:`, err);
  }
}
