import { getTranslations, setRequestLocale } from "next-intl/server";
import { LegalDocument } from "@/components/admin/legal-document";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal" });
  return { title: t("privacy.title"), description: t("privacy.lead") };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <LegalDocument doc="privacy" />;
}
