import { NextRequest, NextResponse } from "next/server";
import { getReviews, addReview, updateReview, deleteReview } from "@/lib/db";
import { verifySession } from "@/lib/auth";

export async function GET() { return NextResponse.json(await getReviews()); }

export async function POST(req: NextRequest) {
  const s = await verifySession(); if (!s.authenticated) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await addReview(await req.json()));
}

export async function PATCH(req: NextRequest) {
  const s = await verifySession(); if (!s.authenticated) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, ...u } = await req.json();
  const r = await updateReview(id, u); return r ? NextResponse.json(r) : NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function DELETE(req: NextRequest) {
  const s = await verifySession(); if (!s.authenticated) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json(); return NextResponse.json({ success: await deleteReview(id) });
}
