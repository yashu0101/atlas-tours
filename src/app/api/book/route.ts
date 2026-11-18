import { NextResponse } from "next/server";
import { addBooking, getPackageById } from "@/lib/db";
import { badRequest, notFound, readJson, withHandler } from "@/lib/api";
import { contactFields, guardPublicForm, isHoneypotTripped, str } from "@/lib/public-form";
import { notifyAfterResponse } from "@/lib/notify";

/**
 * Public booking endpoint. Unauthenticated; see public-form.ts for the guards (B-04).
 * `amount` and `packageName` are always derived server-side from the package —
 * any client-supplied values are ignored. Amount = package price × travelers.
 */
export const POST = withHandler(async (req) => {
  await guardPublicForm(req, "book");
  const body = await readJson(req);
  if (isHoneypotTripped(body)) return NextResponse.json({ success: true });

  const contact = contactFields(body);
  const city = str(body, "city", 100);
  const packageId = str(body, "packageId", 100);
  if (!packageId) throw badRequest("packageId is required");

  const found = await getPackageById(packageId);
  const pkg = found && !found.hidden ? found : null;
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
  // G-02 / N-10: owner alert + customer confirmation, sent after the response (notify.ts).
  notifyAfterResponse({ type: "booking", booking });
  return NextResponse.json(booking);
});
