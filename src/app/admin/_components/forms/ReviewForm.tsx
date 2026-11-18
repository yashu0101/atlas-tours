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
    // Native validation: required fields block Save and show the browser message; Enter saves.
    <form onSubmit={e => e.preventDefault()}>
      <h3 className="modal-title">{review ? "Edit Review" : "New Review"}</h3>
      <div className="adm-form">
        <label className="adm-fl"><span>Guest Name *</span><input required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Rajesh Sharma" /></label>
        <label className="adm-fl"><span>Rating (1-5)</span><input type="number" min={1} max={5} value={rating} onChange={e => setRating(Number(e.target.value))} /></label>
        <label className="adm-fl"><span>City</span><input value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Delhi" /></label>
        <label className="adm-fl"><span>Package Name</span><input value={packageName} onChange={e => setPackageName(e.target.value)} placeholder="e.g. Varanasi Spiritual Tour" /></label>
        <div className="adm-check-cell">
          <label className="adm-check"><input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} /> Active</label>
        </div>
        <label className="adm-fl full"><span>Review Text</span><textarea value={text} onChange={e => setText(e.target.value)} placeholder="Guest review text..." /></label>
      </div>
      <div className="adm-actions">
        <button type="submit" className="adm-btn primary" onClick={() => name.trim() && onSave({ name: name.trim(), rating: Math.min(5, Math.max(1, rating)), text, city, packageName, active })}>Save</button>
        <button type="button" className="adm-btn" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
