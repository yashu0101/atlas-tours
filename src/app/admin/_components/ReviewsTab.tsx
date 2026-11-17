import { useState } from "react";

import type { Review } from "@/lib/types";

import type { EntityTabProps } from "../_lib/crud";
import {
  REVIEW_FILTERS, REVIEW_FILTER_LABELS, isAwaitingApproval, isReviewActive, newestFirst, reviewFilterCounts, reviewFilterMatches,
  type ReviewFilter,
} from "../_lib/table";
import ReviewForm from "./forms/ReviewForm";
import { Modal, TabHeader } from "./shared";

export default function ReviewsTab({ items: reviews, editing, creating, onAdd, onEdit, onClose, onCreate, onSave, onRemove }: EntityTabProps<Review>) {
  // N-5: customer reviews arrive inactive and wait here for approval.
  const [filter, setFilter] = useState<ReviewFilter>("all");
  const counts = reviewFilterCounts(reviews);
  const shown = newestFirst(reviews.filter(r => reviewFilterMatches(r, filter)));

  return (
    <>
      <TabHeader title="Reviews" addLabel="+ Add Review" onAdd={onAdd} />
      {(creating || editing) && (
        <Modal onClose={onClose}>
          <ReviewForm
            review={editing || undefined}
            onSave={(data) => editing ? onSave(editing.id, { ...data, packageName: data.packageName || null }) : onCreate(data)}
            onCancel={onClose}
          />
        </Modal>
      )}
      <div className="adm-chips" role="group" aria-label="Filter reviews">
        {REVIEW_FILTERS.map(f => (
          <button key={f} className={`adm-chip${filter === f ? " active" : ""}`} aria-pressed={filter === f} onClick={() => setFilter(f)}>
            {REVIEW_FILTER_LABELS[f]} <span className="adm-chip-count">{counts[f]}</span>
          </button>
        ))}
      </div>
      {shown.map(r => {
        const active = isReviewActive(r);
        const awaiting = isAwaitingApproval(r);
        return (
          <div key={r.id} className="adm-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 220 }}>
              <h3 style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                {r.name}
                <span style={{ color: "#E67E22", fontSize: ".9rem" }}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                {r.source === "customer" && <span className="badge badge-customer">Customer</span>}
                {awaiting
                  ? <span className="badge badge-pending">Awaiting approval</span>
                  : <span className={`badge ${active ? "badge-active" : "badge-inactive"}`}>{active ? "Active" : "Inactive"}</span>}
              </h3>
              <p style={{ color: "#8a8070", fontSize: ".88rem", margin: "4px 0", fontStyle: "italic", whiteSpace: "pre-wrap" }}>&ldquo;{r.text}&rdquo;</p>
              <p style={{ fontSize: ".82rem", color: "#E67E22" }}>{r.city}{r.packageName ? ` | ${r.packageName}` : ""}</p>
            </div>
            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
              {awaiting
                ? <button className="adm-btn primary" onClick={() => onSave(r.id, { active: true })}>Approve</button>
                : <button className="adm-btn" onClick={() => onSave(r.id, { active: !active })}>{active ? "Deactivate" : "Activate"}</button>}
              <button className="adm-btn" onClick={() => onEdit({ ...r })}>Edit</button>
              <button className="adm-btn danger" onClick={() => onRemove(r.id)}>Del</button>
            </div>
          </div>
        );
      })}
      {reviews.length === 0 && !creating && <p style={{ textAlign: "center", color: "#8a8070", marginTop: 40 }}>No reviews yet.</p>}
      {reviews.length > 0 && shown.length === 0 && (
        <p style={{ textAlign: "center", color: "#8a8070", marginTop: 40 }}>No reviews in &ldquo;{REVIEW_FILTER_LABELS[filter]}&rdquo;.</p>
      )}
    </>
  );
}
