import { NextRequest, NextResponse } from "next/server";
import { getEnquiries, updateEnquiryStatus, deleteEnquiry } from "@/lib/db";
import { verifySession } from "@/lib/auth";

export async function GET() {
  const s = await verifySession(); if (!s.authenticated) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await getEnquiries());
}

export async function PATCH(req: NextRequest) {
  const s = await verifySession(); if (!s.authenticated) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, status } = await req.json();
  const result = await updateEnquiryStatus(id, status);
  return result ? NextResponse.json(result) : NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function DELETE(req: NextRequest) {
  const s = await verifySession(); if (!s.authenticated) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json();
  return NextResponse.json({ success: await deleteEnquiry(id) });
}
