import { useState } from "react";

import type { Review } from "@/lib/types";

import type { EntityTabProps } from "../_lib/crud";
import {
  REVIEW_FILTERS, REVIEW_FILTER_LABELS, isAwaitingApproval, isReviewActive, newestFirst, reviewFilterCounts, reviewFilterMatches,
  type ReviewFilter,
} from "../_lib/table";
import ReviewForm from "./forms/ReviewForm";
import { Empty, Modal, TabHeader } from "./shared";

export default function ReviewsTab({ items: reviews, editing, creating, onAdd, onEdit, onClose, onCreate, onSave, onRemove }: EntityTabProps<Review>) {
  // N-5: customer reviews arrive inactive and wait here for approval.
  const [filter, setFilter] = useState<ReviewFilter>("all");
  const counts = reviewFilterCounts(reviews);
  const shown = newestFirst(reviews.filter(r => reviewFilterMatches(r, filter)));

  return (
    <>
      <TabHeader title="Reviews" description="Customer reviews stay hidden until you approve them" addLabel="Add review" onAdd={onAdd} />
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
            {REVIEW_FILTER_LABELS[f]} <span className="adm-chip-count tnum">{counts[f]}</span>
          </button>
        ))}
      </div>
      <div className="adm-list">
        {shown.map(r => {
          const active = isReviewActive(r);
          const awaiting = isAwaitingApproval(r);
          return (
            <div key={r.id} className="adm-card adm-row">
              <div className="adm-row-main">
                <h3 className="adm-row-title">
                  {r.name}
                  <span className="adm-stars" role="img" aria-label={`${r.rating} out of 5 stars`}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                  {r.source === "customer" && <span className="badge badge-customer">Customer</span>}
                  {awaiting
                    ? <span className="badge badge-pending">Awaiting approval</span>
                    : <span className={`badge ${active ? "badge-active" : "badge-inactive"}`}>{active ? "Active" : "Inactive"}</span>}
                </h3>
                <p className="adm-row-text adm-quote">&ldquo;{r.text}&rdquo;</p>
                <div className="adm-row-meta">
                  {r.city && <span>{r.city}</span>}
                  {r.packageName && <span>{r.packageName}</span>}
                </div>
              </div>
              <div className="adm-row-actions">
                {awaiting
                  ? <button className="adm-btn primary" onClick={() => onSave(r.id, { active: true })}>Approve</button>
                  : <button className="adm-btn" onClick={() => onSave(r.id, { active: !active })}>{active ? "Deactivate" : "Activate"}</button>}
                <button className="adm-btn" onClick={() => onEdit({ ...r })}>Edit</button>
                <button className="adm-btn danger" onClick={() => onRemove(r.id)}>Delete</button>
              </div>
            </div>
          );
        })}
      </div>
      {reviews.length === 0 && !creating && <Empty>No reviews yet.</Empty>}
      {reviews.length > 0 && shown.length === 0 && <Empty>No reviews in &ldquo;{REVIEW_FILTER_LABELS[filter]}&rdquo;.</Empty>}
    </>
  );
}
