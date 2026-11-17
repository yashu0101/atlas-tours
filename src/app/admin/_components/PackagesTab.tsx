import type { TourPackage } from "@/lib/types";

import type { EntityTabProps } from "../_lib/crud";
import PackageForm from "./forms/PackageForm";
import { Modal, TabHeader } from "./shared";

export default function PackagesTab({ items: packages, editing, creating, onAdd, onEdit, onClose, onCreate, onSave, onRemove }: EntityTabProps<TourPackage>) {
  return (
    <>
      <TabHeader title="Tour Packages" addLabel="+ Add Package" onAdd={onAdd} />
      {(creating || editing) && (
        <Modal onClose={onClose}>
          <PackageForm
            pkg={editing || undefined}
            onSave={(data) => editing ? onSave(editing.id, { ...data, originalPrice: data.originalPrice ?? null }) : onCreate(data)}
            onCancel={onClose}
          />
        </Modal>
      )}
      {packages.map(pkg => (
        <div key={pkg.id} className="pkg-card">
          <img src={pkg.image} alt={pkg.name} />
          <div className="pkg-info">
            <h4>
              {pkg.name}{" "}
              {pkg.hidden && <span className="badge badge-hidden">Hidden</span>}
            </h4>
            <p>{pkg.destination} | {pkg.duration} | {"₹"}{pkg.price?.toLocaleString()}{pkg.originalPrice ? ` (was ₹${pkg.originalPrice.toLocaleString()})` : ""}</p>
            <p style={{ marginTop: 4 }}>Category: {pkg.category}</p>
          </div>
          <div className="pkg-actions">
            <button className="adm-btn" onClick={() => onSave(pkg.id, { hidden: !pkg.hidden })}>{pkg.hidden ? "Show" : "Hide"}</button>
            <button className="adm-btn" onClick={() => onEdit({ ...pkg })}>Edit</button>
            <button className="adm-btn danger" onClick={() => onRemove(pkg.id)}>Del</button>
          </div>
        </div>
      ))}
      {packages.length === 0 && !creating && <p style={{ textAlign: "center", color: "#8a8070", marginTop: 40 }}>No packages yet.</p>}
    </>
  );
}
