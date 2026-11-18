import { Fragment, useMemo, useState } from "react";

import type { Enquiry } from "@/lib/types";

import { ENQUIRY_STATUSES, isOneOf } from "../_lib/api";
import {
  EMPTY_ENQUIRY_FILTERS, ENQUIRY_KINDS, ENQUIRY_KIND_LABELS, csvFilename, enquiriesCsv, enquiryKind, filterEnquiries,
  hasFilters, istDateTime, paginate, type EnquiryFilters,
} from "../_lib/table";
import { Icon } from "./icons";
import { Empty, Pager, ReceivedRange, TabHeader, downloadCsv } from "./shared";

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
      <TabHeader title="Enquiries" description="Contact form messages, trip plans and callback requests">
        {/* Exports every filtered row, not just the current page. */}
        <button className="adm-btn primary" disabled={filtered.length === 0}
          onClick={() => downloadCsv(csvFilename("enquiries", new Date()), enquiriesCsv(filtered))}>
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
            {slice.rows.map(e => {
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
      {enquiries.length === 0
        ? <Empty>No enquiries yet.</Empty>
        : filtered.length === 0
          ? <Empty>No enquiries match these filters.</Empty>
          : <Pager slice={slice} onPage={setPage} />}
    </div>
  );
}
