"use client";

import { useLocale, useTranslations } from "next-intl";
import { InvitationCard } from "@/components/invitation/invitation-card";
import { Badge } from "@/components/ui/primitives";
import { useCatalog } from "@/components/templates/use-catalog";
import { formatEventDate } from "@/components/templates/format";
import { getTemplate } from "@/lib/templates/catalog";
import { isUsable, reviewGuests } from "@/lib/guests/parse";
import { StepShell, type StepProps } from "./step-shell";
import { PriceTable } from "./pricing-summary";
import { buildCardContent, cardLang, startsAtIso } from "./card";

export function StepSummary({ state }: StepProps) {
  const t = useTranslations("wizard.summary");
  const occ = useTranslations("occasions");
  const ph = useTranslations("wizard.placeholders");
  const locale = useLocale();
  const { templates } = useCatalog();
  const spec = templates.find((x) => x.slug === state.templateSlug) ?? getTemplate(state.templateSlug ?? "");
  if (!spec) return null;
  const { details: d, custom: c } = state;
  const count = reviewGuests(state.guests).filter(isUsable).length;
  const iso = startsAtIso(d);
  const rows: [string, string][] = [
    [t("rows.event"), d.title],
    [t("rows.when"), iso ? formatEventDate(iso, locale === "en" ? "en" : "ar") : "—"],
    [t("rows.where"), `${d.venue} · ${t(`cities.${d.city}`)}`],
    [t("rows.template"), spec.name[locale === "en" ? "en" : "ar"]],
    [t("rows.guests"), String(count)],
  ];

  return (
    <StepShell title={t("title")} lead={t("lead")}>
      <div className="grid gap-8 lg:grid-cols-[16rem_1fr_1fr] lg:items-start">
        <div className="mx-auto w-full max-w-[14rem] lg:max-w-none">
          <InvitationCard spec={spec} palette={c.palette ?? spec.palette} lang={cardLang(c)} content={buildCardContent(d, c, occ(`items.${d.occasion}`), { hosts: ph("hosts"), headline: ph("headline"), date: ph("date"), venue: ph("venue") })} />
        </div>
        <dl className="space-y-4 rounded-3xl border border-line bg-white/70 p-5 shadow-card">
          {rows.map(([k, v]) => (
            <div key={k}><dt className="text-xs font-medium text-oud-soft">{k}</dt><dd className="font-semibold text-navy">{v}</dd></div>
          ))}
          <div><Badge tone={spec.kind === "static" ? "neutral" : "gold"}>{t(`tier.${spec.kind === "static" ? "standard" : "premium"}`)}</Badge></div>
        </dl>
        <div className="rounded-3xl bg-white/70 p-5 shadow-card ring-1 ring-line sm:p-6">
          <h3 className="mb-4 font-display text-xl font-bold text-navy">{t("breakdown")}</h3>
          <PriceTable kind={spec.kind} guestCount={count} />
        </div>
      </div>
    </StepShell>
  );
}
