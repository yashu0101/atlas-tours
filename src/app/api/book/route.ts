import { NextResponse } from "next/server";
import { addBooking, getPackages } from "@/lib/db";
import { badRequest, notFound, readJson, withHandler } from "@/lib/api";
import { contactFields, guardPublicForm, isHoneypotTripped, str } from "@/lib/public-form";

/**
 * Public booking endpoint. Unauthenticated; see public-form.ts for the guards (B-04).
 * `amount` and `packageName` are always derived server-side from the package —
 * any client-supplied values are ignored. Amount = package price × travelers.
 */
export const POST = withHandler(async (req) => {
  guardPublicForm(req, "book");
  const body = await readJson(req);
  if (isHoneypotTripped(body)) return NextResponse.json({ success: true });

  const contact = contactFields(body);
  const city = str(body, "city", 100);
  const packageId = str(body, "packageId", 100);
  if (!packageId) throw badRequest("packageId is required");

  const pkg = (await getPackages()).find((p) => p.id === packageId && !p.hidden);
  if (!pkg) throw notFound("Package not found");
  if (typeof pkg.price !== "number" || !Number.isFinite(pkg.price)) throw new Error(`Package ${pkg.id} has no valid price`);

  const booking = await addBooking({
    name: contact.name,
    phone: contact.phone,
    email: contact.email,
    city,
    travelers: contact.travelers,
    travelDate: contact.travelDate,
    packageId: pkg.id,
    packageName: pkg.name,
    amount: pkg.price * contact.travelers,
  });
  return NextResponse.json(booking);
});
