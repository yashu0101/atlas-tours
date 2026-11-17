import { useMemo, useState } from "react";

import type { Booking } from "@/lib/types";
import { bookingReference } from "@/lib/booking-ref";

import { BOOKING_STATUSES, PAYMENT_STATUSES, isOneOf } from "../_lib/api";
import {
  EMPTY_BOOKING_FILTERS, bookingsCsv, csvFilename, filterBookings, hasFilters, istDateTime, paginate, type BookingFilters,
} from "../_lib/table";
import { Pager, ReceivedRange, downloadCsv } from "./shared";

export default function BookingsTab({ bookings, onUpdate, onRemove }: {
  bookings: Booking[];
  onUpdate: (id: string, updates: Partial<Pick<Booking, "paymentStatus" | "bookingStatus">>) => void;
  onRemove: (id: string) => void;
}) {
  const [filters, setFilters] = useState<BookingFilters>(EMPTY_BOOKING_FILTERS);
  const [page, setPage] = useState(1);
  // Any filter change goes back to page 1.
  const update = (patch: Partial<BookingFilters>) => { setFilters(f => ({ ...f, ...patch })); setPage(1); };

  const filtered = useMemo(() => filterBookings(bookings, filters), [bookings, filters]);
  const slice = paginate(filtered, page);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontWeight: 600, color: "#E67E22" }}>Bookings</h2>
        {/* Exports every filtered row, not just the current page. */}
        <button className="adm-btn primary" disabled={filtered.length === 0}
          onClick={() => downloadCsv(csvFilename("bookings", new Date()), bookingsCsv(filtered))}>
          Export CSV
        </button>
      </div>

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
            <option value="">All</option><option value="pending">Pending</option><option value="paid">Paid</option><option value="failed">Failed</option><option value="refunded">Refunded</option>
          </select>
        </label>
        <ReceivedRange from={filters.from} to={filters.to} onChange={update} />
        {hasFilters(filters) && <button className="adm-btn" onClick={() => update(EMPTY_BOOKING_FILTERS)}>Clear</button>}
      </div>

      <div style={{ overflowX: "auto" }}>
        <table className="adm-table">
          <thead><tr><th>Reference</th><th>Guest</th><th>Contact</th><th>Package</th><th>Travel Date</th><th>Travelers</th><th>Amount</th><th>Payment</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {slice.rows.map(b => (
              <tr key={b.id}>
                <td><code className="adm-ref">{bookingReference(b.id)}</code><br /><span style={{ fontSize: ".75rem", color: "#8a8070" }} title="Received (IST)">{istDateTime(b.createdAt)}</span></td>
                <td><strong>{b.name}</strong><br /><span style={{ fontSize: ".75rem", color: "#8a8070" }}>{b.city}</span></td>
                <td>{b.phone}<br /><span style={{ fontSize: ".75rem", color: "#8a8070" }}>{b.email}</span></td>
                <td>{b.packageName}</td>
                <td>{b.travelDate}</td>
                <td>{b.travelers}</td>
                <td>{"₹"}{b.amount?.toLocaleString()}</td>
                <td>
                  <select className="adm-sel" aria-label="Payment status" value={b.paymentStatus} onChange={e => { const v = e.target.value; if (isOneOf(PAYMENT_STATUSES, v)) onUpdate(b.id, { paymentStatus: v }); }}>
                    <option value="pending">Pending</option><option value="paid">Paid</option><option value="failed">Failed</option><option value="refunded">Refunded</option>
                  </select>
                </td>
                <td>
                  <select className="adm-sel" aria-label="Booking status" value={b.bookingStatus} onChange={e => { const v = e.target.value; if (isOneOf(BOOKING_STATUSES, v)) onUpdate(b.id, { bookingStatus: v }); }}>
                    <option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option>
                  </select>
                </td>
                <td><button className="adm-btn danger" onClick={() => onRemove(b.id)}>Del</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {bookings.length === 0
        ? <p style={{ textAlign: "center", color: "#8a8070", marginTop: 40 }}>No bookings yet.</p>
        : filtered.length === 0
          ? <p style={{ textAlign: "center", color: "#8a8070", marginTop: 40 }}>No bookings match these filters.</p>
          : <Pager slice={slice} onPage={setPage} />}
    </div>
  );
}
