import { NextResponse } from "next/server";
import { addEnquiry, getPackageById, getPackages } from "@/lib/db";
import { readJson, withHandler } from "@/lib/api";
import { contactFields, guardPublicForm, isHoneypotTripped, str } from "@/lib/public-form";

/** Public enquiry form (Contact section). Unauthenticated; see public-form.ts for the guards (B-04). */
export const POST = withHandler(async (req) => {
  await guardPublicForm(req, "enquiry");
  const body = await readJson(req);
  if (isHoneypotTripped(body)) return NextResponse.json({ success: true });

  const contact = contactFields(body);
  const message = str(body, "message", 2000);

  // Accept `packageId`, and map the legacy `package` field (an id or a name) onto it.
  // An unknown package is dropped rather than rejected so the enquiry still gets through.
  const wanted = str(body, "packageId", 100) || str(body, "package", 200);
  let packageId: string | undefined;
  if (wanted) {
    // Id first (one-row lookup); only the legacy name form needs the full list.
    const match = (await getPackageById(wanted)) ?? (await getPackages()).find((p) => p.name.toLowerCase() === wanted.toLowerCase());
    packageId = match?.id;
  }

  const enquiry = await addEnquiry({
    kind: "contact",
    name: contact.name,
    phone: contact.phone,
    email: contact.email,
    travelers: contact.travelers,
    travelDate: contact.travelDate,
    message,
    packageId,
  });
  return NextResponse.json(enquiry);
});
