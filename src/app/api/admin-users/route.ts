import { NextResponse } from "next/server";
import { badRequest, Body, HttpError, isEmail, notFound, readJson, requireAdmin, requireId, str, withHandler } from "@/lib/api";
import { envAdminEmail, hashPassword } from "@/lib/auth";
import { audit } from "@/lib/audit";
import {
  addAdminUser, deleteAdminUser, DuplicateEmailError, getAdminUserById, getAdminUsers, normalizeEmail,
  revokeAdminSessionsForUser, updateAdminUser,
} from "@/lib/db";
import type { AdminUser, PublicAdminUser } from "@/lib/types";

/**
 * N-8 admin user management. Admin-only; every admin has the same permissions.
 * Same contract as the entity routes: bare entities, the id in the JSON body, `{ error }`.
 * Password hashes never leave the server: every response goes through `toPublic`.
 *
 * - GET: all users (oldest first).
 * - POST { email, name, password, active? } → the new user (409 if the email is taken,
 *   including the env admin's email).
 * - PATCH { id, name?, active?, password? } → the updated user. Deactivating or changing a
 *   password revokes that user's sessions (your own password change keeps your current session).
 * - DELETE { id } → { success: true }; the user's sessions are revoked.
 * An admin cannot deactivate or delete themselves (400).
 */

const MIN_PASSWORD = 12;
// bcrypt only uses the first 72 bytes; longer passwords are rejected rather than silently truncated.
const MAX_PASSWORD_BYTES = 72;
const ENTITY = "admin_users";

function toPublic(u: AdminUser): PublicAdminUser {
  return { id: u.id, email: u.email, name: u.name, active: u.active, createdAt: u.createdAt, lastLoginAt: u.lastLoginAt };
}

function password(body: Body): string {
  const p = body.password;
  if (typeof p !== "string") throw badRequest("password must be a string");
  if (p.length < MIN_PASSWORD) throw badRequest(`password must be at least ${MIN_PASSWORD} characters`);
  if (Buffer.byteLength(p, "utf8") > MAX_PASSWORD_BYTES) throw badRequest(`password must be at most ${MAX_PASSWORD_BYTES} bytes`);
  if (!p.trim()) throw badRequest("password cannot be blank");
  return p;
}

function active(body: Body): boolean {
  if (typeof body.active !== "boolean") throw badRequest("active must be a boolean");
  return body.active;
}

export const GET = withHandler(async () => {
  await requireAdmin();
  return NextResponse.json((await getAdminUsers()).map(toPublic));
});

export const POST = withHandler(async (req) => {
  const admin = await requireAdmin();
  const body = await readJson(req);
  const email = normalizeEmail(str(body, "email", 254, true));
  if (!isEmail(email)) throw badRequest("email must be a valid email address");
  const name = str(body, "name", 100, true);
  const pw = password(body);
  const isActive = body.active === undefined ? true : active(body);
  if (email === envAdminEmail()) throw new HttpError(409, "This email belongs to the built-in admin account");
  let user: AdminUser;
  try {
    user = await addAdminUser({ email, name, passwordHash: await hashPassword(pw), active: isActive });
  } catch (err) {
    if (err instanceof DuplicateEmailError) throw new HttpError(409, err.message);
    throw err;
  }
  await audit(admin, "create", { entity: ENTITY, entityId: user.id, fields: ["email", "name", "active"] });
  return NextResponse.json(toPublic(user));
});

export const PATCH = withHandler(async (req) => {
  const admin = await requireAdmin();
  const body = await readJson(req);
  const id = requireId(body);
  const updates: Partial<Pick<AdminUser, "name" | "active" | "passwordHash">> = {};
  if (body.name !== undefined) updates.name = str(body, "name", 100, true);
  if (body.active !== undefined) updates.active = active(body);
  const newPassword = body.password !== undefined ? password(body) : undefined;
  if (updates.name === undefined && updates.active === undefined && newPassword === undefined) {
    throw badRequest("Provide name, active and/or password");
  }
  const self = id === admin.userId;
  if (self && updates.active === false) throw badRequest("You cannot deactivate your own account");
  if (!(await getAdminUserById(id))) throw notFound();
  if (newPassword !== undefined) updates.passwordHash = await hashPassword(newPassword);

  const updated = await updateAdminUser(id, updates);
  if (!updated) throw notFound();
  // Revoke after the write, so a session cannot slip in between with the old password/state.
  if (updates.active === false) await revokeAdminSessionsForUser(id);
  else if (newPassword !== undefined) await revokeAdminSessionsForUser(id, self ? admin.sessionId : undefined);

  const fields = Object.keys(updates).filter(k => k !== "passwordHash");
  if (fields.length) await audit(admin, "update", { entity: ENTITY, entityId: id, fields });
  if (newPassword !== undefined) await audit(admin, "password_change", { entity: ENTITY, entityId: id });
  return NextResponse.json(toPublic(updated));
});

export const DELETE = withHandler(async (req) => {
  const admin = await requireAdmin();
  const id = requireId(await readJson(req));
  if (id === admin.userId) throw badRequest("You cannot delete your own account");
  if (!(await deleteAdminUser(id))) throw notFound();
  await revokeAdminSessionsForUser(id);
  await audit(admin, "delete", { entity: ENTITY, entityId: id });
  return NextResponse.json({ success: true });
});
