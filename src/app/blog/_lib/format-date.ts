// Shared deterministic date formatting (F-02). Lives in a private (`_lib`, non-route)
// folder so both client components (Blog, Offers) and the /blog/[id] server page can import it.

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
const IST_OFFSET_MS = 330 * 60 * 1000;

/**
 * Same output as toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
 * for an Indian visitor (e.g. "1 Jun 2024"), but computed by hand in IST so the server-rendered
 * text and the hydrated text can never differ by timezone or ICU version (F-02).
 * Date-only strings ("2025-12-31") parse as UTC midnight and therefore keep their calendar day.
 * Returns "" for unparseable input.
 */
export function formatISTDate(iso: string): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "";
  const d = new Date(t + IST_OFFSET_MS);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
