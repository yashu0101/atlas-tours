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
    <div>
      <h3 style={{ margin: "0 0 16px", fontWeight: 600, color: "#E67E22" }}>{blog ? "Edit Blog Post" : "New Blog Post"}</h3>
      <div className="adm-form">
        <div className="full"><label>Title *</label><input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Top 10 Spiritual Destinations in India" /></div>
        <div><label>Author</label><input value={author} onChange={e => setAuthor(e.target.value)} placeholder="e.g. Atlas Tours Team" /></div>
        <div><label>Category</label><input value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. travel, tips, spiritual" /></div>
        <div><label>Image URL</label><input value={blogImage} onChange={e => setBlogImage(e.target.value)} placeholder="/images/blog/post.jpg" /></div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, paddingTop: 20 }}>
          <label style={{ display: "flex", gap: 6, alignItems: "center" }}><input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} /> Active</label>
        </div>
        <div className="full"><label>Excerpt</label><textarea value={excerpt} onChange={e => setExcerpt(e.target.value)} placeholder="Short description for listing..." /></div>
        <div className="full"><label>Content</label><textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Full blog post content..." style={{ minHeight: 150 }} /></div>
      </div>
      <div className="adm-actions">
        <button className="adm-btn primary" onClick={() => title.trim() && onSave({ title: title.trim(), excerpt, content, image: blogImage, category, author, active })}>Save</button>
        <button className="adm-btn" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
