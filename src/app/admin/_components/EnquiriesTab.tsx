import { Fragment, useMemo, useState } from "react";

import type { Enquiry } from "@/lib/types";

import { ENQUIRY_STATUSES, isOneOf } from "../_lib/api";
import {
  EMPTY_ENQUIRY_FILTERS, ENQUIRY_KINDS, ENQUIRY_KIND_LABELS, csvFilename, enquiriesCsv, enquiryKind, filterEnquiries,
  hasFilters, istDateTime, paginate, type EnquiryFilters,
} from "../_lib/table";
import { Pager, ReceivedRange, downloadCsv } from "./shared";

const COLUMNS = 9;

export default function EnquiriesTab({ enquiries, onUpdateStatus, onRemove }: {
  enquiries: Enquiry[];
  onUpdateStatus: (id: string, status: Enquiry["status"]) => void;
  onRemove: (id: string) => void;
}) {
  const [filters, setFilters] = useState<EnquiryFilters>(EMPTY_ENQUIRY_FILTERS);
  const [page, setPage] = useState(1);
  // Ids whose full message row is open (trip-plan / callback messages are multi-line).
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set());
  // Any filter change goes back to page 1.
  const update = (patch: Partial<EnquiryFilters>) => { setFilters(f => ({ ...f, ...patch })); setPage(1); };
  const toggle = (id: string) => setOpen(prev => {
    const next = new Set(prev);
    if (!next.delete(id)) next.add(id);
    return next;
  });

  const filtered = useMemo(() => filterEnquiries(enquiries, filters), [enquiries, filters]);
  const slice = paginate(filtered, page);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontWeight: 600, color: "#E67E22" }}>Enquiries</h2>
        {/* Exports every filtered row, not just the current page. */}
        <button className="adm-btn primary" disabled={filtered.length === 0}
          onClick={() => downloadCsv(csvFilename("enquiries", new Date()), enquiriesCsv(filtered))}>
          Export CSV
        </button>
      </div>

      <div className="adm-filters">
        <label className="adm-field adm-search">Search
          <input type="search" className="adm-input" value={filters.search} aria-label="Search enquiries"
            placeholder="Name, phone, email or message" onChange={e => update({ search: e.target.value })} />
        </label>
        <label className="adm-field">Status
          <select className="adm-input" value={filters.status}
            onChange={e => { const v = e.target.value; update({ status: isOneOf(ENQUIRY_STATUSES, v) ? v : "" }); }}>
            <option value="">All</option><option value="new">New</option><option value="contacted">Contacted</option><option value="confirmed">Confirmed</option><option value="cancelled">Cancelled</option>
          </select>
        </label>
        <label className="adm-field">Type
          <select className="adm-input" value={filters.kind}
            onChange={e => { const v = e.target.value; update({ kind: isOneOf(ENQUIRY_KINDS, v) ? v : "" }); }}>
            <option value="">All</option>
            {ENQUIRY_KINDS.map(k => <option key={k} value={k}>{ENQUIRY_KIND_LABELS[k]}</option>)}
          </select>
        </label>
        <ReceivedRange from={filters.from} to={filters.to} onChange={update} />
        {hasFilters(filters) && <button className="adm-btn" onClick={() => update(EMPTY_ENQUIRY_FILTERS)}>Clear</button>}
      </div>

      <div style={{ overflowX: "auto" }}>
        <table className="adm-table">
          <thead><tr><th>Received</th><th>Type</th><th>Name</th><th>Contact</th><th>Travelers</th><th>Travel Date</th><th>Message</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {slice.rows.map(e => {
              const kind = enquiryKind(e);
              const isOpen = open.has(e.id);
              return (
                <Fragment key={e.id}>
                  <tr>
                    <td style={{ whiteSpace: "nowrap", fontSize: ".8rem", color: "#8a8070" }} title="Received (IST)">{istDateTime(e.createdAt)}</td>
                    <td><span className={`badge badge-kind-${kind}`}>{ENQUIRY_KIND_LABELS[kind]}</span></td>
                    <td><strong>{e.name}</strong></td>
                    <td>{e.phone}<br /><span style={{ fontSize: ".75rem", color: "#8a8070" }}>{e.email}</span></td>
                    <td>{e.travelers}</td>
                    <td>{e.travelDate}</td>
                    <td style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.message || "--"}</td>
                    <td>
                      <select className="adm-sel" aria-label="Enquiry status" value={e.status} onChange={ev => { const v = ev.target.value; if (isOneOf(ENQUIRY_STATUSES, v)) onUpdateStatus(e.id, v); }}>
                        <option value="new">New</option><option value="contacted">Contacted</option><option value="confirmed">Confirmed</option><option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        {e.message && (
                          <button className="adm-btn" aria-expanded={isOpen} onClick={() => toggle(e.id)}>{isOpen ? "Hide" : "View"}</button>
                        )}
                        <button className="adm-btn danger" onClick={() => onRemove(e.id)}>Del</button>
                      </div>
                    </td>
                  </tr>
                  {isOpen && e.message && (
                    <tr className="adm-detail-row">
                      <td colSpan={COLUMNS}><div className="adm-message">{e.message}</div></td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      {enquiries.length === 0
        ? <p style={{ textAlign: "center", color: "#8a8070", marginTop: 40 }}>No enquiries yet.</p>
        : filtered.length === 0
          ? <p style={{ textAlign: "center", color: "#8a8070", marginTop: 40 }}>No enquiries match these filters.</p>
          : <Pager slice={slice} onPage={setPage} />}
    </div>
  );
}
