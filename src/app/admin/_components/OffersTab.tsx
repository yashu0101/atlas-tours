import type { Offer } from "@/lib/types";

import type { EntityTabProps } from "../_lib/crud";
import OfferForm from "./forms/OfferForm";
import { Modal, TabHeader } from "./shared";

export default function OffersTab({ items: offers, editing, creating, onAdd, onEdit, onClose, onCreate, onSave, onRemove }: EntityTabProps<Offer>) {
  return (
    <>
      <TabHeader title="Offers" addLabel="+ Add Offer" onAdd={onAdd} />
      {(creating || editing) && (
        <Modal onClose={onClose}>
          <OfferForm
            offer={editing || undefined}
            onSave={(data) => editing ? onSave(editing.id, { ...data, code: data.code ?? null }) : onCreate(data)}
            onCancel={onClose}
          />
        </Modal>
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
            <button className="adm-btn" onClick={() => onSave(o.id, { active: !o.active })}>{o.active ? "Deactivate" : "Activate"}</button>
            <button className="adm-btn" onClick={() => onEdit({ ...o })}>Edit</button>
            <button className="adm-btn danger" onClick={() => onRemove(o.id)}>Del</button>
          </div>
        </div>
      ))}
      {offers.length === 0 && !creating && <p style={{ textAlign: "center", color: "#8a8070", marginTop: 40 }}>No offers yet.</p>}
    </>
  );
}
