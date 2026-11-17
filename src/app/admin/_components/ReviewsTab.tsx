import type { Review } from "@/lib/types";

import type { EntityTabProps } from "../_lib/crud";
import ReviewForm from "./forms/ReviewForm";
import { Modal, TabHeader } from "./shared";

export default function ReviewsTab({ items: reviews, editing, creating, onAdd, onEdit, onClose, onCreate, onSave, onRemove }: EntityTabProps<Review>) {
  return (
    <>
      <TabHeader title="Reviews" addLabel="+ Add Review" onAdd={onAdd} />
      {(creating || editing) && (
        <Modal onClose={onClose}>
          <ReviewForm
            review={editing || undefined}
            onSave={(data) => editing ? onSave(editing.id, { ...data, packageName: data.packageName || null }) : onCreate(data)}
            onCancel={onClose}
          />
        </Modal>
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
            <button className="adm-btn" onClick={() => onSave(r.id, { active: !r.active })}>{r.active ? "Deactivate" : "Activate"}</button>
            <button className="adm-btn" onClick={() => onEdit({ ...r })}>Edit</button>
            <button className="adm-btn danger" onClick={() => onRemove(r.id)}>Del</button>
          </div>
        </div>
      ))}
      {reviews.length === 0 && !creating && <p style={{ textAlign: "center", color: "#8a8070", marginTop: 40 }}>No reviews yet.</p>}
    </>
  );
}
