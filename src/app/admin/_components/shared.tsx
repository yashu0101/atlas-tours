import type { ReactNode } from "react";

// Title row of a content tab with its "+ Add …" button.
export function TabHeader({ title, addLabel, onAdd }: { title: string; addLabel: string; onAdd: () => void }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
      <h2 style={{ margin: 0, fontWeight: 600, color: "#E67E22" }}>{title}</h2>
      <button className="adm-btn primary" onClick={onAdd}>{addLabel}</button>
    </div>
  );
}

// Overlay that closes when the backdrop (not the content) is clicked.
export function Modal({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content">
        {children}
      </div>
    </div>
  );
}
