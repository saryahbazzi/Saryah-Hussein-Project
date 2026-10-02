import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { TicketView } from "@/components/ticket/ticket-view";

type Props = { params: Promise<{ locale: string; token: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ticket.meta" });
  // Personal links must never be indexed.
  return { title: t("title"), robots: { index: false, follow: false } };
}

export default async function TicketPage({ params }: Props) {
  const { locale, token } = await params;
  setRequestLocale(locale);
  return <TicketView token={decodeURIComponent(token)} />;
}
