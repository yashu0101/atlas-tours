"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface TourPackage {
  id: string; name: string; destination: string; duration: string; price: number; originalPrice?: number;
  image: string; description: string; highlights: string[]; itinerary: string[]; inclusions: string[];
  category: "spiritual" | "cultural" | "adventure" | "heritage"; hidden?: boolean; createdAt: string;
}
interface Booking {
  id: string; name: string; phone: string; email: string; city: string; packageId: string; packageName: string;
  travelers: number; travelDate: string; amount: number; paymentStatus: string; bookingStatus: string; createdAt: string;
}
interface Enquiry {
  id: string; name: string; phone: string; email: string; packageId?: string; travelers: number;
  travelDate: string; message: string; status: string; createdAt: string;
}
interface Review {
  id: string; name: string; rating: number; text: string; city: string; packageName?: string;
  active: boolean; createdAt: string;
}
interface GalleryImage {
  id: string; src: string; caption: string; category: string; active: boolean; createdAt: string;
}
interface BlogPost {
  id: string; title: string; excerpt: string; content: string; image: string; category: string;
  author: string; active: boolean; createdAt: string;
}
interface FAQ {
  id: string; question: string; questionHi?: string; answer: string; answerHi?: string;
  active: boolean; order: number; createdAt: string;
}
interface Offer {
  id: string; title: string; description: string; discount: number; code?: string;
  validFrom: string; validTo: string; active: boolean; createdAt: string;
}

type Tab = "dashboard" | "packages" | "bookings" | "enquiries" | "reviews" | "gallery" | "blogs" | "faqs" | "offers";

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("dashboard");
  const [packages, setPackages] = useState<TourPackage[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);

  const [editPkg, setEditPkg] = useState<TourPackage | null>(null);
  const [newPkg, setNewPkg] = useState(false);
  const [editReview, setEditReview] = useState<Review | null>(null);
  const [newReview, setNewReview] = useState(false);
  const [editGallery, setEditGallery] = useState<GalleryImage | null>(null);
  const [newGallery, setNewGallery] = useState(false);
  const [editBlog, setEditBlog] = useState<BlogPost | null>(null);
  const [newBlog, setNewBlog] = useState(false);
  const [editFaq, setEditFaq] = useState<FAQ | null>(null);
  const [newFaq, setNewFaq] = useState(false);
  const [editOffer, setEditOffer] = useState<Offer | null>(null);
  const [newOffer, setNewOffer] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me").then(r => { if (!r.ok) router.push("/login"); else setLoading(false); });
  }, [router]);

  useEffect(() => {
    if (loading) return;
    Promise.all([
      fetch("/api/packages").then(r => r.json()),
      fetch("/api/bookings").then(r => r.json()),
      fetch("/api/enquiries").then(r => r.json()),
      fetch("/api/reviews").then(r => r.json()),
      fetch("/api/gallery").then(r => r.json()),
      fetch("/api/blogs").then(r => r.json()),
      fetch("/api/faqs").then(r => r.json()),
      fetch("/api/offers").then(r => r.json()),
    ]).then(([pk, bk, en, rv, gl, bl, fq, of]) => {
      setPackages(pk); setBookings(bk); setEnquiries(en); setReviews(rv);
      setGallery(gl); setBlogs(bl); setFaqs(fq); setOffers(of);
    });
  }, [loading]);

  const logout = async () => { await fetch("/api/auth/logout", { method: "POST" }); router.push("/login"); };

  // Booking CRUD
  const updateBookingStatus = async (id: string, field: string, value: string) => {
    await fetch("/api/bookings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, [field]: value }) });
    setBookings(prev => prev.map(b => b.id === id ? { ...b, [field]: value } : b));
  };
  const deleteBooking = async (id: string) => {
    if (!confirm("Delete this booking?")) return;
    await fetch(`/api/bookings?id=${id}`, { method: "DELETE" });
    setBookings(prev => prev.filter(b => b.id !== id));
  };

  // Enquiry CRUD
  const updateEnquiryStatus = async (id: string, status: string) => {
    await fetch("/api/enquiries", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
    setEnquiries(prev => prev.map(e => e.id === id ? { ...e, status } : e));
  };
  const deleteEnquiry = async (id: string) => {
    if (!confirm("Delete this enquiry?")) return;
    await fetch(`/api/enquiries?id=${id}`, { method: "DELETE" });
    setEnquiries(prev => prev.filter(e => e.id !== id));
  };

  // Package CRUD
  const createPkgFn = async (pkg: Omit<TourPackage, "id" | "createdAt">) => {
    const res = await fetch("/api/packages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(pkg) });
    const data = await res.json();
    setPackages(prev => [...prev, data.package]); setNewPkg(false);
  };
  const savePkgFn = async (id: string, updates: Partial<TourPackage>) => {
    const res = await fetch("/api/packages", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...updates }) });
    const data = await res.json();
    setPackages(prev => prev.map(p => p.id === id ? data.package : p)); setEditPkg(null);
  };
  const removePkg = async (id: string) => {
    if (!confirm("Delete this package?")) return;
    await fetch(`/api/packages?id=${id}`, { method: "DELETE" });
    setPackages(prev => prev.filter(p => p.id !== id));
  };

  // Review CRUD
  const createReviewFn = async (rev: Omit<Review, "id" | "createdAt">) => {
    const res = await fetch("/api/reviews", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(rev) });
    const data = await res.json();
    setReviews(prev => [...prev, data.review]); setNewReview(false);
  };
  const saveReviewFn = async (id: string, updates: Partial<Review>) => {
    const res = await fetch("/api/reviews", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...updates }) });
    const data = await res.json();
    setReviews(prev => prev.map(r => r.id === id ? data.review : r)); setEditReview(null);
  };
  const removeReview = async (id: string) => {
    if (!confirm("Delete this review?")) return;
    await fetch(`/api/reviews?id=${id}`, { method: "DELETE" });
    setReviews(prev => prev.filter(r => r.id !== id));
  };

  // Gallery CRUD
  const createGalleryFn = async (img: Omit<GalleryImage, "id" | "createdAt">) => {
    const res = await fetch("/api/gallery", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(img) });
    const data = await res.json();
    setGallery(prev => [...prev, data.image]); setNewGallery(false);
  };
  const saveGalleryFn = async (id: string, updates: Partial<GalleryImage>) => {
    const res = await fetch("/api/gallery", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...updates }) });
    const data = await res.json();
    setGallery(prev => prev.map(g => g.id === id ? data.image : g)); setEditGallery(null);
  };
  const removeGallery = async (id: string) => {
    if (!confirm("Delete this image?")) return;
    await fetch(`/api/gallery?id=${id}`, { method: "DELETE" });
    setGallery(prev => prev.filter(g => g.id !== id));
  };

  // Blog CRUD
  const createBlogFn = async (post: Omit<BlogPost, "id" | "createdAt">) => {
    const res = await fetch("/api/blogs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(post) });
    const data = await res.json();
    setBlogs(prev => [...prev, data.blog]); setNewBlog(false);
  };
  const saveBlogFn = async (id: string, updates: Partial<BlogPost>) => {
    const res = await fetch("/api/blogs", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...updates }) });
    const data = await res.json();
    setBlogs(prev => prev.map(b => b.id === id ? data.blog : b)); setEditBlog(null);
  };
  const removeBlog = async (id: string) => {
    if (!confirm("Delete this blog post?")) return;
    await fetch(`/api/blogs?id=${id}`, { method: "DELETE" });
    setBlogs(prev => prev.filter(b => b.id !== id));
  };

  // FAQ CRUD
  const createFaqFn = async (faq: Omit<FAQ, "id" | "createdAt">) => {
    const res = await fetch("/api/faqs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(faq) });
    const data = await res.json();
    setFaqs(prev => [...prev, data.faq]); setNewFaq(false);
  };
  const saveFaqFn = async (id: string, updates: Partial<FAQ>) => {
    const res = await fetch("/api/faqs", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...updates }) });
    const data = await res.json();
    setFaqs(prev => prev.map(f => f.id === id ? data.faq : f)); setEditFaq(null);
  };
  const removeFaq = async (id: string) => {
    if (!confirm("Delete this FAQ?")) return;
    await fetch(`/api/faqs?id=${id}`, { method: "DELETE" });
    setFaqs(prev => prev.filter(f => f.id !== id));
  };

  // Offer CRUD
  const createOfferFn = async (offer: Omit<Offer, "id" | "createdAt">) => {
    const res = await fetch("/api/offers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(offer) });
    const data = await res.json();
    setOffers(prev => [...prev, data.offer]); setNewOffer(false);
  };
  const saveOfferFn = async (id: string, updates: Partial<Offer>) => {
    const res = await fetch("/api/offers", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...updates }) });
    const data = await res.json();
    setOffers(prev => prev.map(o => o.id === id ? data.offer : o)); setEditOffer(null);
  };
  const removeOffer = async (id: string) => {
    if (!confirm("Delete this offer?")) return;
    await fetch(`/api/offers?id=${id}`, { method: "DELETE" });
    setOffers(prev => prev.filter(o => o.id !== id));
  };

  if (loading) return <div style={{ display: "grid", placeItems: "center", height: "100vh", background: "#0f1422", color: "#E67E22", fontFamily: "Poppins, sans-serif", fontSize: "1.2rem" }}>Loading...</div>;

  const totalRevenue = bookings.filter(b => b.paymentStatus === "paid").reduce((s, b) => s + b.amount, 0);
  const confirmedBookings = bookings.filter(b => b.bookingStatus === "confirmed").length;
  const newEnquiries = enquiries.filter(e => e.status === "new").length;
  const activeOffers = offers.filter(o => o.active).length;
  const activePackages = packages.filter(p => !p.hidden).length;

  const tabKeys: Tab[] = ["dashboard", "packages", "bookings", "enquiries", "reviews", "gallery", "blogs", "faqs", "offers"];
  const tabLabels: Record<Tab, string> = {
    dashboard: "Dashboard", packages: "Packages", bookings: "Bookings", enquiries: "Enquiries",
    reviews: "Reviews", gallery: "Gallery", blogs: "Blogs", faqs: "FAQs", offers: "Offers",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0f1422", color: "#EDE6DA", fontFamily: "'Poppins', sans-serif" }}>
      <style>{`
        .adm-header{background:rgba(15,20,34,.97);border-bottom:1px solid rgba(230,126,34,.3);padding:0 32px;display:flex;align-items:center;justify-content:space-between;height:64px;position:sticky;top:0;z-index:10}
        .adm-header h1{font-family:Poppins,sans-serif;color:#E67E22;font-size:1.1rem;letter-spacing:.08em;font-weight:600;margin:0}
        .adm-tabs{display:flex;gap:0;background:#151b2e;border-bottom:1px solid #252d42;overflow-x:auto}
        .adm-tab{padding:14px 22px;cursor:pointer;border:none;background:none;color:#8a8070;font:inherit;font-size:.88rem;border-bottom:2px solid transparent;transition:all .2s;white-space:nowrap}
        .adm-tab:hover{color:#E67E22}
        .adm-tab.active{color:#E67E22;border-bottom-color:#E67E22;background:rgba(230,126,34,.06)}
        .adm-body{max-width:1280px;margin:0 auto;padding:32px}
        .stat-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:20px;margin-bottom:32px}
        .stat-card{background:#1a2035;border:1px solid #252d42;border-radius:8px;padding:24px;text-align:center}
        .stat-card .num{font-weight:700;font-size:2rem;color:#E67E22;margin-bottom:4px}
        .stat-card .lbl{font-size:.85rem;color:#8a8070}
        .adm-table{width:100%;border-collapse:collapse;font-size:.88rem}
        .adm-table th{text-align:left;padding:12px 14px;color:#8a8070;font-weight:600;border-bottom:1px solid #252d42;font-size:.8rem;text-transform:uppercase;letter-spacing:.06em}
        .adm-table td{padding:12px 14px;border-bottom:1px solid #1e2640}
        .adm-table tr:hover{background:rgba(230,126,34,.04)}
        .badge{display:inline-block;padding:3px 10px;border-radius:12px;font-size:.75rem;font-weight:600}
        .badge-paid,.badge-confirmed,.badge-completed{background:rgba(91,201,107,.15);color:#7ddf8a;border:1px solid rgba(91,201,107,.3)}
        .badge-pending{background:rgba(230,190,50,.15);color:#E2C68E;border:1px solid rgba(230,190,50,.3)}
        .badge-new{background:rgba(91,154,201,.15);color:#7db8df;border:1px solid rgba(91,154,201,.3)}
        .badge-contacted{background:rgba(230,126,34,.15);color:#E67E22;border:1px solid rgba(230,126,34,.3)}
        .badge-cancelled,.badge-failed{background:rgba(200,60,60,.15);color:#e77;border:1px solid rgba(200,60,60,.3)}
        .badge-refunded{background:rgba(140,140,140,.15);color:#aaa;border:1px solid rgba(140,140,140,.3)}
        .badge-active{background:rgba(91,201,107,.15);color:#7ddf8a;border:1px solid rgba(91,201,107,.3)}
        .badge-inactive,.badge-hidden{background:rgba(140,140,140,.15);color:#aaa;border:1px solid rgba(140,140,140,.3)}
        .adm-btn{padding:6px 14px;border:1px solid #323a50;background:none;color:#ADA394;border-radius:4px;cursor:pointer;font:inherit;font-size:.8rem;transition:all .2s}
        .adm-btn:hover{border-color:#E67E22;color:#E67E22}
        .adm-btn.primary{background:#E67E22;color:#fff;border-color:#E67E22}
        .adm-btn.primary:hover{background:#d2691e}
        .adm-btn.danger{border-color:#c44;color:#e77}
        .adm-btn.danger:hover{background:rgba(200,60,60,.15)}
        select.adm-sel{background:#1a2035;color:#EDE6DA;border:1px solid #323a50;padding:4px 8px;border-radius:4px;font:inherit;font-size:.8rem}
        .adm-card{background:#1a2035;border:1px solid #252d42;border-radius:8px;padding:24px;margin-bottom:16px}
        .adm-card h3{margin:0 0 12px;font-weight:600;color:#E67E22}
        .adm-form{display:grid;grid-template-columns:1fr 1fr;gap:14px}
        .adm-form .full{grid-column:1/-1}
        .adm-form label{display:block;font-size:.8rem;color:#8a8070;margin-bottom:4px}
        .adm-form input,.adm-form textarea,.adm-form select{width:100%;padding:10px 12px;background:#0f1422;border:1px solid #323a50;border-radius:4px;color:#EDE6DA;font:inherit;font-size:.88rem;box-sizing:border-box}
        .adm-form input:focus,.adm-form textarea:focus{outline:none;border-color:#E67E22}
        .adm-form textarea{min-height:60px;resize:vertical}
        .adm-actions{display:flex;gap:8px;margin-top:14px}
        .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);display:grid;place-items:center;z-index:100;padding:20px;overflow-y:auto}
        .modal-content{background:#1a2035;border:1px solid #252d42;border-radius:10px;padding:32px;width:100%;max-width:700px;max-height:90vh;overflow-y:auto}
        .pkg-card{display:flex;gap:16px;align-items:center;background:#1a2035;border:1px solid #252d42;border-radius:8px;padding:16px;margin-bottom:12px}
        .pkg-card img{width:100px;height:70px;object-fit:cover;border-radius:4px;border:1px solid #323a50}
        .pkg-info{flex:1}
        .pkg-info h4{margin:0 0 4px;color:#EDE6DA;font-size:.95rem}
        .pkg-info p{margin:0;font-size:.82rem;color:#8a8070}
        .pkg-actions{display:flex;gap:6px;flex-shrink:0}
        @media(max-width:700px){
          .adm-tabs{overflow-x:auto;white-space:nowrap}
          .adm-body{padding:16px}
          .adm-table{font-size:.78rem}
          .adm-table th,.adm-table td{padding:8px 6px}
          .adm-form{grid-template-columns:1fr}
          .pkg-card{flex-direction:column;align-items:stretch}
          .modal-content{padding:20px}
        }
      `}</style>

      <div className="adm-header">
        <h1>ATLAS TOUR & TRAVELS - Admin</h1>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <a href="/" style={{ color: "#8a8070", textDecoration: "none", fontSize: ".85rem" }}>View Site</a>
          <button className="adm-btn" onClick={logout}>Logout</button>
        </div>
      </div>

      <div className="adm-tabs">
        {tabKeys.map(tk => (
          <button key={tk} className={`adm-tab${tab === tk ? " active" : ""}`} onClick={() => setTab(tk)}>
            {tabLabels[tk]}
          </button>
        ))}
      </div>

      <div className="adm-body">
        {/* ============ DASHBOARD ============ */}
        {tab === "dashboard" && (
          <>
            <div className="stat-grid">
              <div className="stat-card"><div className="num">{bookings.length}</div><div className="lbl">Total Bookings</div></div>
              <div className="stat-card"><div className="num">{enquiries.length}</div><div className="lbl">Total Enquiries</div></div>
              <div className="stat-card"><div className="num">{activePackages}</div><div className="lbl">Active Packages</div></div>
              <div className="stat-card"><div className="num">{activeOffers}</div><div className="lbl">Active Offers</div></div>
              <div className="stat-card"><div className="num">{totalRevenue > 0 ? `\u20B9${totalRevenue.toLocaleString()}` : "--"}</div><div className="lbl">Revenue (Paid)</div></div>
            </div>
            <div className="adm-card">
              <h3>Recent Bookings</h3>
              <div style={{ overflowX: "auto" }}>
                <table className="adm-table">
                  <thead><tr><th>Guest</th><th>Package</th><th>Travel Date</th><th>Amount</th><th>Status</th></tr></thead>
                  <tbody>
                    {bookings.slice(-5).reverse().map(b => (
                      <tr key={b.id}>
                        <td>{b.name}</td>
                        <td>{b.packageName}</td>
                        <td>{b.travelDate}</td>
                        <td>{"\u20B9"}{b.amount?.toLocaleString()}</td>
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
                    {enquiries.slice(-5).reverse().map(e => (
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
        )}

        {/* ============ PACKAGES ============ */}
        {tab === "packages" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontWeight: 600, color: "#E67E22" }}>Tour Packages</h2>
              <button className="adm-btn primary" onClick={() => setNewPkg(true)}>+ Add Package</button>
            </div>
            {(newPkg || editPkg) && (
              <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) { setNewPkg(false); setEditPkg(null); } }}>
                <div className="modal-content">
                  <PackageForm
                    pkg={editPkg || undefined}
                    onSave={(data) => editPkg ? savePkgFn(editPkg.id, data) : createPkgFn(data)}
                    onCancel={() => { setNewPkg(false); setEditPkg(null); }}
                  />
                </div>
              </div>
            )}
            {packages.map(pkg => (
              <div key={pkg.id} className="pkg-card">
                <img src={pkg.image} alt={pkg.name} />
                <div className="pkg-info">
                  <h4>
                    {pkg.name}{" "}
                    {pkg.hidden && <span className="badge badge-hidden">Hidden</span>}
                  </h4>
                  <p>{pkg.destination} | {pkg.duration} | {"\u20B9"}{pkg.price?.toLocaleString()}{pkg.originalPrice ? ` (was \u20B9${pkg.originalPrice.toLocaleString()})` : ""}</p>
                  <p style={{ marginTop: 4 }}>Category: {pkg.category}</p>
                </div>
                <div className="pkg-actions">
                  <button className="adm-btn" onClick={() => savePkgFn(pkg.id, { hidden: !pkg.hidden })}>{pkg.hidden ? "Show" : "Hide"}</button>
                  <button className="adm-btn" onClick={() => setEditPkg({ ...pkg })}>Edit</button>
                  <button className="adm-btn danger" onClick={() => removePkg(pkg.id)}>Del</button>
                </div>
              </div>
            ))}
            {packages.length === 0 && !newPkg && <p style={{ textAlign: "center", color: "#8a8070", marginTop: 40 }}>No packages yet.</p>}
          </>
        )}

        {/* ============ BOOKINGS ============ */}
        {tab === "bookings" && (
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
                    <td>{"\u20B9"}{b.amount?.toLocaleString()}</td>
                    <td>
                      <select className="adm-sel" value={b.paymentStatus} onChange={e => updateBookingStatus(b.id, "paymentStatus", e.target.value)}>
                        <option value="pending">Pending</option><option value="paid">Paid</option><option value="failed">Failed</option><option value="refunded">Refunded</option>
                      </select>
                    </td>
                    <td>
                      <select className="adm-sel" value={b.bookingStatus} onChange={e => updateBookingStatus(b.id, "bookingStatus", e.target.value)}>
                        <option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td><button className="adm-btn danger" onClick={() => deleteBooking(b.id)}>Del</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {bookings.length === 0 && <p style={{ textAlign: "center", color: "#8a8070", marginTop: 40 }}>No bookings yet.</p>}
          </div>
        )}

        {/* ============ ENQUIRIES ============ */}
        {tab === "enquiries" && (
          <div style={{ overflowX: "auto" }}>
            <h2 style={{ margin: "0 0 20px", fontWeight: 600, color: "#E67E22" }}>Enquiries</h2>
            <table className="adm-table">
              <thead><tr><th>Name</th><th>Contact</th><th>Travelers</th><th>Travel Date</th><th>Message</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {enquiries.map(e => (
                  <tr key={e.id}>
                    <td><strong>{e.name}</strong></td>
                    <td>{e.phone}<br /><span style={{ fontSize: ".75rem", color: "#8a8070" }}>{e.email}</span></td>
                    <td>{e.travelers}</td>
                    <td>{e.travelDate}</td>
                    <td style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.message || "--"}</td>
                    <td>
                      <select className="adm-sel" value={e.status} onChange={ev => updateEnquiryStatus(e.id, ev.target.value)}>
                        <option value="new">New</option><option value="contacted">Contacted</option><option value="confirmed">Confirmed</option><option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td><button className="adm-btn danger" onClick={() => deleteEnquiry(e.id)}>Del</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {enquiries.length === 0 && <p style={{ textAlign: "center", color: "#8a8070", marginTop: 40 }}>No enquiries yet.</p>}
          </div>
        )}

        {/* ============ REVIEWS ============ */}
        {tab === "reviews" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontWeight: 600, color: "#E67E22" }}>Reviews</h2>
              <button className="adm-btn primary" onClick={() => setNewReview(true)}>+ Add Review</button>
            </div>
            {(newReview || editReview) && (
              <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) { setNewReview(false); setEditReview(null); } }}>
                <div className="modal-content">
                  <ReviewForm
                    review={editReview || undefined}
                    onSave={(data) => editReview ? saveReviewFn(editReview.id, data) : createReviewFn(data)}
                    onCancel={() => { setNewReview(false); setEditReview(null); }}
                  />
                </div>
              </div>
            )}
            {reviews.map(r => (
              <div key={r.id} className="adm-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    {r.name}
                    <span style={{ color: "#E67E22", fontSize: ".9rem" }}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                    <span className={`badge ${r.active ? "badge-active" : "badge-inactive"}`}>{r.active ? "Active" : "Inactive"}</span>
                  </h3>
                  <p style={{ color: "#8a8070", fontSize: ".88rem", margin: "4px 0", fontStyle: "italic" }}>&ldquo;{r.text}&rdquo;</p>
                  <p style={{ fontSize: ".82rem", color: "#E67E22" }}>{r.city}{r.packageName ? ` | ${r.packageName}` : ""}</p>
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button className="adm-btn" onClick={() => saveReviewFn(r.id, { active: !r.active })}>{r.active ? "Deactivate" : "Activate"}</button>
                  <button className="adm-btn" onClick={() => setEditReview({ ...r })}>Edit</button>
                  <button className="adm-btn danger" onClick={() => removeReview(r.id)}>Del</button>
                </div>
              </div>
            ))}
            {reviews.length === 0 && !newReview && <p style={{ textAlign: "center", color: "#8a8070", marginTop: 40 }}>No reviews yet.</p>}
          </>
        )}

        {/* ============ GALLERY ============ */}
        {tab === "gallery" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontWeight: 600, color: "#E67E22" }}>Gallery</h2>
              <button className="adm-btn primary" onClick={() => setNewGallery(true)}>+ Add Image</button>
            </div>
            {(newGallery || editGallery) && (
              <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) { setNewGallery(false); setEditGallery(null); } }}>
                <div className="modal-content">
                  <GalleryForm
                    image={editGallery || undefined}
                    onSave={(data) => editGallery ? saveGalleryFn(editGallery.id, data) : createGalleryFn(data)}
                    onCancel={() => { setNewGallery(false); setEditGallery(null); }}
                  />
                </div>
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 16 }}>
              {gallery.map(img => (
                <div key={img.id} className="adm-card" style={{ padding: 0, overflow: "hidden" }}>
                  <img src={img.src} alt={img.caption} style={{ width: "100%", height: 160, objectFit: "cover" }} />
                  <div style={{ padding: 16 }}>
                    <h3 style={{ display: "flex", gap: 8, alignItems: "center", fontSize: ".9rem", flexWrap: "wrap" }}>
                      {img.caption || "Untitled"}
                      <span className={`badge ${img.active ? "badge-active" : "badge-inactive"}`}>{img.active ? "Active" : "Inactive"}</span>
                    </h3>
                    <p style={{ fontSize: ".8rem", color: "#8a8070", margin: "4px 0" }}>Category: {img.category}</p>
                    <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                      <button className="adm-btn" onClick={() => saveGalleryFn(img.id, { active: !img.active })}>{img.active ? "Hide" : "Show"}</button>
                      <button className="adm-btn" onClick={() => setEditGallery({ ...img })}>Edit</button>
                      <button className="adm-btn danger" onClick={() => removeGallery(img.id)}>Del</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {gallery.length === 0 && !newGallery && <p style={{ textAlign: "center", color: "#8a8070", marginTop: 40 }}>No gallery images yet.</p>}
          </>
        )}

        {/* ============ BLOGS ============ */}
        {tab === "blogs" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontWeight: 600, color: "#E67E22" }}>Blog Posts</h2>
              <button className="adm-btn primary" onClick={() => setNewBlog(true)}>+ Add Post</button>
            </div>
            {(newBlog || editBlog) && (
              <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) { setNewBlog(false); setEditBlog(null); } }}>
                <div className="modal-content">
                  <BlogForm
                    blog={editBlog || undefined}
                    onSave={(data) => editBlog ? saveBlogFn(editBlog.id, data) : createBlogFn(data)}
                    onCancel={() => { setNewBlog(false); setEditBlog(null); }}
                  />
                </div>
              </div>
            )}
            {blogs.map(b => (
              <div key={b.id} className="adm-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    {b.title}
                    <span className={`badge ${b.active ? "badge-active" : "badge-inactive"}`}>{b.active ? "Active" : "Inactive"}</span>
                  </h3>
                  <p style={{ color: "#8a8070", fontSize: ".88rem", margin: "4px 0" }}>{b.excerpt}</p>
                  <p style={{ fontSize: ".82rem", color: "#E67E22" }}>By {b.author} | {b.category}</p>
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button className="adm-btn" onClick={() => saveBlogFn(b.id, { active: !b.active })}>{b.active ? "Deactivate" : "Activate"}</button>
                  <button className="adm-btn" onClick={() => setEditBlog({ ...b })}>Edit</button>
                  <button className="adm-btn danger" onClick={() => removeBlog(b.id)}>Del</button>
                </div>
              </div>
            ))}
            {blogs.length === 0 && !newBlog && <p style={{ textAlign: "center", color: "#8a8070", marginTop: 40 }}>No blog posts yet.</p>}
          </>
        )}

        {/* ============ FAQS ============ */}
        {tab === "faqs" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontWeight: 600, color: "#E67E22" }}>FAQs</h2>
              <button className="adm-btn primary" onClick={() => setNewFaq(true)}>+ Add FAQ</button>
            </div>
            {(newFaq || editFaq) && (
              <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) { setNewFaq(false); setEditFaq(null); } }}>
                <div className="modal-content">
                  <FaqForm
                    faq={editFaq || undefined}
                    onSave={(data) => editFaq ? saveFaqFn(editFaq.id, data) : createFaqFn(data)}
                    onCancel={() => { setNewFaq(false); setEditFaq(null); }}
                  />
                </div>
              </div>
            )}
            {faqs.sort((a, b) => a.order - b.order).map(f => (
              <div key={f.id} className="adm-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ color: "#8a8070", fontSize: ".8rem" }}>#{f.order}</span>
                    {f.question}
                    <span className={`badge ${f.active ? "badge-active" : "badge-inactive"}`}>{f.active ? "Active" : "Inactive"}</span>
                  </h3>
                  <p style={{ color: "#8a8070", fontSize: ".88rem", margin: "4px 0" }}>{f.answer}</p>
                  {f.questionHi && <p style={{ fontSize: ".82rem", color: "#E67E22", margin: "4px 0" }}>HI: {f.questionHi}</p>}
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button className="adm-btn" onClick={() => saveFaqFn(f.id, { active: !f.active })}>{f.active ? "Deactivate" : "Activate"}</button>
                  <button className="adm-btn" onClick={() => setEditFaq({ ...f })}>Edit</button>
                  <button className="adm-btn danger" onClick={() => removeFaq(f.id)}>Del</button>
                </div>
              </div>
            ))}
            {faqs.length === 0 && !newFaq && <p style={{ textAlign: "center", color: "#8a8070", marginTop: 40 }}>No FAQs yet.</p>}
          </>
        )}

        {/* ============ OFFERS ============ */}
        {tab === "offers" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontWeight: 600, color: "#E67E22" }}>Offers</h2>
              <button className="adm-btn primary" onClick={() => setNewOffer(true)}>+ Add Offer</button>
            </div>
            {(newOffer || editOffer) && (
              <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) { setNewOffer(false); setEditOffer(null); } }}>
                <div className="modal-content">
                  <OfferForm
                    offer={editOffer || undefined}
                    onSave={(data) => editOffer ? saveOfferFn(editOffer.id, data) : createOfferFn(data)}
                    onCancel={() => { setNewOffer(false); setEditOffer(null); }}
                  />
                </div>
              </div>
            )}
            {offers.map(o => (
              <div key={o.id} className="adm-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    {o.title}
                    <span className={`badge ${o.active ? "badge-active" : "badge-inactive"}`}>{o.active ? "Active" : "Inactive"}</span>
                  </h3>
                  <p style={{ color: "#8a8070", fontSize: ".88rem", margin: "4px 0" }}>{o.description}</p>
                  <p style={{ fontSize: ".82rem", color: "#E67E22" }}>
                    Discount: {o.discount}%{o.code ? ` | Code: ${o.code}` : ""} | Valid: {o.validFrom || "--"} to {o.validTo || "--"}
                  </p>
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button className="adm-btn" onClick={() => saveOfferFn(o.id, { active: !o.active })}>{o.active ? "Deactivate" : "Activate"}</button>
                  <button className="adm-btn" onClick={() => setEditOffer({ ...o })}>Edit</button>
                  <button className="adm-btn danger" onClick={() => removeOffer(o.id)}>Del</button>
                </div>
              </div>
            ))}
            {offers.length === 0 && !newOffer && <p style={{ textAlign: "center", color: "#8a8070", marginTop: 40 }}>No offers yet.</p>}
          </>
        )}
      </div>
    </div>
  );
}

/* ==================== FORM COMPONENTS ==================== */

function PackageForm({ pkg, onSave, onCancel }: { pkg?: TourPackage; onSave: (p: Omit<TourPackage, "id" | "createdAt">) => void; onCancel: () => void }) {
  const [name, setName] = useState(pkg?.name || "");
  const [destination, setDestination] = useState(pkg?.destination || "");
  const [duration, setDuration] = useState(pkg?.duration || "");
  const [price, setPrice] = useState(pkg?.price?.toString() || "");
  const [originalPrice, setOriginalPrice] = useState(pkg?.originalPrice?.toString() || "");
  const [image, setImage] = useState(pkg?.image || "/images/package.jpg");
  const [description, setDescription] = useState(pkg?.description || "");
  const [highlightsStr, setHighlightsStr] = useState(pkg?.highlights?.join("\n") || "");
  const [itineraryStr, setItineraryStr] = useState(pkg?.itinerary?.join("\n") || "");
  const [inclusionsStr, setInclusionsStr] = useState(pkg?.inclusions?.join("\n") || "");
  const [category, setCategory] = useState<TourPackage["category"]>(pkg?.category || "spiritual");
  const [hidden, setHidden] = useState(pkg?.hidden ?? false);

  return (
    <div>
      <h3 style={{ margin: "0 0 16px", fontWeight: 600, color: "#E67E22" }}>{pkg ? "Edit Package" : "New Package"}</h3>
      <div className="adm-form">
        <div><label>Name *</label><input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Varanasi Spiritual Tour" /></div>
        <div><label>Destination</label><input value={destination} onChange={e => setDestination(e.target.value)} placeholder="e.g. Varanasi, UP" /></div>
        <div><label>Duration</label><input value={duration} onChange={e => setDuration(e.target.value)} placeholder="e.g. 3 Days / 2 Nights" /></div>
        <div><label>Price (INR) *</label><input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="e.g. 12999" /></div>
        <div><label>Original Price (INR)</label><input type="number" value={originalPrice} onChange={e => setOriginalPrice(e.target.value)} placeholder="e.g. 15999 (for strikethrough)" /></div>
        <div><label>Image path/URL</label><input value={image} onChange={e => setImage(e.target.value)} /></div>
        <div>
          <label>Category</label>
          <select value={category} onChange={e => setCategory(e.target.value as TourPackage["category"])}>
            <option value="spiritual">Spiritual</option>
            <option value="cultural">Cultural</option>
            <option value="adventure">Adventure</option>
            <option value="heritage">Heritage</option>
          </select>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, paddingTop: 20 }}>
          <label style={{ display: "flex", gap: 6, alignItems: "center" }}><input type="checkbox" checked={hidden} onChange={e => setHidden(e.target.checked)} /> Hidden</label>
        </div>
        <div className="full"><label>Description</label><textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Package description..." /></div>
        <div className="full"><label>Highlights (one per line)</label><textarea value={highlightsStr} onChange={e => setHighlightsStr(e.target.value)} placeholder={"Ganga Aarti darshan\nKashi Vishwanath Temple\nBoat ride at sunrise"} style={{ minHeight: 80 }} /></div>
        <div className="full"><label>Itinerary (one per line)</label><textarea value={itineraryStr} onChange={e => setItineraryStr(e.target.value)} placeholder={"Day 1: Arrival & evening aarti\nDay 2: Temple tour & boat ride\nDay 3: Departure"} style={{ minHeight: 80 }} /></div>
        <div className="full"><label>Inclusions (one per line)</label><textarea value={inclusionsStr} onChange={e => setInclusionsStr(e.target.value)} placeholder={"Hotel accommodation\nBreakfast & dinner\nAC transport\nGuide"} style={{ minHeight: 80 }} /></div>
      </div>
      <div className="adm-actions">
        <button className="adm-btn primary" onClick={() => {
          if (!name.trim() || !price) return;
          onSave({
            name: name.trim(), destination, duration, price: Number(price),
            originalPrice: originalPrice ? Number(originalPrice) : undefined,
            image, description, category, hidden,
            highlights: highlightsStr.split("\n").map(s => s.trim()).filter(Boolean),
            itinerary: itineraryStr.split("\n").map(s => s.trim()).filter(Boolean),
            inclusions: inclusionsStr.split("\n").map(s => s.trim()).filter(Boolean),
          });
        }}>Save</button>
        <button className="adm-btn" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

function ReviewForm({ review, onSave, onCancel }: { review?: Review; onSave: (r: Omit<Review, "id" | "createdAt">) => void; onCancel: () => void }) {
  const [name, setName] = useState(review?.name || "");
  const [rating, setRating] = useState(review?.rating || 5);
  const [text, setText] = useState(review?.text || "");
  const [city, setCity] = useState(review?.city || "");
  const [packageName, setPackageName] = useState(review?.packageName || "");
  const [active, setActive] = useState(review?.active ?? true);

  return (
    <div>
      <h3 style={{ margin: "0 0 16px", fontWeight: 600, color: "#E67E22" }}>{review ? "Edit Review" : "New Review"}</h3>
      <div className="adm-form">
        <div><label>Guest Name *</label><input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Rajesh Sharma" /></div>
        <div><label>Rating (1-5)</label><input type="number" min={1} max={5} value={rating} onChange={e => setRating(Number(e.target.value))} /></div>
        <div><label>City</label><input value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Delhi" /></div>
        <div><label>Package Name</label><input value={packageName} onChange={e => setPackageName(e.target.value)} placeholder="e.g. Varanasi Spiritual Tour" /></div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, paddingTop: 20 }}>
          <label style={{ display: "flex", gap: 6, alignItems: "center" }}><input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} /> Active</label>
        </div>
        <div className="full"><label>Review Text</label><textarea value={text} onChange={e => setText(e.target.value)} placeholder="Guest review text..." /></div>
      </div>
      <div className="adm-actions">
        <button className="adm-btn primary" onClick={() => name.trim() && onSave({ name: name.trim(), rating: Math.min(5, Math.max(1, rating)), text, city, packageName, active })}>Save</button>
        <button className="adm-btn" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

function GalleryForm({ image, onSave, onCancel }: { image?: GalleryImage; onSave: (g: Omit<GalleryImage, "id" | "createdAt">) => void; onCancel: () => void }) {
  const [src, setSrc] = useState(image?.src || "");
  const [caption, setCaption] = useState(image?.caption || "");
  const [category, setCategory] = useState(image?.category || "destination");
  const [active, setActive] = useState(image?.active ?? true);

  return (
    <div>
      <h3 style={{ margin: "0 0 16px", fontWeight: 600, color: "#E67E22" }}>{image ? "Edit Image" : "New Image"}</h3>
      <div className="adm-form">
        <div className="full"><label>Image URL *</label><input value={src} onChange={e => setSrc(e.target.value)} placeholder="/images/gallery/photo.jpg or https://..." /></div>
        <div><label>Caption</label><input value={caption} onChange={e => setCaption(e.target.value)} placeholder="e.g. Sunrise at Ganges" /></div>
        <div><label>Category</label><input value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. destination, temple, adventure" /></div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, paddingTop: 20 }}>
          <label style={{ display: "flex", gap: 6, alignItems: "center" }}><input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} /> Active</label>
        </div>
      </div>
      {src && <div style={{ marginTop: 12 }}><img src={src} alt="Preview" style={{ maxWidth: 200, maxHeight: 120, objectFit: "cover", borderRadius: 4, border: "1px solid #323a50" }} /></div>}
      <div className="adm-actions">
        <button className="adm-btn primary" onClick={() => src.trim() && onSave({ src: src.trim(), caption, category, active })}>Save</button>
        <button className="adm-btn" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

function BlogForm({ blog, onSave, onCancel }: { blog?: BlogPost; onSave: (b: Omit<BlogPost, "id" | "createdAt">) => void; onCancel: () => void }) {
  const [title, setTitle] = useState(blog?.title || "");
  const [excerpt, setExcerpt] = useState(blog?.excerpt || "");
  const [content, setContent] = useState(blog?.content || "");
  const [blogImage, setBlogImage] = useState(blog?.image || "");
  const [category, setCategory] = useState(blog?.category || "travel");
  const [author, setAuthor] = useState(blog?.author || "");
  const [active, setActive] = useState(blog?.active ?? true);

  return (
    <div>
      <h3 style={{ margin: "0 0 16px", fontWeight: 600, color: "#E67E22" }}>{blog ? "Edit Blog Post" : "New Blog Post"}</h3>
      <div className="adm-form">
        <div className="full"><label>Title *</label><input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Top 10 Spiritual Destinations in India" /></div>
        <div><label>Author</label><input value={author} onChange={e => setAuthor(e.target.value)} placeholder="e.g. Atlas Tours Team" /></div>
        <div><label>Category</label><input value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. travel, tips, spiritual" /></div>
        <div><label>Image URL</label><input value={blogImage} onChange={e => setBlogImage(e.target.value)} placeholder="/images/blog/post.jpg" /></div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, paddingTop: 20 }}>
          <label style={{ display: "flex", gap: 6, alignItems: "center" }}><input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} /> Active</label>
        </div>
        <div className="full"><label>Excerpt</label><textarea value={excerpt} onChange={e => setExcerpt(e.target.value)} placeholder="Short description for listing..." /></div>
        <div className="full"><label>Content</label><textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Full blog post content..." style={{ minHeight: 150 }} /></div>
      </div>
      <div className="adm-actions">
        <button className="adm-btn primary" onClick={() => title.trim() && onSave({ title: title.trim(), excerpt, content, image: blogImage, category, author, active })}>Save</button>
        <button className="adm-btn" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

function FaqForm({ faq, onSave, onCancel }: { faq?: FAQ; onSave: (f: Omit<FAQ, "id" | "createdAt">) => void; onCancel: () => void }) {
  const [question, setQuestion] = useState(faq?.question || "");
  const [questionHi, setQuestionHi] = useState(faq?.questionHi || "");
  const [answer, setAnswer] = useState(faq?.answer || "");
  const [answerHi, setAnswerHi] = useState(faq?.answerHi || "");
  const [active, setActive] = useState(faq?.active ?? true);
  const [order, setOrder] = useState(faq?.order ?? 0);

  return (
    <div>
      <h3 style={{ margin: "0 0 16px", fontWeight: 600, color: "#E67E22" }}>{faq ? "Edit FAQ" : "New FAQ"}</h3>
      <div className="adm-form">
        <div className="full"><label>Question (English) *</label><input value={question} onChange={e => setQuestion(e.target.value)} placeholder="e.g. What is included in the tour package?" /></div>
        <div className="full"><label>Question (Hindi)</label><input value={questionHi} onChange={e => setQuestionHi(e.target.value)} placeholder="Hindi translation (optional)" /></div>
        <div className="full"><label>Answer (English) *</label><textarea value={answer} onChange={e => setAnswer(e.target.value)} placeholder="Answer to the question..." /></div>
        <div className="full"><label>Answer (Hindi)</label><textarea value={answerHi} onChange={e => setAnswerHi(e.target.value)} placeholder="Hindi translation (optional)" /></div>
        <div><label>Order</label><input type="number" value={order} onChange={e => setOrder(Number(e.target.value))} /></div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, paddingTop: 20 }}>
          <label style={{ display: "flex", gap: 6, alignItems: "center" }}><input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} /> Active</label>
        </div>
      </div>
      <div className="adm-actions">
        <button className="adm-btn primary" onClick={() => question.trim() && answer.trim() && onSave({ question: question.trim(), questionHi: questionHi || undefined, answer: answer.trim(), answerHi: answerHi || undefined, active, order })}>Save</button>
        <button className="adm-btn" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

function OfferForm({ offer, onSave, onCancel }: { offer?: Offer; onSave: (o: Omit<Offer, "id" | "createdAt">) => void; onCancel: () => void }) {
  const [title, setTitle] = useState(offer?.title || "");
  const [description, setDescription] = useState(offer?.description || "");
  const [discount, setDiscount] = useState(offer?.discount?.toString() || "");
  const [code, setCode] = useState(offer?.code || "");
  const [validFrom, setValidFrom] = useState(offer?.validFrom || "");
  const [validTo, setValidTo] = useState(offer?.validTo || "");
  const [active, setActive] = useState(offer?.active ?? true);

  return (
    <div>
      <h3 style={{ margin: "0 0 16px", fontWeight: 600, color: "#E67E22" }}>{offer ? "Edit Offer" : "New Offer"}</h3>
      <div className="adm-form">
        <div><label>Title *</label><input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Early Bird Discount" /></div>
        <div><label>Discount (%)</label><input type="number" value={discount} onChange={e => setDiscount(e.target.value)} placeholder="e.g. 20" /></div>
        <div><label>Coupon Code</label><input value={code} onChange={e => setCode(e.target.value)} placeholder="e.g. ATLAS20" /></div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, paddingTop: 20 }}>
          <label style={{ display: "flex", gap: 6, alignItems: "center" }}><input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} /> Active</label>
        </div>
        <div className="full"><label>Description</label><textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Offer details..." /></div>
        <div><label>Valid From</label><input type="date" value={validFrom} onChange={e => setValidFrom(e.target.value)} /></div>
        <div><label>Valid To</label><input type="date" value={validTo} onChange={e => setValidTo(e.target.value)} /></div>
      </div>
      <div className="adm-actions">
        <button className="adm-btn primary" onClick={() => title.trim() && onSave({ title: title.trim(), description, discount: Number(discount) || 0, code: code || undefined, validFrom, validTo, active })}>Save</button>
        <button className="adm-btn" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
