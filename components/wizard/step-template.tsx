"use client";

import { useTranslations } from "next-intl";
import clsx from "clsx";
import { InvitationCard } from "@/components/invitation/invitation-card";
import { useCatalog } from "@/components/templates/use-catalog";
import { Badge } from "@/components/ui/primitives";
import { StepShell, type StepProps } from "./step-shell";
import { buildCardContent, cardLang } from "./card";

export function StepTemplate({ state, update, errors }: StepProps<"template">) {
  const t = useTranslations("wizard.template");
  const e = useTranslations("wizard.errors");
  const occ = useTranslations("occasions");
  const ph = useTranslations("wizard.placeholders");
  const { templates } = useCatalog();
  const { details: d, custom: c } = state;
  const list = state.showAllTemplates ? templates : templates.filter((x) => x.occasion === d.occasion);
  const lang = cardLang(c);

  return (
    <StepShell title={t("title")} lead={t("lead")}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-oud-soft" aria-live="polite">
          {state.showAllTemplates ? t("showingAll") : t("showingFor", { occasion: occ(`items.${d.occasion}`) })}
        </p>
        <button
          type="button"
          aria-pressed={state.showAllTemplates}
          onClick={() => update((s) => ({ ...s, showAllTemplates: !s.showAllTemplates }))}
          className="inline-flex min-h-11 items-center rounded-full border border-line bg-white/70 px-4 text-sm font-semibold hover:border-gold"
        >
          {state.showAllTemplates ? t("showFiltered") : t("showAll")}
        </button>
      </div>
      {errors.template && <p role="alert" className="mb-4 text-sm font-medium text-rose">{e(errors.template)}</p>}
      {list.length === 0 && <p className="rounded-2xl border border-dashed border-line bg-sand/50 p-6 text-center text-oud-soft">{t("none")}</p>}
      <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 md:grid-cols-3">
        {list.map((spec) => {
          const sel = state.templateSlug === spec.slug;
          return (
            <li key={spec.slug}>
              <button
                type="button"
                aria-pressed={sel}
                onClick={() => update((s) => ({ ...s, templateSlug: spec.slug, custom: { ...s.custom, palette: null } }))}
                className={clsx("block w-full rounded-[1.5rem] p-1.5 text-start transition", sel ? "bg-gold-bright shadow-lift" : "hover:bg-sand")}
              >
                <InvitationCard
                  spec={spec}
                  lang={lang}
                  className="pointer-events-none"
                  content={buildCardContent(d, c, occ(`items.${spec.occasion}`), {
                    hosts: ph("hosts"), headline: ph("headline"), date: ph("date"), venue: ph("venue"),
                  })}
                />
                <span className="mt-2 flex items-center justify-between gap-2 px-1.5 pb-1">
                  <span className="text-sm font-semibold text-navy">{spec.name[lang]}</span>
                  {sel ? <Badge tone="navy">✓ {t("selected")}</Badge> : <Badge tone={spec.kind === "static" ? "neutral" : "gold"}>{t(`kinds.${spec.kind}`)}</Badge>}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </StepShell>
  );
}
