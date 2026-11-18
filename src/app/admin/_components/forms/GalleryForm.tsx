import { useState } from "react";

import type { GalleryImage } from "@/lib/types";

export default function GalleryForm({ image, onSave, onCancel }: { image?: GalleryImage; onSave: (g: Omit<GalleryImage, "id" | "createdAt">) => void; onCancel: () => void }) {
  const [src, setSrc] = useState(image?.src || "");
  const [caption, setCaption] = useState(image?.caption || "");
  const [category, setCategory] = useState(image?.category || "destination");
  const [active, setActive] = useState(image?.active ?? true);

  return (
    // Native validation: required fields block Save and show the browser message; Enter saves.
    <form onSubmit={e => e.preventDefault()}>
      <h3 className="modal-title">{image ? "Edit Image" : "New Image"}</h3>
      <div className="adm-form">
        <label className="adm-fl full"><span>Image URL *</span><input required value={src} onChange={e => setSrc(e.target.value)} placeholder="/images/gallery/photo.jpg or https://..." /></label>
        <label className="adm-fl"><span>Caption</span><input value={caption} onChange={e => setCaption(e.target.value)} placeholder="e.g. Sunrise at Ganges" /></label>
        <label className="adm-fl"><span>Category</span><input value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. destination, temple, adventure" /></label>
        <div className="adm-check-cell">
          <label className="adm-check"><input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} /> Active</label>
        </div>
      </div>
      {src && <div className="adm-preview"><img src={src} alt="Preview" /></div>}
      <div className="adm-actions">
        <button type="submit" className="adm-btn primary" onClick={() => src.trim() && onSave({ src: src.trim(), caption, category, active })}>Save</button>
        <button type="button" className="adm-btn" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
