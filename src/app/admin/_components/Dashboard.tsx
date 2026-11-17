import type { TourPackage, Booking, Enquiry, Offer } from "@/lib/types";

// Newest first, without mutating state (Postgres returns newest-first, the JSON store oldest-first).
const newestFirst = <T extends { createdAt: string }>(items: T[]) =>
  [...items].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

export default function Dashboard({ packages, bookings, enquiries, offers }: {
  packages: TourPackage[]; bookings: Booking[]; enquiries: Enquiry[]; offers: Offer[];
}) {
  const totalRevenue = bookings.filter(b => b.paymentStatus === "paid").reduce((s, b) => s + b.amount, 0);
  const activeOffers = offers.filter(o => o.active).length;
  const activePackages = packages.filter(p => !p.hidden).length;

  return (
    <>
      <div className="stat-grid">
        <div className="stat-card"><div className="num">{bookings.length}</div><div className="lbl">Total Bookings</div></div>
        <div className="stat-card"><div className="num">{enquiries.length}</div><div className="lbl">Total Enquiries</div></div>
        <div className="stat-card"><div className="num">{activePackages}</div><div className="lbl">Active Packages</div></div>
        <div className="stat-card"><div className="num">{activeOffers}</div><div className="lbl">Active Offers</div></div>
        <div className="stat-card"><div className="num">{totalRevenue > 0 ? `₹${totalRevenue.toLocaleString()}` : "--"}</div><div className="lbl">Revenue (Paid)</div></div>
      </div>
      <div className="adm-card">
        <h3>Recent Bookings</h3>
        <div style={{ overflowX: "auto" }}>
          <table className="adm-table">
            <thead><tr><th>Guest</th><th>Package</th><th>Travel Date</th><th>Amount</th><th>Status</th></tr></thead>
            <tbody>
              {newestFirst(bookings).slice(0, 5).map(b => (
                <tr key={b.id}>
                  <td>{b.name}</td>
                  <td>{b.packageName}</td>
                  <td>{b.travelDate}</td>
                  <td>{"₹"}{b.amount?.toLocaleString()}</td>
                  <td><span className={`badge badge-${b.bookingStatus}`}>{b.bookingStatus}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {bookings.length === 0 && <p style={{ textAlign: "center", color: "#8a8070", marginTop: 20 }}>No bookings yet.</p>}
      </div>
      <div className="adm-card">
        <h3>Recent Enquiries</h3>
        <div style={{ overflowX: "auto" }}>
          <table className="adm-table">
            <thead><tr><th>Name</th><th>Travelers</th><th>Travel Date</th><th>Status</th></tr></thead>
            <tbody>
              {newestFirst(enquiries).slice(0, 5).map(e => (
                <tr key={e.id}>
                  <td>{e.name}</td>
                  <td>{e.travelers}</td>
                  <td>{e.travelDate}</td>
                  <td><span className={`badge badge-${e.status}`}>{e.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {enquiries.length === 0 && <p style={{ textAlign: "center", color: "#8a8070", marginTop: 20 }}>No enquiries yet.</p>}
      </div>
    </>
  );
}
