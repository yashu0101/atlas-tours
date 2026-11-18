import type { TourPackage, Offer, Review } from "@/lib/types";
import type { InboxSummary } from "@/lib/db";

import { isAwaitingApproval } from "../_lib/table";
import type { Tab } from "../_lib/tabs";
import { Icon } from "./icons";
import { TabHeader } from "./shared";

const inr = (n: number) => `₹${(n || 0).toLocaleString("en-IN")}`;

// Booking/enquiry figures come from GET /api/admin/summary (review point #6): counts, paid
// revenue and the 5 newest of each, computed by the server instead of from the full lists.
const EMPTY_SUMMARY: InboxSummary = {
  bookings: { total: 0, pending: 0, paidRevenue: 0, recent: [] },
  enquiries: { total: 0, new: 0, recent: [] },
};

export default function Dashboard({ packages, summary, offers, reviews, onNavigate }: {
  packages: TourPackage[]; summary: InboxSummary | null; offers: Offer[]; reviews: Review[];
  onNavigate: (tab: Tab) => void;
}) {
  const { bookings, enquiries } = summary ?? EMPTY_SUMMARY;
  const totalRevenue = bookings.paidRevenue;
  const activeOffers = offers.filter(o => o.active).length;
  const activePackages = packages.filter(p => !p.hidden).length;
  const awaitingReviews = reviews.filter(isAwaitingApproval).length;
  const newEnquiries = enquiries.new;
  const pendingBookings = bookings.pending;

  const today = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", weekday: "long", day: "numeric", month: "long" }).format(new Date());

  const attention: { tab: Tab; count: number; label: string; action: string }[] = [
    { tab: "enquiries", count: newEnquiries, label: "New enquiries", action: "Reply to enquiries" },
    { tab: "bookings", count: pendingBookings, label: "Bookings to confirm", action: "Review bookings" },
    { tab: "reviews", count: awaitingReviews, label: "Reviews awaiting approval", action: "Approve reviews" },
  ];

  return (
    <>
      <TabHeader title="Dashboard" description={today} />

      <h3 className="adm-section-title">Needs attention</h3>
      <div className="adm-attn">
        {attention.map(a => (
          <button key={a.tab} type="button" className={`stat-card attn${a.count === 0 ? " is-zero" : ""}`} onClick={() => onNavigate(a.tab)}>
            <span className="num">{a.count}</span>
            <span className="lbl">{a.label}</span>
            <span className="hint">{a.count === 0 ? "All caught up" : <>{a.action} <Icon name="arrow" size={14} /></>}</span>
          </button>
        ))}
      </div>

      <div className="stat-grid">
        <div className="stat-card"><div className="num">{bookings.total}</div><div className="lbl">Total bookings</div></div>
        <div className="stat-card"><div className="num">{enquiries.total}</div><div className="lbl">Total enquiries</div></div>
        <div className="stat-card"><div className="num">{totalRevenue > 0 ? inr(totalRevenue) : "—"}</div><div className="lbl">Revenue (paid)</div></div>
        <div className="stat-card"><div className="num">{activePackages}</div><div className="lbl">Live packages</div></div>
        <div className="stat-card"><div className="num">{activeOffers}</div><div className="lbl">Active offers</div></div>
      </div>

      <div className="adm-split">
        <section className="adm-panel">
          <div className="adm-panel-head">
            <h3>Recent bookings</h3>
            <button type="button" className="adm-btn ghost" onClick={() => onNavigate("bookings")}>View all</button>
          </div>
          {bookings.total === 0 ? <p className="adm-sub" style={{ padding: 24, textAlign: "center" }}>No bookings yet.</p> : (
            <div className="adm-table-wrap">
              <table className="adm-table stack">
                <thead><tr><th>Guest</th><th>Package</th><th>Travel date</th><th>Amount</th><th>Status</th></tr></thead>
                <tbody>
                  {bookings.recent.map(b => (
                    <tr key={b.id}>
                      <td data-label="Guest"><strong>{b.name}</strong></td>
                      <td data-label="Package">{b.packageName}</td>
                      <td data-label="Travel date" className="tnum" style={{ whiteSpace: "nowrap" }}>{b.travelDate}</td>
                      <td data-label="Amount" className="tnum" style={{ whiteSpace: "nowrap" }}>{inr(b.amount)}</td>
                      <td data-label="Status"><span className={`badge badge-${b.bookingStatus}`}>{b.bookingStatus}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        <section className="adm-panel">
          <div className="adm-panel-head">
            <h3>Recent enquiries</h3>
            <button type="button" className="adm-btn ghost" onClick={() => onNavigate("enquiries")}>View all</button>
          </div>
          {enquiries.total === 0 ? <p className="adm-sub" style={{ padding: 24, textAlign: "center" }}>No enquiries yet.</p> : (
            <div className="adm-table-wrap">
              <table className="adm-table stack">
                <thead><tr><th>Name</th><th>Travelers</th><th>Travel date</th><th>Status</th></tr></thead>
                <tbody>
                  {enquiries.recent.map(e => (
                    <tr key={e.id}>
                      <td data-label="Name"><strong>{e.name}</strong><span className="adm-sub">{e.phone}</span></td>
                      <td data-label="Travelers" className="tnum">{e.travelers}</td>
                      <td data-label="Travel date" className="tnum">{e.travelDate || "—"}</td>
                      <td data-label="Status"><span className={`badge badge-${e.status}`}>{e.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
