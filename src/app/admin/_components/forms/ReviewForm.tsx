import { useState } from "react";

import type { Review } from "@/lib/types";

export default function ReviewForm({ review, onSave, onCancel }: { review?: Review; onSave: (r: Omit<Review, "id" | "createdAt">) => void; onCancel: () => void }) {
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
