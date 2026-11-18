import { Fragment, useState } from "react";

import type { Enquiry } from "@/lib/types";
import { EMPTY_ENQUIRY_FILTERS, ENQUIRY_KINDS, enquiryKind, hasFilters, type EnquiryFilters } from "@/lib/inbox-filters";
import { ENQUIRY_KIND_LABELS, istDateTime } from "@/lib/inbox-csv";

import { ENQUIRY_STATUSES, deleteById, isOneOf, sendEntity } from "../_lib/api";
import { fetchExport, useInboxPage } from "../_lib/inbox";
import { pageSlice } from "../_lib/table";
import { Icon } from "./icons";
import { Empty, Pager, ReceivedRange, TabHeader, downloadBlob } from "./shared";

const API = "/api/enquiries";
const COLUMNS = 9;

// Rows are filtered, sorted and paginated by the server (review point #6).
// `onChanged` tells the page a status edit or delete happened (Dashboard / sidebar counts).
export default function EnquiriesTab({ onChanged }: { onChanged: () => void }) {
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

  const { data, applied, reload, setData } = useInboxPage<Enquiry, EnquiryFilters>(API, "enquiries", filters, page);
  const rows = data?.items ?? [];
  const slice = data ? pageSlice(data, rows.length) : null;

  const onUpdateStatus = async (id: string, status: Enquiry["status"]) => {
    const updated = await sendEntity<Enquiry>(API, "PATCH", { id, status }, "enquiry");
    if (!updated) return;
    setData(d => d && { ...d, items: d.items.map(e => (e.id === id ? updated : e)) });
    reload(); onChanged();
  };
  const onRemove = async (id: string) => {
    if (!confirm("Delete this enquiry?")) return;
    if (!(await deleteById(API, id, "enquiry"))) return;
    reload(); onChanged();
  };
  const onExport = async () => {
    const file = await fetchExport(API, applied, "enquiries");
    if (file) downloadBlob(file.filename, file.blob);
  };

  return (
    <div>
      <TabHeader title="Enquiries" description="Contact form messages, trip plans and callback requests">
        {/* Exports every filtered row (server-side, up to 10,000), not just the current page. */}
        <button className="adm-btn primary" disabled={!data || data.total === 0} onClick={onExport}>
          <Icon name="download" size={16} />Export CSV
        </button>
      </TabHeader>

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

      <div className="adm-table-wrap">
        <table className="adm-table stack">
          <thead><tr><th>Received</th><th>Type</th><th>Name</th><th>Contact</th><th>Travelers</th><th>Travel date</th><th>Message</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {rows.map(e => {
              const kind = enquiryKind(e);
              const isOpen = open.has(e.id);
              return (
                <Fragment key={e.id}>
                  <tr>
                    <td data-label="Received" className="tnum" style={{ whiteSpace: "nowrap", color: "var(--a-muted)" }} title="Received (IST)">{istDateTime(e.createdAt).split(" ")[0]}<span className="adm-sub">{istDateTime(e.createdAt).split(" ")[1]}</span></td>
                    <td data-label="Type"><span className={`badge badge-kind-${kind}`}>{ENQUIRY_KIND_LABELS[kind]}</span></td>
                    <td data-label="Name"><strong>{e.name}</strong></td>
                    <td data-label="Contact">{e.phone}<span className="adm-sub">{e.email}</span></td>
                    <td data-label="Travelers" className="tnum">{e.travelers}</td>
                    <td data-label="Travel date" className="tnum" style={{ whiteSpace: "nowrap" }}>{e.travelDate || "—"}</td>
                    <td data-label="Message" style={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--a-muted)" }}>{e.message || "—"}</td>
                    <td data-label="Status">
                      <select className="adm-sel" aria-label="Enquiry status" data-value={e.status} value={e.status} onChange={ev => { const v = ev.target.value; if (isOneOf(ENQUIRY_STATUSES, v)) onUpdateStatus(e.id, v); }}>
                        <option value="new">New</option><option value="contacted">Contacted</option><option value="confirmed">Confirmed</option><option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td data-label="">
                      <div style={{ display: "flex", gap: 6 }}>
                        {e.message && (
                          <button className="adm-btn" aria-expanded={isOpen} onClick={() => toggle(e.id)}>{isOpen ? "Hide" : "View"}</button>
                        )}
                        <button className="adm-btn danger" onClick={() => onRemove(e.id)}>Delete</button>
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
      {data && slice && (data.total === 0
        ? <Empty>{hasFilters(applied) ? "No enquiries match these filters." : "No enquiries yet."}</Empty>
        : <Pager slice={slice} onPage={setPage} />)}
    </div>
  );
}
