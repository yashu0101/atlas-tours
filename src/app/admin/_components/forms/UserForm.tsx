import { useState } from "react";

import type { PublicAdminUser } from "@/lib/types";

/** Same minimum as the API (src/app/api/admin-users/route.ts). */
export const MIN_PASSWORD = 12;

export type NewUser = { email: string; name: string; password: string; active: boolean };

// N-8: "Add user" form. Native validation blocks Save until the fields are valid.
export function UserForm({ onSave, onCancel }: { onSave: (u: NewUser) => void; onCancel: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [active, setActive] = useState(true);
  return (
    <form onSubmit={e => { e.preventDefault(); onSave({ name: name.trim(), email: email.trim(), password, active }); }}>
      <h3 className="modal-title">New admin user</h3>
      <div className="adm-form">
        <label className="adm-fl"><span>Name *</span><input required maxLength={100} value={name} onChange={e => setName(e.target.value)} autoComplete="off" /></label>
        <label className="adm-fl"><span>Email *</span><input required type="email" maxLength={254} value={email} onChange={e => setEmail(e.target.value)} autoComplete="off" /></label>
        <label className="adm-fl full"><span>Password * (at least {MIN_PASSWORD} characters)</span>
          <input required type="password" minLength={MIN_PASSWORD} maxLength={72} value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" />
        </label>
        <div className="adm-check-cell">
          <label className="adm-check"><input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} /> Active (can log in)</label>
        </div>
      </div>
      <div className="adm-actions">
        <button type="submit" className="adm-btn primary">Save</button>
        <button type="button" className="adm-btn" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

// N-8: "Reset password" form for one user.
export function PasswordForm({ user, self, onSave, onCancel }: {
  user: PublicAdminUser; self: boolean; onSave: (password: string) => void; onCancel: () => void;
}) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const mismatch = confirm !== "" && confirm !== password;
  return (
    <form onSubmit={e => { e.preventDefault(); if (!mismatch) onSave(password); }}>
      <h3 className="modal-title">{self ? "Change your password" : `Reset password for ${user.name}`}</h3>
      <p className="adm-row-text" style={{ marginBottom: 12 }}>
        {self ? "Your other devices will be signed out; this one stays signed in." : "This user will be signed out everywhere."}
      </p>
      <div className="adm-form">
        <label className="adm-fl"><span>New password * (at least {MIN_PASSWORD} characters)</span>
          <input required type="password" minLength={MIN_PASSWORD} maxLength={72} value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" />
        </label>
        <label className="adm-fl"><span>Repeat new password *</span>
          <input required type="password" value={confirm} onChange={e => setConfirm(e.target.value)} autoComplete="new-password"
            aria-invalid={mismatch} aria-describedby={mismatch ? "pw-mismatch" : undefined} />
        </label>
        {mismatch && <p id="pw-mismatch" className="adm-row-text full" role="alert" style={{ color: "var(--a-bad)" }}>The passwords do not match.</p>}
      </div>
      <div className="adm-actions">
        <button type="submit" className="adm-btn primary" disabled={mismatch}>Save password</button>
        <button type="button" className="adm-btn" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
