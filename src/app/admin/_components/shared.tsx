import type { ReactNode } from "react";

import { showingLabel, type PageSlice } from "../_lib/table";

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

// N-1: Prev / Next pager under a filtered table ("Showing 1–25 of 80").
export function Pager({ slice, onPage }: { slice: PageSlice<unknown>; onPage: (page: number) => void }) {
  return (
    <div className="adm-pager">
      <span>{showingLabel(slice)}</span>
      <div style={{ display: "flex", gap: 6 }}>
        <button className="adm-btn" disabled={slice.page <= 1} onClick={() => onPage(slice.page - 1)}>Prev</button>
        <button className="adm-btn" disabled={slice.page >= slice.pageCount} onClick={() => onPage(slice.page + 1)}>Next</button>
      </div>
    </div>
  );
}

// N-1: "Received from / to" date inputs (inclusive, IST calendar date; filtering is in _lib/table.ts).
export function ReceivedRange({ from, to, onChange }: {
  from: string; to: string; onChange: (range: { from: string; to: string }) => void;
}) {
  return (
    <>
      <label className="adm-field">Received from
        <input type="date" className="adm-input" value={from} max={to || undefined} onChange={e => onChange({ from: e.target.value, to })} />
      </label>
      <label className="adm-field">Received to
        <input type="date" className="adm-input" value={to} min={from || undefined} onChange={e => onChange({ from, to: e.target.value })} />
      </label>
    </>
  );
}

// Browser download of a generated CSV (the content already starts with the UTF-8 BOM).
export function downloadCsv(filename: string, csv: string) {
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
