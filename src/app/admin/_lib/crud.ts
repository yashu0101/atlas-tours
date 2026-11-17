import { useState, type Dispatch, type SetStateAction } from "react";

import { deleteById, sendEntity, type Patch } from "./api";

type Entity = { id: string; createdAt: string };
export type Fields<T extends Entity> = Omit<T, "id" | "createdAt">;

// Create / update / delete against one entity route, updating the local list only on success.
// `label` is used in alerts ("Create package failed") and the delete confirm ("Delete this package?").
export function entityCrud<T extends Entity>(url: string, label: string, setItems: Dispatch<SetStateAction<T[]>>) {
  return {
    create: async (data: Fields<T>, onDone?: () => void) => {
      const created = await sendEntity<T>(url, "POST", data, label);
      if (!created) return;
      setItems(prev => [...prev, created]); onDone?.();
    },
    update: async (id: string, updates: Patch<Fields<T>>, onDone?: () => void) => {
      const updated = await sendEntity<T>(url, "PATCH", { id, ...updates }, label);
      if (!updated) return;
      setItems(prev => prev.map(x => x.id === id ? updated : x)); onDone?.();
    },
    remove: async (id: string) => {
      if (!confirm(`Delete this ${label}?`)) return;
      if (!(await deleteById(url, id, label))) return;
      setItems(prev => prev.filter(x => x.id !== id));
    },
  };
}

// Everything a content tab (list + add/edit modal) needs.
export type EntityTabProps<T extends Entity> = {
  items: T[];
  editing: T | null;
  creating: boolean;
  onAdd: () => void;
  onEdit: (item: T) => void;
  onClose: () => void;
  onCreate: (data: Fields<T>) => void;
  onSave: (id: string, updates: Patch<Fields<T>>) => void;
  onRemove: (id: string) => void;
};

// Modal state + CRUD for a content tab. Lives in the page (not the tab) so an open modal
// survives switching tabs. A successful create closes the "new" modal; a successful
// update (edit form or a list toggle) clears the edited item.
export function useEntityTab<T extends Entity>(
  url: string, label: string, items: T[], setItems: Dispatch<SetStateAction<T[]>>,
): EntityTabProps<T> {
  const [editing, setEditing] = useState<T | null>(null);
  const [creating, setCreating] = useState(false);
  const crud = entityCrud(url, label, setItems);
  return {
    items, editing, creating,
    onAdd: () => setCreating(true),
    onEdit: setEditing,
    onClose: () => { setCreating(false); setEditing(null); },
    onCreate: data => crud.create(data, () => setCreating(false)),
    onSave: (id, updates) => crud.update(id, updates, () => setEditing(null)),
    onRemove: crud.remove,
  };
}
