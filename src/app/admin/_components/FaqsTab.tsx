import type { FAQ } from "@/lib/types";

import type { EntityTabProps } from "../_lib/crud";
import FaqForm from "./forms/FaqForm";
import { Empty, Modal, TabHeader } from "./shared";

export default function FaqsTab({ items: faqs, editing, creating, onAdd, onEdit, onClose, onCreate, onSave, onRemove }: EntityTabProps<FAQ>) {
  return (
    <>
      <TabHeader title="FAQs" description="Questions shown on the website, in this order" addLabel="Add FAQ" onAdd={onAdd} />
      {(creating || editing) && (
        <Modal onClose={onClose}>
          <FaqForm
            faq={editing || undefined}
            onSave={(data) => editing ? onSave(editing.id, { ...data, questionHi: data.questionHi ?? null, answerHi: data.answerHi ?? null }) : onCreate(data)}
            onCancel={onClose}
          />
        </Modal>
      )}
      <div className="adm-list">
        {[...faqs].sort((a, b) => a.order - b.order).map(f => (
          <div key={f.id} className="adm-card adm-row">
            <div className="adm-row-main">
              <h3 className="adm-row-title">
                <span className="adm-order tnum" title="Display order">{f.order}</span>
                {f.question}
                <span className={`badge ${f.active ? "badge-active" : "badge-inactive"}`}>{f.active ? "Active" : "Inactive"}</span>
              </h3>
              <p className="adm-row-text">{f.answer}</p>
              {f.questionHi && <p className="adm-hi">HI: {f.questionHi}</p>}
            </div>
            <div className="adm-row-actions">
              <button className="adm-btn" onClick={() => onSave(f.id, { active: !f.active })}>{f.active ? "Deactivate" : "Activate"}</button>
              <button className="adm-btn" onClick={() => onEdit({ ...f })}>Edit</button>
              <button className="adm-btn danger" onClick={() => onRemove(f.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
      {faqs.length === 0 && !creating && <Empty>No FAQs yet.</Empty>}
    </>
  );
}
