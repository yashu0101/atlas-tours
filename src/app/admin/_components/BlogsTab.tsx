import type { BlogPost } from "@/lib/types";

import type { EntityTabProps } from "../_lib/crud";
import BlogForm from "./forms/BlogForm";
import { Modal, TabHeader } from "./shared";

export default function BlogsTab({ items: blogs, editing, creating, onAdd, onEdit, onClose, onCreate, onSave, onRemove }: EntityTabProps<BlogPost>) {
  return (
    <>
      <TabHeader title="Blog Posts" addLabel="+ Add Post" onAdd={onAdd} />
      {(creating || editing) && (
        <Modal onClose={onClose}>
          <BlogForm
            blog={editing || undefined}
            onSave={(data) => editing ? onSave(editing.id, data) : onCreate(data)}
            onCancel={onClose}
          />
        </Modal>
      )}
      {blogs.map(b => (
        <div key={b.id} className="adm-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              {b.title}
              <span className={`badge ${b.active ? "badge-active" : "badge-inactive"}`}>{b.active ? "Active" : "Inactive"}</span>
            </h3>
            <p style={{ color: "#8a8070", fontSize: ".88rem", margin: "4px 0" }}>{b.excerpt}</p>
            <p style={{ fontSize: ".82rem", color: "#E67E22" }}>By {b.author} | {b.category}</p>
          </div>
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            <button className="adm-btn" onClick={() => onSave(b.id, { active: !b.active })}>{b.active ? "Deactivate" : "Activate"}</button>
            <button className="adm-btn" onClick={() => onEdit({ ...b })}>Edit</button>
            <button className="adm-btn danger" onClick={() => onRemove(b.id)}>Del</button>
          </div>
        </div>
      ))}
      {blogs.length === 0 && !creating && <p style={{ textAlign: "center", color: "#8a8070", marginTop: 40 }}>No blog posts yet.</p>}
    </>
  );
}
