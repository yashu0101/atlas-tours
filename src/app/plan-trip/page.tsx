import type { Metadata } from "next";
import FormPageShell from "@/components/FormPageShell";
import TripRequestForm from "@/components/TripRequestForm";
import { CALLBACK_MAX_DAYS_AHEAD } from "@/lib/trip-request";
import { istDateKey } from "@/lib/visibility";
import { getT } from "@/lib/i18n";

// "Today" (IST) for the callback date range and ?mode= are read per request.
export const dynamic = "force-dynamic";

// Server-rendered in English; the language toggle only exists client-side (G-08).
const t = getT("en");

export const metadata: Metadata = {
  title: t("tripRequest.metaTitle"),
  description: t("tripRequest.metaDescription"),
  alternates: { canonical: "/plan-trip" },
};

type Props = { searchParams: Promise<{ mode?: string | string[] }> };

/** N-6: "Plan my trip" / "Request a callback" (POST /api/trip-request). `?mode=callback` preselects the callback form. */
export default async function PlanTripPage({ searchParams }: Props) {
  const { mode } = await searchParams;
  const initialMode = (Array.isArray(mode) ? mode[0] : mode) === "callback" ? "callback" : "trip-plan";
  // Same window the API enforces (src/app/api/trip-request/route.ts), computed here so the
  // server-rendered and hydrated min/max attributes are identical.
  const now = new Date();
  const minDate = istDateKey(now);
  const maxDate = istDateKey(new Date(now.getTime() + CALLBACK_MAX_DAYS_AHEAD * 24 * 60 * 60 * 1000));
  return (
    <FormPageShell title={t("tripRequest.heading")} subtitle={t("tripRequest.subheading")}>
      <TripRequestForm initialMode={initialMode} minDate={minDate} maxDate={maxDate} />
    </FormPageShell>
  );
}
