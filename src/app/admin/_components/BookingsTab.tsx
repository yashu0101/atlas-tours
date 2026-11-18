import { useMemo, useState } from "react";

import type { Booking } from "@/lib/types";
import { bookingReference } from "@/lib/booking-ref";

import { BOOKING_STATUSES, PAYMENT_STATUSES, isOneOf } from "../_lib/api";
import {
  EMPTY_BOOKING_FILTERS, bookingsCsv, csvFilename, filterBookings, hasFilters, istDateTime, paginate, type BookingFilters,
} from "../_lib/table";
import { Empty, Pager, ReceivedRange, TabHeader, downloadCsv } from "./shared";
import { Icon } from "./icons";

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
      <TabHeader title="Bookings" description="Booking requests from package pages. Set the status after you call the guest.">
        {/* Exports every filtered row, not just the current page. */}
        <button className="adm-btn primary" disabled={filtered.length === 0}
          onClick={() => downloadCsv(csvFilename("bookings", new Date()), bookingsCsv(filtered))}>
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
            <option value="">All</option><option value="pending">Pending</option><option value="paid">Paid</option><option value="failed">Failed</option><option value="refunded">Refunded</option>
          </select>
        </label>
        <ReceivedRange from={filters.from} to={filters.to} onChange={update} />
        {hasFilters(filters) && <button className="adm-btn" onClick={() => update(EMPTY_BOOKING_FILTERS)}>Clear</button>}
      </div>

      <div className="adm-table-wrap">
        <table className="adm-table stack">
          <thead><tr><th>Reference</th><th>Guest</th><th>Contact</th><th>Package</th><th>Travel date</th><th>Travelers</th><th>Amount</th><th>Payment</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {slice.rows.map(b => (
              <tr key={b.id}>
                <td data-label="Reference"><code className="adm-ref">{bookingReference(b.id)}</code><span className="adm-sub tnum" title="Received (IST)">{istDateTime(b.createdAt)}</span></td>
                <td data-label="Guest"><strong>{b.name}</strong><span className="adm-sub">{b.city}</span></td>
                <td data-label="Contact">{b.phone}<span className="adm-sub">{b.email}</span></td>
                <td data-label="Package">{b.packageName}</td>
                <td data-label="Travel date" className="tnum" style={{ whiteSpace: "nowrap" }}>{b.travelDate}</td>
                <td data-label="Travelers" className="tnum">{b.travelers}</td>
                <td data-label="Amount" className="tnum" style={{ whiteSpace: "nowrap" }}>{"₹"}{b.amount?.toLocaleString("en-IN")}</td>
                <td data-label="Payment">
                  <select className="adm-sel" aria-label="Payment status" data-value={b.paymentStatus} value={b.paymentStatus} onChange={e => { const v = e.target.value; if (isOneOf(PAYMENT_STATUSES, v)) onUpdate(b.id, { paymentStatus: v }); }}>
                    <option value="pending">Pending</option><option value="paid">Paid</option><option value="failed">Failed</option><option value="refunded">Refunded</option>
                  </select>
                </td>
                <td data-label="Status">
                  <select className="adm-sel" aria-label="Booking status" data-value={b.bookingStatus} value={b.bookingStatus} onChange={e => { const v = e.target.value; if (isOneOf(BOOKING_STATUSES, v)) onUpdate(b.id, { bookingStatus: v }); }}>
                    <option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option>
                  </select>
                </td>
                <td data-label=""><button className="adm-btn danger" onClick={() => onRemove(b.id)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {bookings.length === 0
        ? <Empty>No bookings yet.</Empty>
        : filtered.length === 0
          ? <Empty>No bookings match these filters.</Empty>
          : <Pager slice={slice} onPage={setPage} />}
    </div>
  );
}
