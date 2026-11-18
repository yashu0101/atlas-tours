import { NextResponse } from "next/server";
import { addReview, getPackageById } from "@/lib/db";
import { badRequest, readJson, str, withHandler } from "@/lib/api";
import { REVIEW_TEXT_MAX, REVIEW_TEXT_MIN, guardPublicForm, isHoneypotTripped } from "@/lib/public-form";
import { notifyAfterResponse } from "@/lib/notify";
import { isPublicPackage } from "@/lib/visibility";

/**
 * N-5: public review submission. Unauthenticated; same guards as the other public forms
 * (rate limit, honeypot — see public-form.ts). Saved with `active: false` and
 * `source: "customer"`, so it stays off the site until an admin activates it in the
 * Reviews tab. `packageName` is resolved server-side from a visible package id; unknown
 * ids are dropped. The response deliberately does not echo the stored review.
 */
export const POST = withHandler(async (req) => {
  await guardPublicForm(req, "review");
  const body = await readJson(req);
  if (isHoneypotTripped(body)) return NextResponse.json({ success: true });

  const name = str(body, "name", 100, true);
  const city = str(body, "city", 100);
  const text = str(body, "text", REVIEW_TEXT_MAX, true);
  if (text.length < REVIEW_TEXT_MIN) throw badRequest(`text must be at least ${REVIEW_TEXT_MIN} characters`);
  const rating = typeof body.rating === "string" ? Number(body.rating) : body.rating;
  if (typeof rating !== "number" || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw badRequest("rating must be a whole number from 1 to 5");
  }

  const packageId = str(body, "packageId", 100);
  let packageName: string | undefined;
  if (packageId) {
    const pkg = await getPackageById(packageId);
    packageName = pkg && isPublicPackage(pkg) ? pkg.name : undefined;
  }

  const review = await addReview({ name, city, text, rating, packageName, active: false, source: "customer" });
  // G-02: owner alert that a review awaits approval (no customer email: the form collects none).
  notifyAfterResponse({ type: "review", review });
  return NextResponse.json({ success: true });
});
