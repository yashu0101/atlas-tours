import { NextResponse } from "next/server";
import { addBooking, getPackageById } from "@/lib/db";
import { badRequest, notFound, readJson, withHandler } from "@/lib/api";
import { contactFields, guardPublicForm, isHoneypotTripped, str } from "@/lib/public-form";
import { notifyAfterResponse } from "@/lib/notify";
import { PRICING_LIMITS, findTier, hasPricing, rateFor } from "@/lib/pricing";

/**
 * Public booking endpoint. Unauthenticated; see public-form.ts for the guards (B-04).
 * `amount` and `packageName` are always derived server-side from the package —
 * any client-supplied values are ignored. Amount = per-person rate × travelers, where the
 * rate is the package price, or (N-22) the chosen hotel category's rate for the group size.
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
  // N-18: some packages need a minimum group (e.g. "Minimum 4 pax" on the Rajasthan brochure).
  if (pkg.minTravelers && contact.travelers < pkg.minTravelers) {
    throw badRequest(`this package needs at least ${pkg.minTravelers} travellers`);
  }

  // N-22: packages with a price grid charge the chosen hotel category's rate for the group
  // size; the category is kept in packageName so the owner, the emails and /track see it.
  let rate = pkg.price;
  let packageName = pkg.name;
  if (hasPricing(pkg)) {
    const option = str(body, "option", PRICING_LIMITS.maxTierName);
    const tier = option ? findTier(pkg.pricing, option) : undefined;
    if (!tier) throw badRequest("please choose a hotel category");
    const tierRate = rateFor(pkg.pricing, tier, contact.travelers);
    if (tierRate === null) throw badRequest(`${tier.name} is not available for ${contact.travelers} travellers — please call us`);
    rate = tierRate;
    packageName = `${pkg.name} — ${tier.name}`;
  }

  const booking = await addBooking({
    name: contact.name,
    phone: contact.phone,
    email: contact.email,
    city,
    travelers: contact.travelers,
    travelDate: contact.travelDate,
    packageId: pkg.id,
    packageName,
    amount: rate * contact.travelers,
  });
  // G-02 / N-10: owner alert + customer confirmation, sent after the response (notify.ts).
  notifyAfterResponse({ type: "booking", booking });
  return NextResponse.json(booking);
});
