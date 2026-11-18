import type { GalleryImage } from "@/lib/types";

import type { EntityTabProps } from "../_lib/crud";
import GalleryForm from "./forms/GalleryForm";
import { Empty, Modal, TabHeader } from "./shared";

export default function GalleryTab({ items: gallery, editing, creating, onAdd, onEdit, onClose, onCreate, onSave, onRemove }: EntityTabProps<GalleryImage>) {
  return (
    <>
      <TabHeader title="Gallery" description="Photos shown in the website gallery" addLabel="Add image" onAdd={onAdd} />
      {(creating || editing) && (
        <Modal onClose={onClose}>
          <GalleryForm
            image={editing || undefined}
            onSave={(data) => editing ? onSave(editing.id, data) : onCreate(data)}
            onCancel={onClose}
          />
        </Modal>
      )}
      <div className="adm-gallery">
        {gallery.map(img => (
          <div key={img.id} className={`adm-card${img.active ? "" : " is-hidden"}`}>
            <img src={img.src} alt={img.caption} />
            <div className="adm-gallery-body">
              <div className="adm-row-title" style={{ margin: 0 }}>
                {img.caption || "Untitled"}
                <span className={`badge ${img.active ? "badge-active" : "badge-inactive"}`}>{img.active ? "Active" : "Inactive"}</span>
              </div>
              <span className="adm-sub" style={{ textTransform: "capitalize" }}>{img.category}</span>
              <div className="adm-row-actions">
                <button className="adm-btn" onClick={() => onSave(img.id, { active: !img.active })}>{img.active ? "Hide" : "Show"}</button>
                <button className="adm-btn" onClick={() => onEdit({ ...img })}>Edit</button>
                <button className="adm-btn danger" onClick={() => onRemove(img.id)}>Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {gallery.length === 0 && !creating && <Empty>No gallery images yet.</Empty>}
    </>
  );
}
