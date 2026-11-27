import type { PackagePricing } from "@/lib/types";
import { PRICING_LIMITS } from "@/lib/pricing";

/** Editable form of a price grid: every cell is the raw input string. */
export interface PricingDraft {
  groupSizes: string[];
  rows: { name: string; prices: string[]; extraBed: string; childNoBed: string }[];
}

const str = (n: number | null | undefined) => (typeof n === "number" ? String(n) : "");

export const EMPTY_PRICING_DRAFT: PricingDraft = { groupSizes: [], rows: [] };

/** The brochure layout most packages use: 2–12 pax, three hotel categories. */
const TEMPLATE: PricingDraft = {
  groupSizes: ["2", "4", "6", "8", "10", "12"],
  rows: ["3★ Budget", "3★ Deluxe", "4★ Deluxe"].map(name => ({ name, prices: Array(6).fill(""), extraBed: "", childNoBed: "" })),
};

export function toPricingDraft(p?: PackagePricing): PricingDraft {
  if (!p) return EMPTY_PRICING_DRAFT;
  return {
    groupSizes: p.groupSizes.map(String),
    rows: p.tiers.map(t => ({ name: t.name, prices: t.prices.map(str), extraBed: str(t.extraBed), childNoBed: str(t.childNoBed) })),
  };
}

const toNum = (s: string): number | null => (s.trim() === "" ? null : Number(s));

/**
 * Draft → API value. `undefined` when the grid is empty (no categories). The server
 * validates the rest (increasing group sizes, whole rupees, unique names) and the admin
 * shows its message if a value is wrong.
 */
export function fromPricingDraft(d: PricingDraft): PackagePricing | undefined {
  const rows = d.rows.filter(r => r.name.trim() || r.prices.some(p => p.trim()));
  if (rows.length === 0 || d.groupSizes.length === 0) return undefined;
  return {
    groupSizes: d.groupSizes.map(s => Number(s)),
    tiers: rows.map(r => {
      const extraBed = toNum(r.extraBed);
      const childNoBed = toNum(r.childNoBed);
      return {
        name: r.name.trim(),
        prices: r.prices.map(toNum),
        ...(extraBed !== null ? { extraBed } : {}),
        ...(childNoBed !== null ? { childNoBed } : {}),
      };
    }),
  };
}

/** Lowest rate typed into the grid, or null. */
export function lowestDraftRate(d: PricingDraft): number | null {
  let min: number | null = null;
  for (const r of d.rows) for (const p of r.prices) {
    const n = toNum(p);
    if (n !== null && Number.isFinite(n) && (min === null || n < min)) min = n;
  }
  return min;
}

/**
 * N-22: price grid editor — hotel categories (rows) × group sizes (columns), plus extra bed
 * and child-without-bed rates, as on the client's brochures.
 */
export default function PricingEditor({ value, onChange }: { value: PricingDraft; onChange: (d: PricingDraft) => void }) {
  const { groupSizes, rows } = value;
  const set = (patch: Partial<PricingDraft>) => onChange({ ...value, ...patch });
  const setRow = (i: number, patch: Partial<PricingDraft["rows"][number]>) =>
    set({ rows: rows.map((r, j) => (j === i ? { ...r, ...patch } : r)) });

  const addColumn = () => {
    const last = Number(groupSizes[groupSizes.length - 1]) || 0;
    set({ groupSizes: [...groupSizes, String(last ? last + 2 : 2)], rows: rows.map(r => ({ ...r, prices: [...r.prices, ""] })) });
  };
  const removeColumn = (c: number) =>
    set({ groupSizes: groupSizes.filter((_, i) => i !== c), rows: rows.map(r => ({ ...r, prices: r.prices.filter((_, i) => i !== c) })) });
  const addRow = () =>
    set({ groupSizes: groupSizes.length ? groupSizes : ["2"], rows: [...rows, { name: "", prices: Array(Math.max(groupSizes.length, 1)).fill(""), extraBed: "", childNoBed: "" }] });
  const moveRow = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= rows.length) return;
    const next = [...rows];
    [next[i], next[j]] = [next[j], next[i]];
    set({ rows: next });
  };

  if (rows.length === 0) {
    return (
      <div className="adm-pricing-empty">
        <p>No pricing options. The package uses the single price above for everyone.</p>
        <div className="adm-pricing-tools">
          <button type="button" className="adm-btn" onClick={() => onChange(TEMPLATE)}>Start from brochure layout (2–12 pax)</button>
          <button type="button" className="adm-btn" onClick={addRow}>Add hotel category</button>
        </div>
      </div>
    );
  }

  return (
    <div className="adm-pricing">
      <div className="adm-pricing-scroll">
        <table className="adm-pricing-table">
          <thead>
            <tr>
              <th scope="col" className="adm-pricing-name">Hotel category</th>
              {groupSizes.map((g, c) => (
                <th key={c} scope="col">
                  <div className="adm-pricing-col">
                    <input aria-label={`Group size, column ${c + 1}`} type="number" min={1} max={PRICING_LIMITS.maxTravelers} value={g}
                      onChange={e => set({ groupSizes: groupSizes.map((x, i) => (i === c ? e.target.value : x)) })} />
                    <span>pax</span>
                    {groupSizes.length > 1 && (
                      <button type="button" className="adm-pricing-x" aria-label={`Remove ${g} pax column`} onClick={() => removeColumn(c)}>×</button>
                    )}
                  </div>
                </th>
              ))}
              <th scope="col">Extra bed</th>
              <th scope="col">Child no bed</th>
              <th scope="col"><span className="adm-sr">Row actions</span></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td className="adm-pricing-name">
                  <input aria-label={`Hotel category ${i + 1} name`} value={r.name} placeholder="e.g. 3★ Deluxe" maxLength={PRICING_LIMITS.maxTierName}
                    onChange={e => setRow(i, { name: e.target.value })} />
                </td>
                {r.prices.map((p, c) => (
                  <td key={c}>
                    <input aria-label={`${r.name || `Category ${i + 1}`}, ${groupSizes[c]} pax, price per person`} type="number" min={0} value={p} placeholder="—"
                      onChange={e => setRow(i, { prices: r.prices.map((x, k) => (k === c ? e.target.value : x)) })} />
                  </td>
                ))}
                <td><input aria-label={`${r.name || `Category ${i + 1}`}, extra bed`} type="number" min={0} value={r.extraBed} placeholder="—" onChange={e => setRow(i, { extraBed: e.target.value })} /></td>
                <td><input aria-label={`${r.name || `Category ${i + 1}`}, child no bed`} type="number" min={0} value={r.childNoBed} placeholder="—" onChange={e => setRow(i, { childNoBed: e.target.value })} /></td>
                <td className="adm-pricing-actions">
                  <button type="button" className="adm-pricing-x" aria-label={`Move ${r.name || "row"} up`} disabled={i === 0} onClick={() => moveRow(i, -1)}>↑</button>
                  <button type="button" className="adm-pricing-x" aria-label={`Move ${r.name || "row"} down`} disabled={i === rows.length - 1} onClick={() => moveRow(i, 1)}>↓</button>
                  <button type="button" className="adm-pricing-x" aria-label={`Remove ${r.name || "row"}`} onClick={() => set({ rows: rows.filter((_, j) => j !== i) })}>×</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="adm-pricing-tools">
        <button type="button" className="adm-btn" onClick={addRow} disabled={rows.length >= PRICING_LIMITS.maxTiers}>Add hotel category</button>
        <button type="button" className="adm-btn" onClick={addColumn} disabled={groupSizes.length >= PRICING_LIMITS.maxGroupSizes}>Add group size</button>
        <button type="button" className="adm-btn danger" onClick={() => onChange(EMPTY_PRICING_DRAFT)}>Remove all pricing options</button>
      </div>
      <p className="adm-pricing-help">
        Per-person rates in ₹. A group pays the rate of the largest column not above its size (5 travellers → 4 pax).
        Leave a cell empty if that option is not offered. Customers choose the hotel category when booking.
      </p>
    </div>
  );
}
