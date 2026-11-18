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
    // Native validation: required fields block Save and show the browser message; Enter saves.
    <form onSubmit={e => e.preventDefault()}>
      <h3 className="modal-title">{offer ? "Edit Offer" : "New Offer"}</h3>
      <div className="adm-form">
        <label className="adm-fl"><span>Title *</span><input required value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Early Bird Discount" /></label>
        <label className="adm-fl"><span>Discount (%)</span><input type="number" value={discount} onChange={e => setDiscount(e.target.value)} placeholder="e.g. 20" /></label>
        <label className="adm-fl"><span>Coupon Code</span><input value={code} onChange={e => setCode(e.target.value)} placeholder="e.g. ATLAS20" /></label>
        <div className="adm-check-cell">
          <label className="adm-check"><input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} /> Active</label>
        </div>
        <label className="adm-fl full"><span>Description</span><textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Offer details..." /></label>
        <label className="adm-fl"><span>Valid From</span><input type="date" value={validFrom} onChange={e => setValidFrom(e.target.value)} /></label>
        <label className="adm-fl"><span>Valid To</span><input type="date" value={validTo} onChange={e => setValidTo(e.target.value)} /></label>
      </div>
      <div className="adm-actions">
        <button type="submit" className="adm-btn primary" onClick={() => title.trim() && onSave({ title: title.trim(), description, discount: Number(discount) || 0, code: code || undefined, validFrom, validTo, active })}>Save</button>
        <button type="button" className="adm-btn" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
