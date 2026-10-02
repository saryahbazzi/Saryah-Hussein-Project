import { setRequestLocale } from "next-intl/server";
import { EventsList } from "@/components/dashboard/events-list";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <EventsList />;
}
