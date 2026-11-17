import type { FAQ } from "@/lib/types";

import type { EntityTabProps } from "../_lib/crud";
import FaqForm from "./forms/FaqForm";
import { Modal, TabHeader } from "./shared";

export default function FaqsTab({ items: faqs, editing, creating, onAdd, onEdit, onClose, onCreate, onSave, onRemove }: EntityTabProps<FAQ>) {
  return (
    <>
      <TabHeader title="FAQs" addLabel="+ Add FAQ" onAdd={onAdd} />
      {(creating || editing) && (
        <Modal onClose={onClose}>
          <FaqForm
            faq={editing || undefined}
            onSave={(data) => editing ? onSave(editing.id, { ...data, questionHi: data.questionHi ?? null, answerHi: data.answerHi ?? null }) : onCreate(data)}
            onCancel={onClose}
          />
        </Modal>
      )}
      {[...faqs].sort((a, b) => a.order - b.order).map(f => (
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
            <button className="adm-btn" onClick={() => onSave(f.id, { active: !f.active })}>{f.active ? "Deactivate" : "Activate"}</button>
            <button className="adm-btn" onClick={() => onEdit({ ...f })}>Edit</button>
            <button className="adm-btn danger" onClick={() => onRemove(f.id)}>Del</button>
          </div>
        </div>
      ))}
      {faqs.length === 0 && !creating && <p style={{ textAlign: "center", color: "#8a8070", marginTop: 40 }}>No FAQs yet.</p>}
    </>
  );
}
