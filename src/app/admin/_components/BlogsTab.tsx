import type { BlogPost } from "@/lib/types";

import type { EntityTabProps } from "../_lib/crud";
import BlogForm from "./forms/BlogForm";
import { Empty, Modal, TabHeader } from "./shared";

export default function BlogsTab({ items: blogs, editing, creating, onAdd, onEdit, onClose, onCreate, onSave, onRemove }: EntityTabProps<BlogPost>) {
  return (
    <>
      <TabHeader title="Blog posts" description="Articles shown in the website's blog section" addLabel="Add post" onAdd={onAdd} />
      {(creating || editing) && (
        <Modal onClose={onClose}>
          <BlogForm
            blog={editing || undefined}
            onSave={(data) => editing ? onSave(editing.id, data) : onCreate(data)}
            onCancel={onClose}
          />
        </Modal>
      )}
      <div className="adm-list">
        {blogs.map(b => (
          <div key={b.id} className="adm-card adm-row">
            <div className="adm-row-main">
              <h3 className="adm-row-title">
                {b.title}
                <span className={`badge ${b.active ? "badge-active" : "badge-inactive"}`}>{b.active ? "Active" : "Inactive"}</span>
              </h3>
              <p className="adm-row-text">{b.excerpt}</p>
              <div className="adm-row-meta">
                {b.author && <span>By <strong>{b.author}</strong></span>}
                {b.category && <span style={{ textTransform: "capitalize" }}>{b.category}</span>}
              </div>
            </div>
            <div className="adm-row-actions">
              <button className="adm-btn" onClick={() => onSave(b.id, { active: !b.active })}>{b.active ? "Deactivate" : "Activate"}</button>
              <button className="adm-btn" onClick={() => onEdit({ ...b })}>Edit</button>
              <button className="adm-btn danger" onClick={() => onRemove(b.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
      {blogs.length === 0 && !creating && <Empty>No blog posts yet.</Empty>}
    </>
  );
}
