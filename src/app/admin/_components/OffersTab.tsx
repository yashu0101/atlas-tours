import type { Offer } from "@/lib/types";

import type { EntityTabProps } from "../_lib/crud";
import OfferForm from "./forms/OfferForm";
import { Empty, Modal, TabHeader } from "./shared";

export default function OffersTab({ items: offers, editing, creating, onAdd, onEdit, onClose, onCreate, onSave, onRemove }: EntityTabProps<Offer>) {
  return (
    <>
      <TabHeader title="Offers" description="Discounts shown on the home page while active and in date" addLabel="Add offer" onAdd={onAdd} />
      {(creating || editing) && (
        <Modal onClose={onClose}>
          <OfferForm
            offer={editing || undefined}
            onSave={(data) => editing ? onSave(editing.id, { ...data, code: data.code ?? null }) : onCreate(data)}
            onCancel={onClose}
          />
        </Modal>
      )}
      <div className="adm-list">
        {offers.map(o => (
          <div key={o.id} className="adm-card adm-row">
            <div className="adm-row-main">
              <h3 className="adm-row-title">
                {o.title}
                <span className={`badge ${o.active ? "badge-active" : "badge-inactive"}`}>{o.active ? "Active" : "Inactive"}</span>
              </h3>
              <p className="adm-row-text">{o.description}</p>
              <div className="adm-row-meta">
                <span><strong>{o.discount}% off</strong></span>
                {o.code && <span>Code <span className="adm-code">{o.code}</span></span>}
                <span className="tnum">Valid {o.validFrom || "—"} to {o.validTo || "—"}</span>
              </div>
            </div>
            <div className="adm-row-actions">
              <button className="adm-btn" onClick={() => onSave(o.id, { active: !o.active })}>{o.active ? "Deactivate" : "Activate"}</button>
              <button className="adm-btn" onClick={() => onEdit({ ...o })}>Edit</button>
              <button className="adm-btn danger" onClick={() => onRemove(o.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
      {offers.length === 0 && !creating && <Empty>No offers yet. Add one to show a discount on the home page.</Empty>}
    </>
  );
}
