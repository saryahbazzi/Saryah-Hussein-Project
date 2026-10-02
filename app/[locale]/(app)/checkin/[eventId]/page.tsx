import { setRequestLocale } from "next-intl/server";
import { Scanner } from "@/components/checkin/scanner";

export default async function ScannerPage({ params }: { params: Promise<{ locale: string; eventId: string }> }) {
  const { locale, eventId } = await params;
  setRequestLocale(locale);
  return <Scanner eventId={eventId} />;
}
