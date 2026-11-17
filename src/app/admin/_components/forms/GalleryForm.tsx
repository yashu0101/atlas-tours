import { useState } from "react";

import type { GalleryImage } from "@/lib/types";

export default function GalleryForm({ image, onSave, onCancel }: { image?: GalleryImage; onSave: (g: Omit<GalleryImage, "id" | "createdAt">) => void; onCancel: () => void }) {
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
