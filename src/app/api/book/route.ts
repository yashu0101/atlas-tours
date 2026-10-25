import { NextRequest, NextResponse } from "next/server";
import { addBooking } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.name || !body.phone || !body.packageId) return NextResponse.json({ error: "Name, phone and package required" }, { status: 400 });
  const booking = await addBooking(body);
  return NextResponse.json(booking);
}
