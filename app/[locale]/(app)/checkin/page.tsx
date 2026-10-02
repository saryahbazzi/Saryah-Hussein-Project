import { setRequestLocale } from "next-intl/server";
import { CheckinEventList } from "@/components/checkin/event-list";

export default async function CheckinPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <CheckinEventList />;
}
