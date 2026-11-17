import { useState } from "react";

import type { Offer } from "@/lib/types";

export default function OfferForm({ offer, onSave, onCancel }: { offer?: Offer; onSave: (o: Omit<Offer, "id" | "createdAt">) => void; onCancel: () => void }) {
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
