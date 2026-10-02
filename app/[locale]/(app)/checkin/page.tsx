import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireArea } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireArea("checkin", locale, "/checkin");
  const t = await getTranslations("app");
  return (
    <>
      <h1 className="font-display text-4xl font-bold text-navy">{t("areas.checkin")}</h1>
      <p className="mt-3 text-oud-soft">{t("dashboardSoon")}</p>
    </>
  );
}
