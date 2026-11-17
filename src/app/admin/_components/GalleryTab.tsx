import type { GalleryImage } from "@/lib/types";

import type { EntityTabProps } from "../_lib/crud";
import GalleryForm from "./forms/GalleryForm";
import { Modal, TabHeader } from "./shared";

export default function GalleryTab({ items: gallery, editing, creating, onAdd, onEdit, onClose, onCreate, onSave, onRemove }: EntityTabProps<GalleryImage>) {
  return (
    <>
      <TabHeader title="Gallery" addLabel="+ Add Image" onAdd={onAdd} />
      {(creating || editing) && (
        <Modal onClose={onClose}>
          <GalleryForm
            image={editing || undefined}
            onSave={(data) => editing ? onSave(editing.id, data) : onCreate(data)}
            onCancel={onClose}
          />
        </Modal>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 16 }}>
        {gallery.map(img => (
          <div key={img.id} className="adm-card" style={{ padding: 0, overflow: "hidden" }}>
            <img src={img.src} alt={img.caption} style={{ width: "100%", height: 160, objectFit: "cover" }} />
            <div style={{ padding: 16 }}>
              <h3 style={{ display: "flex", gap: 8, alignItems: "center", fontSize: ".9rem", flexWrap: "wrap" }}>
                {img.caption || "Untitled"}
                <span className={`badge ${img.active ? "badge-active" : "badge-inactive"}`}>{img.active ? "Active" : "Inactive"}</span>
              </h3>
              <p style={{ fontSize: ".8rem", color: "#8a8070", margin: "4px 0" }}>Category: {img.category}</p>
              <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                <button className="adm-btn" onClick={() => onSave(img.id, { active: !img.active })}>{img.active ? "Hide" : "Show"}</button>
                <button className="adm-btn" onClick={() => onEdit({ ...img })}>Edit</button>
                <button className="adm-btn danger" onClick={() => onRemove(img.id)}>Del</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {gallery.length === 0 && !creating && <p style={{ textAlign: "center", color: "#8a8070", marginTop: 40 }}>No gallery images yet.</p>}
    </>
  );
}
