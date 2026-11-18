import type { Metadata } from "next";
import FormPageShell from "@/components/FormPageShell";
import ReviewSubmitForm from "@/components/ReviewSubmitForm";
import { getPackages } from "@/lib/db";
import { isPublicPackage } from "@/lib/visibility";
import { REVIEW_TEXT_MAX, REVIEW_TEXT_MIN } from "@/lib/public-form";
import { getT } from "@/lib/i18n";

// Same as the home page (F-02): the package list reflects admin edits immediately.
export const dynamic = "force-dynamic";

// Server-rendered in English; the language toggle only exists client-side (G-08).
const t = getT("en");

export const metadata: Metadata = {
  title: t("reviewForm.metaTitle"),
  description: t("reviewForm.metaDescription"),
  alternates: { canonical: "/reviews/new" },
};

/** N-5: public review submission. Reviews are saved hidden until an admin approves them. */
export default async function NewReviewPage() {
  let packages: { id: string; name: string }[] = [];
  try {
    packages = (await getPackages()).filter(isPublicPackage).map((p) => ({ id: p.id, name: p.name }));
  } catch (err) {
    // The package select is optional: render the form without it rather than failing.
    console.error("reviews/new: failed to load packages", err);
  }
  return (
    <FormPageShell title={t("reviewForm.heading")} subtitle={t("reviewForm.subheading")}>
      <ReviewSubmitForm packages={packages} minLength={REVIEW_TEXT_MIN} maxLength={REVIEW_TEXT_MAX} />
    </FormPageShell>
  );
}
