import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container, Section } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";
import { Pricing } from "@/components/marketing/pricing";
import { PRICING } from "@/lib/pricing/config";
import { formatSar } from "@/lib/pricing/calculate";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pricingPage" });
  return {
    title: t("meta.title"),
    description: t("meta.description"),
    alternates: { canonical: `/${locale}/pricing`, languages: { ar: "/ar/pricing", en: "/en/pricing" } },
    openGraph: { title: t("meta.title"), description: t("meta.description"), locale },
  };
}

const INCLUDED = ["design", "whatsapp", "rsvp", "qr", "reminders", "checkin", "privacy"] as const;
const ROWS = ["motion", "music", "video"] as const;

export default async function PricingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("pricingPage");
  const money = (n: number) => formatSar(n, locale);

  return (
    <>
      <Container className="pb-4 pt-14 sm:pt-20">
        <p className="mb-4 text-sm font-semibold tracking-wide text-gold-ink">{t("hero.eyebrow")}</p>
        <h1 className="max-w-3xl font-display text-4xl font-bold text-navy sm:text-6xl">{t("hero.title")}</h1>
        <p className="mt-5 max-w-2xl text-lg text-oud-soft">{t("hero.lead")}</p>
      </Container>

      <Pricing />

      <Section>
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl font-bold text-navy sm:text-4xl">{t("included.title")}</h2>
            <ul className="mt-8 space-y-4">
              {INCLUDED.map((k) => (
                <li key={k} className="flex gap-3">
                  <span aria-hidden="true" className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-sage/15 text-sm font-bold text-sage">✓</span>
                  <span>
                    <span className="block font-semibold text-navy">{t(`included.items.${k}.title`)}</span>
                    <span className="text-sm text-oud-soft">{t(`included.items.${k}.body`)}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-display text-3xl font-bold text-navy sm:text-4xl">{t("compare.title")}</h2>
            <div className="mt-8 overflow-x-auto rounded-3xl border border-line bg-white/70 shadow-card">
              <table className="w-full min-w-[22rem] text-sm">
                <caption className="sr-only">{t("compare.title")}</caption>
                <thead>
                  <tr className="border-b border-line bg-sand/60 text-start">
                    <th scope="col" className="p-4 text-start font-semibold text-oud-soft"><span className="sr-only">{t("compare.feature")}</span></th>
                    <th scope="col" className="p-4 text-start font-semibold text-navy">{t("compare.classic")}</th>
                    <th scope="col" className="p-4 text-start font-semibold text-navy">{t("compare.premium")}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-line">
                    <th scope="row" className="p-4 text-start font-medium">{t("compare.base")}</th>
                    <td className="p-4 font-semibold tabular-nums">{money(PRICING.basePrice.standard)}</td>
                    <td className="p-4 font-semibold tabular-nums">{money(PRICING.basePrice.premium)}</td>
                  </tr>
                  <tr className="border-b border-line">
                    <th scope="row" className="p-4 text-start font-medium">{t("compare.perGuest")}</th>
                    <td className="p-4 tabular-nums">{money(PRICING.perGuest)}</td>
                    <td className="p-4 tabular-nums">{money(PRICING.perGuest)}</td>
                  </tr>
                  <tr className="border-b border-line">
                    <th scope="row" className="p-4 text-start font-medium">{t("compare.design")}</th>
                    <td className="p-4"><span aria-hidden="true" className="text-sage">✓</span><span className="sr-only">{t("compare.yes")}</span></td>
                    <td className="p-4"><span aria-hidden="true" className="text-sage">✓</span><span className="sr-only">{t("compare.yes")}</span></td>
                  </tr>
                  {ROWS.map((r) => (
                    <tr key={r} className="border-b border-line last:border-0">
                      <th scope="row" className="p-4 text-start font-medium">{t(`compare.${r}`)}</th>
                      <td className="p-4 text-oud-soft"><span aria-hidden="true">—</span><span className="sr-only">{t("compare.no")}</span></td>
                      <td className="p-4"><span aria-hidden="true" className="text-sage">✓</span><span className="sr-only">{t("compare.yes")}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-sm text-oud-soft">{t("compare.note", { vat: PRICING.vatRate * 100, min: PRICING.minGuests })}</p>
          </div>
        </div>
      </Section>

      <Section tone="sand">
        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div>
            <h2 className="font-display text-3xl font-bold text-navy sm:text-4xl">{t("planners.title")}</h2>
            <p className="mt-4 max-w-2xl text-lg text-oud-soft">{t("planners.body")}</p>
          </div>
          <div className="rounded-3xl bg-navy p-8 text-ivory">
            <p className="font-display text-2xl font-bold">{t("cta.title")}</p>
            <p className="mt-2 text-ivory/80">{t("cta.body")}</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/events/new" variant="gold">{t("cta.primary")}</ButtonLink>
              <ButtonLink href="/templates" variant="light">{t("cta.secondary")}</ButtonLink>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
