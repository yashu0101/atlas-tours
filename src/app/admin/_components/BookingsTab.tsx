import type { Booking } from "@/lib/types";

import { BOOKING_STATUSES, PAYMENT_STATUSES, isOneOf } from "../_lib/api";

export default function BookingsTab({ bookings, onUpdate, onRemove }: {
  bookings: Booking[];
  onUpdate: (id: string, updates: Partial<Pick<Booking, "paymentStatus" | "bookingStatus">>) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div style={{ overflowX: "auto" }}>
      <h2 style={{ margin: "0 0 20px", fontWeight: 600, color: "#E67E22" }}>Bookings</h2>
      <table className="adm-table">
        <thead><tr><th>Guest</th><th>Contact</th><th>Package</th><th>Travel Date</th><th>Travelers</th><th>Amount</th><th>Payment</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          {bookings.map(b => (
            <tr key={b.id}>
              <td><strong>{b.name}</strong><br /><span style={{ fontSize: ".75rem", color: "#8a8070" }}>{b.city}</span></td>
              <td>{b.phone}<br /><span style={{ fontSize: ".75rem", color: "#8a8070" }}>{b.email}</span></td>
              <td>{b.packageName}</td>
              <td>{b.travelDate}</td>
              <td>{b.travelers}</td>
              <td>{"₹"}{b.amount?.toLocaleString()}</td>
              <td>
                <select className="adm-sel" value={b.paymentStatus} onChange={e => { const v = e.target.value; if (isOneOf(PAYMENT_STATUSES, v)) onUpdate(b.id, { paymentStatus: v }); }}>
                  <option value="pending">Pending</option><option value="paid">Paid</option><option value="failed">Failed</option><option value="refunded">Refunded</option>
                </select>
              </td>
              <td>
                <select className="adm-sel" value={b.bookingStatus} onChange={e => { const v = e.target.value; if (isOneOf(BOOKING_STATUSES, v)) onUpdate(b.id, { bookingStatus: v }); }}>
                  <option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option>
                </select>
              </td>
              <td><button className="adm-btn danger" onClick={() => onRemove(b.id)}>Del</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      {bookings.length === 0 && <p style={{ textAlign: "center", color: "#8a8070", marginTop: 40 }}>No bookings yet.</p>}
    </div>
  );
}
