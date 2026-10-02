import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/container";
import { TemplateGallery } from "@/components/templates/template-gallery";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "templates" });
  return {
    title: t("meta.title"),
    description: t("meta.description"),
    alternates: { canonical: `/${locale}/templates`, languages: { ar: "/ar/templates", en: "/en/templates" } },
    openGraph: { title: t("meta.title"), description: t("meta.description"), locale },
  };
}

export default async function TemplatesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("templates");
  return (
    <>
      <Container className="pb-10 pt-14 sm:pb-14 sm:pt-20">
        <p className="mb-4 text-sm font-semibold tracking-wide text-gold-ink">{t("hero.eyebrow")}</p>
        <h1 className="max-w-3xl font-display text-4xl font-bold text-navy sm:text-6xl">{t("hero.title")}</h1>
        <p className="mt-5 max-w-2xl text-lg text-oud-soft">{t("hero.lead")}</p>
      </Container>
      <Suspense fallback={<Container className="pb-24"><div className="h-64 animate-pulse rounded-3xl bg-sand/60" /></Container>}>
        <TemplateGallery />
      </Suspense>
    </>
  );
}
