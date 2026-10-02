"use client";

import { useTranslations } from "next-intl";
import clsx from "clsx";
import { InvitationCard } from "@/components/invitation/invitation-card";
import { Field, Input, Textarea } from "@/components/ui/primitives";
import { getTemplate } from "@/lib/templates/catalog";
import { useCatalog } from "@/components/templates/use-catalog";
import type { EventLanguage } from "@/lib/demo/types";
import { StepShell, type StepProps } from "./step-shell";
import { PaletteEditor } from "./palette-editor";
import { AiAdapt } from "./ai-adapt";
import { buildCardContent, cardLang } from "./card";
import type { CustomizeField } from "./model";

const LANGS: EventLanguage[] = ["ar", "en", "both"];

export function StepCustomize({ state, update, errors }: StepProps<CustomizeField>) {
  const t = useTranslations("wizard.customize");
  const e = useTranslations("wizard.errors");
  const occ = useTranslations("occasions");
  const ph = useTranslations("wizard.placeholders");
  const { templates } = useCatalog();
  const spec = templates.find((x) => x.slug === state.templateSlug) ?? getTemplate(state.templateSlug ?? "");
  const { details: d, custom: c } = state;
  if (!spec) return null;
  const palette = c.palette ?? spec.palette;
  const set = <K extends keyof typeof c>(k: K, v: (typeof c)[K]) => update((s) => ({ ...s, custom: { ...s.custom, [k]: v } }));
  const err = (k: CustomizeField) => (errors[k] ? e(errors[k]!) : null);

  return (
    <StepShell title={t("title")} lead={t("lead")}>
      <div className="grid gap-10 lg:grid-cols-[1fr_20rem]">
        <div className="order-2 space-y-8 lg:order-1">
          <div className="grid gap-6 sm:grid-cols-2">
            <Field label={t("hosts.label")} hint={t("hosts.hint")} error={err("hosts")} htmlFor="cu-hosts">
              <Input id="cu-hosts" value={c.hosts} maxLength={60} placeholder={t("hosts.placeholder")} aria-invalid={!!errors.hosts} onChange={(x) => set("hosts", x.target.value)} />
            </Field>
            <Field label={t("headline.label")} hint={t("headline.hint")} error={err("headline")} htmlFor="cu-headline">
              <Input id="cu-headline" value={c.headline} maxLength={80} aria-invalid={!!errors.headline} onChange={(x) => set("headline", x.target.value)} />
            </Field>
            <div className="sm:col-span-2">
              <Field label={t("message.label")} hint={t("message.hint")} htmlFor="cu-message">
                <Textarea id="cu-message" value={c.message} maxLength={140} placeholder={t("message.placeholder")} onChange={(x) => set("message", x.target.value)} />
              </Field>
            </div>
          </div>

          <fieldset>
            <legend className="mb-1.5 text-sm font-semibold text-navy">{t("language.label")}</legend>
            <div className="grid grid-cols-3 gap-3">
              {LANGS.map((l) => (
                <label key={l} className={clsx("flex min-h-12 cursor-pointer items-center justify-center rounded-2xl border px-2 text-center text-sm font-semibold transition focus-within:outline focus-within:outline-[3px] focus-within:outline-offset-2 focus-within:outline-gold", c.language === l ? "border-navy bg-navy text-ivory" : "border-line bg-white hover:border-gold")}>
                  <input type="radio" name="cu-lang" className="sr-only" checked={c.language === l} onChange={() => set("language", l)} />
                  {t(`language.${l}`)}
                </label>
              ))}
            </div>
            {c.language === "both" && <p className="mt-2 text-xs text-oud-soft">{t("language.bothHint")}</p>}
          </fieldset>

          <div>
            <h3 className="mb-3 font-display text-xl font-bold text-navy">{t("palette.title")}</h3>
            <PaletteEditor palette={palette} base={spec.palette} onChange={(p) => set("palette", p)} />
          </div>

          <AiAdapt
            slug={spec.slug}
            palette={palette}
            hosts={c.hosts}
            headline={c.headline}
            current={{ palette: c.palette, headline: c.headline, message: c.message }}
            onApply={(r) => update((s) => ({ ...s, custom: { ...s.custom, palette: r.palette, headline: r.headline, message: r.message } }))}
            onUndo={(snap) => update((s) => ({ ...s, custom: { ...s.custom, ...snap } }))}
          />
        </div>

        <div className="order-1 lg:order-2">
          <div className="mx-auto w-full max-w-[17rem] lg:sticky lg:top-6 lg:max-w-none">
            <p className="mb-2 text-center text-xs font-semibold text-oud-soft">{t("livePreview")}</p>
            <InvitationCard
              spec={spec}
              palette={palette}
              lang={cardLang(c)}
              content={buildCardContent(d, c, occ(`items.${d.occasion}`), { hosts: ph("hosts"), headline: ph("headline"), date: ph("date"), venue: ph("venue") }, true)}
            />
          </div>
        </div>
      </div>
    </StepShell>
  );
}
