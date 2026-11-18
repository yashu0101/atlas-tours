import type { TourPackage } from "@/lib/types";

import type { EntityTabProps } from "../_lib/crud";
import PackageForm from "./forms/PackageForm";
import { Empty, Modal, TabHeader } from "./shared";

export default function PackagesTab({ items: packages, editing, creating, onAdd, onEdit, onClose, onCreate, onSave, onRemove }: EntityTabProps<TourPackage>) {
  const live = packages.filter(p => !p.hidden).length;
  return (
    <>
      <TabHeader title="Tour packages" description={`${live} of ${packages.length} shown on the website`} addLabel="Add package" onAdd={onAdd} />
      {(creating || editing) && (
        <Modal onClose={onClose}>
          <PackageForm
            pkg={editing || undefined}
            onSave={(data) => editing ? onSave(editing.id, { ...data, originalPrice: data.originalPrice ?? null }) : onCreate(data)}
            onCancel={onClose}
          />
        </Modal>
      )}
      <div className="adm-list">
        {packages.map(pkg => (
          <div key={pkg.id} className={`pkg-card${pkg.hidden ? " is-hidden" : ""}`}>
            <img src={pkg.image} alt={pkg.name} />
            <div className="pkg-info">
              <h4>
                {pkg.name}
                {pkg.hidden && <span className="badge badge-hidden">Hidden</span>}
              </h4>
              <div className="pkg-price">
                {"₹"}{pkg.price?.toLocaleString("en-IN")}
                {pkg.originalPrice ? <s>₹{pkg.originalPrice.toLocaleString("en-IN")}</s> : null}
              </div>
              <div className="adm-row-meta">
                {pkg.destination && <span>{pkg.destination}</span>}
                {pkg.duration && <span>{pkg.duration}</span>}
                <span style={{ textTransform: "capitalize" }}>{pkg.category}</span>
              </div>
            </div>
            <div className="pkg-actions">
              <button className="adm-btn" onClick={() => onSave(pkg.id, { hidden: !pkg.hidden })}>{pkg.hidden ? "Show" : "Hide"}</button>
              <button className="adm-btn" onClick={() => onEdit({ ...pkg })}>Edit</button>
              <button className="adm-btn danger" onClick={() => onRemove(pkg.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
      {packages.length === 0 && !creating && <Empty>No packages yet. Add your first tour package to show it on the website.</Empty>}
    </>
  );
}
