import { NextRequest, NextResponse } from "next/server";
import { addEnquiry } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.name || !body.phone) return NextResponse.json({ error: "Name and phone required" }, { status: 400 });
  const enquiry = await addEnquiry(body);
  return NextResponse.json(enquiry);
}
