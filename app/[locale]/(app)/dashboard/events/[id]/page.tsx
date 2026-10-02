import { setRequestLocale } from "next-intl/server";
import { EventDetail } from "@/components/dashboard/event-detail";

export default async function Page({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <EventDetail />;
}
