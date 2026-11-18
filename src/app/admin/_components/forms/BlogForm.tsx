import { useState } from "react";

import type { BlogPost } from "@/lib/types";

export default function BlogForm({ blog, onSave, onCancel }: { blog?: BlogPost; onSave: (b: Omit<BlogPost, "id" | "createdAt">) => void; onCancel: () => void }) {
  const [title, setTitle] = useState(blog?.title || "");
  const [excerpt, setExcerpt] = useState(blog?.excerpt || "");
  const [content, setContent] = useState(blog?.content || "");
  const [blogImage, setBlogImage] = useState(blog?.image || "");
  const [category, setCategory] = useState(blog?.category || "travel");
  const [author, setAuthor] = useState(blog?.author || "");
  const [active, setActive] = useState(blog?.active ?? true);

  return (
    // Native validation: required fields block Save and show the browser message; Enter saves.
    <form onSubmit={e => e.preventDefault()}>
      <h3 className="modal-title">{blog ? "Edit Blog Post" : "New Blog Post"}</h3>
      <div className="adm-form">
        <label className="adm-fl full"><span>Title *</span><input required value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Top 10 Spiritual Destinations in India" /></label>
        <label className="adm-fl"><span>Author</span><input value={author} onChange={e => setAuthor(e.target.value)} placeholder="e.g. Atlas Tours Team" /></label>
        <label className="adm-fl"><span>Category</span><input value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. travel, tips, spiritual" /></label>
        <label className="adm-fl"><span>Image URL</span><input value={blogImage} onChange={e => setBlogImage(e.target.value)} placeholder="/images/blog/post.jpg" /></label>
        <div className="adm-check-cell">
          <label className="adm-check"><input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} /> Active</label>
        </div>
        <label className="adm-fl full"><span>Excerpt</span><textarea value={excerpt} onChange={e => setExcerpt(e.target.value)} placeholder="Short description for listing..." /></label>
        <label className="adm-fl full"><span>Content</span><textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Full blog post content..." style={{ minHeight: 150 }} /></label>
      </div>
      <div className="adm-actions">
        <button type="submit" className="adm-btn primary" onClick={() => title.trim() && onSave({ title: title.trim(), excerpt, content, image: blogImage, category, author, active })}>Save</button>
        <button type="button" className="adm-btn" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
