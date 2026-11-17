import { NextResponse } from "next/server";
import { Body, FieldSpec, notFound, pickFields, readJson, requireAdmin, requireFields, requireId, wantsAll, withHandler } from "./api";

/**
 * Builds GET/POST/PATCH/DELETE handlers for an admin-managed content entity
 * (packages, reviews, gallery, blogs, faqs, offers).
 *
 * - GET is public and returns only `isPublic` items, unless an authenticated
 *   admin passes `?all=1` (B-05).
 * - POST/PATCH/DELETE require an admin session; the id travels in the JSON body.
 * - Writes are whitelisted against `fields`; ids are always generated server-side (B-10).
 * - Unknown ids on PATCH/DELETE are a 404 (B-03).
 * - PATCH only touches keys present in the body; a nullable field sent as `null`
 *   (or `""`) is cleared, and a `required` field cannot be blanked (B-07).
 */
export function crudRoute<T>(opts: {
  list: () => Promise<T[]>;
  add: (data: never) => Promise<T>;
  update: (id: string, data: never) => Promise<T | null>;
  remove: (id: string) => Promise<boolean>;
  isPublic: (item: T) => boolean;
  fields: FieldSpec;
  required: readonly string[];
  defaults?: Body;
}) {
  const GET = withHandler(async (req) => {
    const items = await opts.list();
    return NextResponse.json((await wantsAll(req)) ? items : items.filter(opts.isPublic));
  });

  const POST = withHandler(async (req) => {
    await requireAdmin();
    const data: Body = { ...opts.defaults, ...pickFields(await readJson(req), opts.fields) };
    // A cleared optional field on create simply means "not set".
    for (const k of Object.keys(data)) if (data[k] === null) delete data[k];
    requireFields(data, opts.required);
    return NextResponse.json(await opts.add(data as never));
  });

  const PATCH = withHandler(async (req) => {
    await requireAdmin();
    const body = await readJson(req);
    const id = requireId(body);
    const data = pickFields(body, opts.fields);
    requireFields(data, opts.required.filter((k) => k in data));
    const updated = await opts.update(id, data as never);
    if (!updated) throw notFound();
    return NextResponse.json(updated);
  });

  const DELETE = withHandler(async (req) => {
    await requireAdmin();
    const id = requireId(await readJson(req));
    if (!(await opts.remove(id))) throw notFound();
    return NextResponse.json({ success: true });
  });

  return { GET, POST, PATCH, DELETE };
}
