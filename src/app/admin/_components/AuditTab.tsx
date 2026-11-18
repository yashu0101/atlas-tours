import { useEffect, useState } from "react";

import type { AuditAction, AuditEntry } from "@/lib/types";

import { loadList, reportFailure } from "../_lib/api";
import { Empty, TabHeader } from "./shared";

const LIMIT = 200;

const ACTION_LABELS: Record<AuditAction, string> = {
  create: "Created", update: "Updated", delete: "Deleted", login: "Logged in", logout: "Logged out",
  login_failed: "Failed login", signout_all: "Signed out all devices", password_change: "Changed password",
};
const ACTION_BADGE: Partial<Record<AuditAction, string>> = {
  create: "badge-active", delete: "badge-cancelled", login_failed: "badge-failed", update: "badge-new", password_change: "badge-pending",
};
const ENTITY_LABELS: Record<string, string> = {
  packages: "Package", reviews: "Review", gallery: "Gallery image", blogs: "Blog post", faqs: "FAQ", offers: "Offer",
  bookings: "Booking", enquiries: "Enquiry", admin_users: "Admin user", sessions: "Sessions",
};

/** "YYYY-MM-DD HH:MM IST" (fixed IST offset, deterministic). "" if unparseable. */
export function formatIst(iso: string): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "";
  return new Date(t + 330 * 60 * 1000).toISOString().slice(0, 16).replace("T", " ") + " IST";
}

/** Latest entries; null after a 401 (the user is sent to the login page). Never throws. */
async function fetchAudit(): Promise<AuditEntry[] | null> {
  const r = await loadList(`/api/audit?limit=${LIMIT}`, "audit log");
  if (r.status === 401) { await reportFailure("Load audit log", new Response(null, { status: 401 })); return null; }
  if (r.status !== 200 || !Array.isArray(r.data)) {
    alert(`Failed to load the audit log (${r.status || "network error"}${typeof r.data === "string" ? `: ${r.data}` : ""})`);
    return [];
  }
  return r.data as AuditEntry[];
}

/** N-8: read-only audit log, newest first (latest LIMIT entries). Loads on mount; "Refresh" reloads. */
export default function AuditTab() {
  const [entries, setEntries] = useState<AuditEntry[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchAudit().then(list => { if (!cancelled && list) setEntries(list); });
    return () => { cancelled = true; };
  }, []);
  const refresh = () => { setEntries(null); fetchAudit().then(list => { if (list) setEntries(list); }); };

  return (
    <>
      <TabHeader title="Audit log" description={`Who changed what, newest first (latest ${LIMIT}). Only field names are recorded, never values or passwords.`}>
        <button className="adm-btn" onClick={refresh}>Refresh</button>
      </TabHeader>
      {entries === null ? (
        <div className="adm-loading" role="status"><div className="adm-spinner" />Loading audit log…</div>
      ) : entries.length === 0 ? (
        <Empty>Nothing recorded yet.</Empty>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table stack">
            <thead><tr><th>When (IST)</th><th>Who</th><th>Action</th><th>Item</th><th>Fields</th></tr></thead>
            <tbody>
              {entries.map(e => (
                <tr key={e.id}>
                  <td data-label="When" className="tnum" style={{ whiteSpace: "nowrap", color: "var(--a-muted)" }}>{formatIst(e.createdAt).replace(" IST", "")}</td>
                  <td data-label="Who">{e.actorEmail}</td>
                  <td data-label="Action"><span className={`badge ${ACTION_BADGE[e.action] ?? ""}`}>{ACTION_LABELS[e.action] ?? e.action}</span></td>
                  <td data-label="Item">
                    {e.entity ? (ENTITY_LABELS[e.entity] ?? e.entity) : "—"}
                    {e.entityId && <span className="adm-sub" title={e.entityId}>{e.entityId.slice(0, 8)}</span>}
                  </td>
                  <td data-label="Fields" style={{ color: "var(--a-muted)" }}>{e.details.length ? e.details.join(", ") : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
