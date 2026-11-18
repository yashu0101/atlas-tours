import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, beforeEach } from "vitest";
import { setSqlClientForTests, type SqlClient } from "@/lib/db";
import { initDB } from "@/lib/db-schema";

type Row = Record<string, unknown>;

/** A lazy query, like neon's NeonQueryPromise: it only runs when awaited (or passed to `transaction`). */
interface LazyQuery extends PromiseLike<Row[]> {
  readonly text: string;
  readonly params: unknown[];
}

/** What the shim exposes: neon's tagged template, `.query(text, params)` and `.transaction([...])`. */
export interface PgliteSql extends SqlClient {
  (strings: TemplateStringsArray, ...params: unknown[]): LazyQuery;
  query(text: string, params?: unknown[]): LazyQuery;
  transaction(queries: LazyQuery[] | ((sql: PgliteSql) => LazyQuery[])): Promise<Row[][]>;
}

/**
 * Gives an in-process PGlite database the interface of `neon()` from
 * `@neondatabase/serverless` (HTTP driver), as far as this app uses it:
 *  - sql`SELECT … ${v}` — tagged template; values become $1, $2 … bound parameters;
 *  - sql.query(text, params) — numbered placeholders;
 *  - sql.transaction([q1, q2]) — runs the (lazy) queries in one transaction and returns
 *    an array of row arrays; any failure rolls the whole batch back.
 * Every query resolves to a plain rows array, like neon's default (non-fullResults) mode.
 */
export function createPgliteSql(db: PGlite): PgliteSql {
  const lazy = (text: string, params: unknown[]): LazyQuery => {
    let running: Promise<Row[]> | undefined;
    const run = () => (running ??= db.query<Row>(text, params).then(r => r.rows));
    return { text, params, then: (ok, fail) => run().then(ok, fail) };
  };
  const sql = ((strings: TemplateStringsArray, ...values: unknown[]) =>
    lazy(strings.reduce((acc, s, i) => acc + `$${i}` + s), values)) as PgliteSql;
  sql.query = (text, params = []) => lazy(text, params);
  sql.transaction = async queries => {
    const list = typeof queries === "function" ? queries(sql) : queries;
    return db.transaction(async tx => {
      const out: Row[][] = [];
      for (const q of list) out.push((await tx.query<Row>(q.text, q.params)).rows);
      return out;
    });
  };
  return sql;
}

/**
 * Vitest hooks for a Postgres-backed test file: one PGlite instance per file, an empty
 * `public` schema before every test (then `initDB` unless `init: false`), and db.ts routed
 * to it through `setSqlClientForTests`. Nothing touches the network or data/db.json.
 */
export function setupPgDb(opts: { init?: boolean } = {}) {
  const ctx = {} as { db: PGlite; sql: PgliteSql };
  beforeAll(async () => {
    ctx.db = new PGlite();
    ctx.sql = createPgliteSql(ctx.db);
    setSqlClientForTests(ctx.sql);
  });
  beforeEach(async () => {
    await ctx.db.exec("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
    if (opts.init !== false) await initDB(ctx.sql as unknown as Parameters<typeof initDB>[0]);
  });
  afterAll(async () => {
    setSqlClientForTests(null);
    await ctx.db.close();
  });
  return ctx;
}

/** True if `s` is a canonical ISO-8601 UTC timestamp (what `Date#toISOString` produces). */
export const isIsoString = (s: unknown) => typeof s === "string" && !Number.isNaN(Date.parse(s)) && new Date(s).toISOString() === s;
