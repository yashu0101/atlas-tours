import { useEffect, useState } from "react";

import type { PublicAdminUser } from "@/lib/types";

import { deleteById, loadList, reportFailure, sendEntity } from "../_lib/api";
import { formatIst } from "./AuditTab";
import { PasswordForm, UserForm, type NewUser } from "./forms/UserForm";
import { Empty, Modal, TabHeader } from "./shared";

const USERS_URL = "/api/admin-users";

/**
 * N-8: admin users (all with equal permissions). Loads its own list on mount. The built-in
 * admin from the server settings (ADMIN_EMAIL) is not a database user and is not listed.
 * You cannot deactivate or delete yourself (the API enforces it too).
 */
export default function UsersTab({ currentUserId }: { currentUserId: string }) {
  const [users, setUsers] = useState<PublicAdminUser[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [resetting, setResetting] = useState<PublicAdminUser | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadList(USERS_URL, "users").then(async r => {
      if (cancelled) return;
      if (r.status === 401) { await reportFailure("Load users", new Response(null, { status: 401 })); return; }
      if (r.status !== 200 || !Array.isArray(r.data)) {
        alert(`Failed to load users (${r.status || "network error"}${typeof r.data === "string" ? `: ${r.data}` : ""})`);
        setUsers([]);
        return;
      }
      setUsers(r.data as PublicAdminUser[]);
    });
    return () => { cancelled = true; };
  }, []);

  const replace = (u: PublicAdminUser) => setUsers(prev => (prev ?? []).map(x => (x.id === u.id ? u : x)));

  const create = async (data: NewUser) => {
    const created = await sendEntity<PublicAdminUser>(USERS_URL, "POST", data, "user");
    if (!created) return;
    setUsers(prev => [...(prev ?? []), created]);
    setCreating(false);
  };
  const setActive = async (u: PublicAdminUser, active: boolean) => {
    if (!active && !confirm(`Deactivate ${u.email}? They will be signed out and cannot log in until reactivated.`)) return;
    const updated = await sendEntity<PublicAdminUser>(USERS_URL, "PATCH", { id: u.id, active }, "user");
    if (updated) replace(updated);
  };
  const resetPassword = async (u: PublicAdminUser, password: string) => {
    const updated = await sendEntity<PublicAdminUser>(USERS_URL, "PATCH", { id: u.id, password }, "user password");
    if (!updated) return;
    replace(updated);
    setResetting(null);
    alert(u.id === currentUserId ? "Your password was changed." : `Password reset for ${u.email}.`);
  };
  const remove = async (u: PublicAdminUser) => {
    if (!confirm(`Delete the admin user ${u.email}? This cannot be undone.`)) return;
    if (await deleteById(USERS_URL, u.id, "user")) setUsers(prev => (prev ?? []).filter(x => x.id !== u.id));
  };

  return (
    <>
      <TabHeader title="Users" description="People who can log in to this admin. Every admin has the same permissions."
        addLabel="Add user" onAdd={() => setCreating(true)} />
      {creating && (
        <Modal onClose={() => setCreating(false)}>
          <UserForm onSave={create} onCancel={() => setCreating(false)} />
        </Modal>
      )}
      {resetting && (
        <Modal onClose={() => setResetting(null)}>
          <PasswordForm user={resetting} self={resetting.id === currentUserId}
            onSave={pw => resetPassword(resetting, pw)} onCancel={() => setResetting(null)} />
        </Modal>
      )}
      {currentUserId === "env" && (
        <p className="adm-row-text" style={{ marginBottom: 16 }}>
          You are signed in with the built-in admin account from the server settings. It is not listed here and always keeps access.
        </p>
      )}
      {users === null ? (
        <div className="adm-loading" role="status"><div className="adm-spinner" />Loading users…</div>
      ) : (
        <div className="adm-list">
          {users.map(u => {
            const self = u.id === currentUserId;
            return (
              <div key={u.id} className="adm-card adm-row">
                <div className="adm-row-main">
                  <h3 className="adm-row-title">
                    {u.name}
                    {self && <span className="badge badge-new">You</span>}
                    <span className={`badge ${u.active ? "badge-active" : "badge-inactive"}`}>{u.active ? "Active" : "Inactive"}</span>
                  </h3>
                  <p className="adm-row-text">{u.email}</p>
                  <div className="adm-row-meta">
                    <span>Added {formatIst(u.createdAt)}</span>
                    <span>{u.lastLoginAt ? `Last login ${formatIst(u.lastLoginAt)}` : "Never logged in"}</span>
                  </div>
                </div>
                <div className="adm-row-actions">
                  <button className="adm-btn" onClick={() => setResetting(u)}>{self ? "Change password" : "Reset password"}</button>
                  {!self && <button className="adm-btn" onClick={() => setActive(u, !u.active)}>{u.active ? "Deactivate" : "Activate"}</button>}
                  {!self && <button className="adm-btn danger" onClick={() => remove(u)}>Delete</button>}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {users?.length === 0 && !creating && <Empty>No admin users yet. The built-in admin account can add the first one.</Empty>}
    </>
  );
}
