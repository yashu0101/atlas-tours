import { useState } from "react";

import type { Booking } from "@/lib/types";
import { bookingReference } from "@/lib/booking-ref";
import { EMPTY_BOOKING_FILTERS, hasFilters, type BookingFilters } from "@/lib/inbox-filters";
import { istDateTime } from "@/lib/inbox-csv";

import { BOOKING_STATUSES, PAYMENT_STATUSES, deleteById, isOneOf, sendEntity } from "../_lib/api";
import { fetchExport, useInboxPage } from "../_lib/inbox";
import { pageSlice } from "../_lib/table";
import { Empty, Pager, ReceivedRange, TabHeader, downloadBlob } from "./shared";
import { Icon } from "./icons";

const API = "/api/bookings";

// Rows are filtered, sorted and paginated by the server (review point #6).
// `onChanged` tells the page a status edit or delete happened (Dashboard / sidebar counts).
export default function BookingsTab({ onChanged }: { onChanged: () => void }) {
  const [filters, setFilters] = useState<BookingFilters>(EMPTY_BOOKING_FILTERS);
  const [page, setPage] = useState(1);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  // Any filter change goes back to page 1.
  const update = (patch: Partial<BookingFilters>) => { setFilters(f => ({ ...f, ...patch })); setPage(1); };

  const { data, applied, reload, setData } = useInboxPage<Booking, BookingFilters>(API, "bookings", filters, page);
  const rows = data?.items ?? [];
  const slice = data ? pageSlice(data, rows.length) : null;

  const onUpdate = async (id: string, updates: Partial<Pick<Booking, "paymentStatus" | "bookingStatus" | "amount">>) => {
    const updated = await sendEntity<Booking>(API, "PATCH", { id, ...updates }, "booking");
    if (!updated) return;
    setData(d => d && { ...d, items: d.items.map(b => (b.id === id ? updated : b)) });
    reload(); onChanged();
  };
  const onEditAmount = async (b: Booking) => {
    const input = window.prompt("New amount (₹)", String(b.amount));
    if (input === null) return;
    const text = input.trim();
    const amount = Number(text);
    if (!/^\d+$/.test(text) || !Number.isSafeInteger(amount) || amount < 1) {
      alert("Enter a whole number of rupees, 1 or more.");
      return;
    }
    await onUpdate(b.id, { amount });
  };
  const onCopyLink = async (b: Booking) => {
    const link = `${location.origin}/track?ref=${bookingReference(b.id)}`;
    try { await navigator.clipboard.writeText(link); } catch { window.prompt("Copy this link", link); return; }
    setCopiedId(b.id);
    setTimeout(() => setCopiedId(c => (c === b.id ? null : c)), 2000);
  };
  const onRemove = async (id: string) => {
    if (!confirm("Delete this booking?")) return;
    if (!(await deleteById(API, id, "booking"))) return;
    reload(); onChanged();
  };
  const onExport = async () => {
    const file = await fetchExport(API, applied, "bookings");
    if (file) downloadBlob(file.filename, file.blob);
  };

  return (
    <div>
      <TabHeader title="Bookings" description="Booking requests from package pages. Set the status after you call the guest.">
        {/* Exports every filtered row (server-side, up to 10,000), not just the current page. */}
        <button className="adm-btn primary" disabled={!data || data.total === 0} onClick={onExport}>
          <Icon name="download" size={16} />Export CSV
        </button>
      </TabHeader>

      <div className="adm-filters">
        <label className="adm-field adm-search">Search
          <input type="search" className="adm-input" value={filters.search} aria-label="Search bookings"
            placeholder="Name, phone, email, city, package or reference" onChange={e => update({ search: e.target.value })} />
        </label>
        <label className="adm-field">Booking status
          <select className="adm-input" value={filters.bookingStatus}
            onChange={e => { const v = e.target.value; update({ bookingStatus: isOneOf(BOOKING_STATUSES, v) ? v : "" }); }}>
            <option value="">All</option><option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option>
          </select>
        </label>
        <label className="adm-field">Payment
          <select className="adm-input" value={filters.paymentStatus}
            onChange={e => { const v = e.target.value; update({ paymentStatus: isOneOf(PAYMENT_STATUSES, v) ? v : "" }); }}>
            <option value="">All</option><option value="pending">Pending</option><option value="verifying">Verifying</option><option value="paid">Paid</option><option value="failed">Failed</option><option value="refunded">Refunded</option>
          </select>
        </label>
        <ReceivedRange from={filters.from} to={filters.to} onChange={update} />
        {hasFilters(filters) && <button className="adm-btn" onClick={() => update(EMPTY_BOOKING_FILTERS)}>Clear</button>}
      </div>

      <div className="adm-table-wrap">
        <table className="adm-table stack">
          <thead><tr><th>Reference</th><th>Guest</th><th>Contact</th><th>Package</th><th>Travel date</th><th>Travelers</th><th>Amount</th><th>Payment</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {rows.map(b => (
              <tr key={b.id}>
                <td data-label="Reference"><code className="adm-ref">{bookingReference(b.id)}</code><span className="adm-sub tnum" title="Received (IST)">{istDateTime(b.createdAt)}</span></td>
                <td data-label="Guest"><strong>{b.name}</strong><span className="adm-sub">{b.city}</span></td>
                <td data-label="Contact">{b.phone}<span className="adm-sub">{b.email}</span></td>
                <td data-label="Package">{b.packageName}</td>
                <td data-label="Travel date" className="tnum" style={{ whiteSpace: "nowrap" }}>{b.travelDate}</td>
                <td data-label="Travelers" className="tnum">{b.travelers}</td>
                <td data-label="Amount" className="tnum" style={{ whiteSpace: "nowrap" }}>{"₹"}{b.amount?.toLocaleString("en-IN")}
                  <button className="adm-btn" style={{ marginTop: 4 }} disabled={b.paymentStatus === "paid" || b.paymentStatus === "verifying"} onClick={() => onEditAmount(b)}>Edit</button></td>
                <td data-label="Payment">
                  <select className="adm-sel" aria-label="Payment status" data-value={b.paymentStatus} value={b.paymentStatus} onChange={e => { const v = e.target.value; if (isOneOf(PAYMENT_STATUSES, v)) onUpdate(b.id, { paymentStatus: v }); }}>
                    <option value="pending">Pending</option><option value="verifying">Verifying</option><option value="paid">Paid</option><option value="failed">Failed</option><option value="refunded">Refunded</option>
                  </select>
                  {b.utr && <span className="adm-sub tnum">UTR {b.utr}</span>}
                  {b.paymentSubmittedAt && <span className="adm-sub tnum">{istDateTime(b.paymentSubmittedAt)}</span>}
                </td>
                <td data-label="Status">
                  <select className="adm-sel" aria-label="Booking status" data-value={b.bookingStatus} value={b.bookingStatus} onChange={e => { const v = e.target.value; if (isOneOf(BOOKING_STATUSES, v)) onUpdate(b.id, { bookingStatus: v }); }}>
                    <option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option>
                  </select>
                </td>
                <td data-label="">
                  <button className="adm-btn" disabled={b.bookingStatus !== "confirmed" || (b.paymentStatus !== "pending" && b.paymentStatus !== "failed")} onClick={() => onCopyLink(b)}>{copiedId === b.id ? "Copied!" : "Copy pay link"}</button>{" "}
                  <button className="adm-btn danger" onClick={() => onRemove(b.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data && slice && (data.total === 0
        ? <Empty>{hasFilters(applied) ? "No bookings match these filters." : "No bookings yet."}</Empty>
        : <Pager slice={slice} onPage={setPage} />)}
    </div>
  );
}
