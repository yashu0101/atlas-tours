import { NextResponse } from "next/server";
import { getBookings, updateBooking, deleteBooking } from "@/lib/db";
import { Booking } from "@/lib/types";
import { badRequest, notFound, oneOf, readJson, requireAdmin, requireId, withHandler } from "@/lib/api";

// Runtime copies of the status unions in types.ts; `satisfies` makes the compiler
// flag any value added to or removed from the type but not here.
const PAYMENT_STATUSES = Object.keys({ pending: 1, paid: 1, failed: 1, refunded: 1 } satisfies Record<Booking["paymentStatus"], 1>) as Booking["paymentStatus"][];
const BOOKING_STATUSES = Object.keys({ pending: 1, confirmed: 1, completed: 1, cancelled: 1 } satisfies Record<Booking["bookingStatus"], 1>) as Booking["bookingStatus"][];

export const GET = withHandler(async () => {
  await requireAdmin();
  return NextResponse.json(await getBookings());
});

export const PATCH = withHandler(async (req) => {
  await requireAdmin();
  const body = await readJson(req);
  const id = requireId(body);
  const updates: Partial<Pick<Booking, "paymentStatus" | "bookingStatus">> = {};
  if (body.paymentStatus !== undefined) updates.paymentStatus = oneOf(body.paymentStatus, PAYMENT_STATUSES, "paymentStatus");
  if (body.bookingStatus !== undefined) updates.bookingStatus = oneOf(body.bookingStatus, BOOKING_STATUSES, "bookingStatus");
  if (!updates.paymentStatus && !updates.bookingStatus) throw badRequest("Provide paymentStatus and/or bookingStatus");
  const result = await updateBooking(id, updates);
  if (!result) throw notFound();
  return NextResponse.json(result);
});

export const DELETE = withHandler(async (req) => {
  await requireAdmin();
  const id = requireId(await readJson(req));
  if (!(await deleteBooking(id))) throw notFound();
  return NextResponse.json({ success: true });
});
