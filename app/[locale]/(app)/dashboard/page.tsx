import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireArea } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await requireArea("dashboard", locale, "/dashboard");
  const t = await getTranslations("app");
  return (
    <>
      <h1 className="font-display text-4xl font-bold text-navy">
        {t("welcome", { name: session.fullName ?? "" })}
      </h1>
      <p className="mt-3 text-oud-soft">{t("dashboardSoon")}</p>
    </>
  );
}
