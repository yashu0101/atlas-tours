import { useEffect, useId, useRef, type ReactNode } from "react";

import { showingLabel, type PageSlice } from "../_lib/table";
import { Icon } from "./icons";

// Title row of a tab: heading, one-line description, and either an "Add …" button or custom actions.
export function TabHeader({ title, description, addLabel, onAdd, children }: {
  title: string; description?: string; addLabel?: string; onAdd?: () => void; children?: ReactNode;
}) {
  return (
    <div className="adm-page-head">
      <div>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      <div className="adm-page-actions">
        {children}
        {addLabel && onAdd && <button className="adm-btn primary" onClick={onAdd}><Icon name="plus" size={16} />{addLabel}</button>}
      </div>
    </div>
  );
}

// Shown in place of a list when it has nothing to show.
export function Empty({ children }: { children: ReactNode }) {
  return <p className="adm-empty">{children}</p>;
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Dialog: focus moves in on open, Tab stays inside, focus returns to the opener on close.
// The ✕ button (and the form's Cancel) close straight away; Escape and a backdrop click are
// easy to hit by accident, so they ask first once something has been typed.
export function Modal({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const dirty = useRef(false);
  const close = useRef(onClose);
  useEffect(() => { close.current = onClose; });
  const closeIfConfirmed = () => {
    if (!dirty.current || confirm("Discard your unsaved changes?")) close.current();
  };
  const closeRef = useRef(closeIfConfirmed);
  useEffect(() => { closeRef.current = closeIfConfirmed; });
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    // Name the dialog after the form heading rendered inside it.
    const title = ref.current?.querySelector(".modal-title");
    if (title) { title.id = titleId; ref.current?.setAttribute("aria-labelledby", titleId); }
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); closeRef.current(); return; }
      if (e.key !== "Tab" || !ref.current) return;
      const items = [...ref.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(el => el.offsetParent !== null);
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === ref.current)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (active === last || !ref.current.contains(active))) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden"; // page behind doesn't scroll under the dialog
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      previous?.focus?.();
    };
  }, [titleId]);
  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) closeIfConfirmed(); }}>
      <div className="modal-content" role="dialog" aria-modal="true" tabIndex={-1} ref={ref} onInput={() => { dirty.current = true; }}>
        <button type="button" className="adm-btn ghost modal-close" aria-label="Close" onClick={onClose}><Icon name="close" /></button>
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
