import { useEffect, useState } from "react";

import { INBOX_PAGE_SIZE, inboxQueryString, type ListPage } from "@/lib/inbox-filters";

import { reportFailure } from "./api";

/** Search typing is sent to the server this long after the last keystroke. */
export const SEARCH_DEBOUNCE_MS = 300;

export function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

/**
 * Review point #6: one page of the admin Bookings / Enquiries list, filtered and paginated by
 * the server (`GET <url>?q=…&page=…&pageSize=25` → `{ items, total, page, pageSize }`).
 * The search box is debounced; the other filters apply at once. `applied` is the filter set
 * the shown rows were requested with (what Export uses). `reload()` refetches the current page.
 */
export function useInboxPage<T, F extends Record<string, string> & { search: string }>(url: string, label: string, filters: F, page: number) {
  const search = useDebounced(filters.search, SEARCH_DEBOUNCE_MS);
  const applied: F = { ...filters, search };
  const query = inboxQueryString(applied, { page, pageSize: INBOX_PAGE_SIZE });
  const [data, setData] = useState<ListPage<T> | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const ctrl = new AbortController();
    fetch(url + query, { signal: ctrl.signal })
      .then(async res => {
        if (ctrl.signal.aborted) return;
        if (!res.ok) { await reportFailure(`Load ${label}`, res); return; }
        const body = (await res.json()) as ListPage<T>;
        if (!ctrl.signal.aborted) setData(body);
      })
      .catch(err => {
        if (ctrl.signal.aborted) return;
        console.error(`Load ${label} failed`, err);
        alert(`Load ${label} failed: could not reach the server. Check your internet connection and try again.`);
      });
    return () => ctrl.abort();
  }, [url, label, query, version]);

  return { data, applied, reload: () => setVersion(v => v + 1), setData };
}

/**
 * Downloads `<url>/export?<filters>` (server-built CSV, max 10,000 rows). Says so when the
 * server cut the file (X-Export-Truncated). Returns the file name and blob for the caller to save.
 */
export async function fetchExport(url: string, filters: Record<string, string>, label: string): Promise<{ filename: string; blob: Blob } | null> {
  const action = `Export ${label}`;
  let res: Response;
  try {
    res = await fetch(`${url}/export${inboxQueryString(filters)}`);
  } catch (err) {
    console.error(`${action} failed (network)`, err);
    alert(`${action} failed: could not reach the server. Check your internet connection and try again.`);
    return null;
  }
  if (!res.ok) { await reportFailure(action, res); return null; }
  const blob = await res.blob();
  const filename = /filename="([^"]+)"/.exec(res.headers.get("Content-Disposition") ?? "")?.[1] ?? `atlas-${label}.csv`;
  if (res.headers.get("X-Export-Truncated") === "true") {
    alert(`The export holds the newest ${res.headers.get("X-Export-Rows")} of ${res.headers.get("X-Total-Count")} matching ${label}. Narrow the filters (e.g. the received dates) to export the rest.`);
  }
  return { filename, blob };
}
