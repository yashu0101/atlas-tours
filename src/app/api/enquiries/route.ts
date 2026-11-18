import { NextResponse } from "next/server";
import { getEnquiries, updateEnquiryStatus, deleteEnquiry } from "@/lib/db";
import { Enquiry } from "@/lib/types";
import { audit } from "@/lib/audit";
import { notFound, oneOf, readJson, requireAdmin, requireId, withHandler } from "@/lib/api";

// Runtime copy of Enquiry["status"]; `satisfies` keeps it in sync with types.ts.
const ENQUIRY_STATUSES = Object.keys({ new: 1, contacted: 1, confirmed: 1, cancelled: 1 } satisfies Record<Enquiry["status"], 1>) as Enquiry["status"][];

export const GET = withHandler(async () => {
  await requireAdmin();
  return NextResponse.json(await getEnquiries());
});

export const PATCH = withHandler(async (req) => {
  const admin = await requireAdmin();
  const body = await readJson(req);
  const id = requireId(body);
  const status = oneOf(body.status, ENQUIRY_STATUSES, "status");
  const result = await updateEnquiryStatus(id, status);
  if (!result) throw notFound();
  await audit(admin, "update", { entity: "enquiries", entityId: id, fields: ["status"] });
  return NextResponse.json(result);
});

export const DELETE = withHandler(async (req) => {
  const admin = await requireAdmin();
  const id = requireId(await readJson(req));
  if (!(await deleteEnquiry(id))) throw notFound();
  await audit(admin, "delete", { entity: "enquiries", entityId: id });
  return NextResponse.json({ success: true });
});
