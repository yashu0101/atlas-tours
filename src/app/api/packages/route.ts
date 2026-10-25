import { NextRequest, NextResponse } from "next/server";
import { getPackages, addPackage, updatePackage, deletePackage } from "@/lib/db";
import { verifySession } from "@/lib/auth";

export async function GET() {
  return NextResponse.json(await getPackages());
}

export async function POST(req: NextRequest) {
  const s = await verifySession(); if (!s.authenticated) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  body.id = body.id || crypto.randomUUID();
  return NextResponse.json(await addPackage(body));
}

export async function PATCH(req: NextRequest) {
  const s = await verifySession(); if (!s.authenticated) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, ...updates } = await req.json();
  const result = await updatePackage(id, updates);
  return result ? NextResponse.json(result) : NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function DELETE(req: NextRequest) {
  const s = await verifySession(); if (!s.authenticated) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json();
  return NextResponse.json({ success: await deletePackage(id) });
}
