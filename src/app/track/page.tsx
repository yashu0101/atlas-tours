import type { Metadata } from "next";
import FormPageShell from "@/components/FormPageShell";
import TrackBookingForm from "@/components/TrackBookingForm";
import { getT } from "@/lib/i18n";

// Reads ?ref= on every request.
export const dynamic = "force-dynamic";

// Server-rendered in English; the language toggle only exists client-side (G-08).
const t = getT("en");

export const metadata: Metadata = {
  title: t("track.metaTitle"),
  description: t("track.metaDescription"),
  alternates: { canonical: "/track" },
  // A personal lookup page: nothing to index.
  robots: { index: false },
};

type Props = { searchParams: Promise<{ ref?: string | string[] }> };

/** N-4: "Track your booking" — reference + phone lookup against POST /api/booking-status. */
export default async function TrackPage({ searchParams }: Props) {
  const { ref } = await searchParams;
  const initialReference = (Array.isArray(ref) ? ref[0] : ref ?? "").trim().slice(0, 60);
  return (
    <FormPageShell title={t("track.heading")} subtitle={t("track.subheading")}>
      <TrackBookingForm initialReference={initialReference} />
    </FormPageShell>
  );
}
