"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import clsx from "clsx";
import { InvitationCard } from "@/components/invitation/invitation-card";
import { MusicToggle } from "@/components/invitation/music-toggle";
import { ButtonLink } from "@/components/ui/button";
import { Badge, Field, Input } from "@/components/ui/primitives";
import { PRICING } from "@/lib/pricing/config";
import { formatSar } from "@/lib/pricing/calculate";
import { tierOf, type CardSpec } from "@/lib/templates/catalog";
import { formatEventDate, riyadhToIso, type CardLang } from "./format";

type Edits = { hosts?: string; headline?: string; venue?: string; date?: string };

/** Live preview in a native modal dialog: focus trap, Esc and inert background come for free. */
export function TemplatePreview({ spec, onClose }: { spec: CardSpec; onClose: () => void }) {
  const t = useTranslations("templates");
  const sample = useTranslations("templates.sample");
  const locale = useLocale();
  const id = useId();
  const ref = useRef<HTMLDialogElement>(null);
  const [lang, setLang] = useState<CardLang>(locale === "en" ? "en" : "ar");
  const [edits, setEdits] = useState<Edits>({});
  const tier = tierOf(spec.kind);
  const animated = spec.kind !== "static";

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (!d.open) d.showModal();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const dateIso = edits.date ? riyadhToIso(edits.date, "20:30") : null;
  const hosts = edits.hosts ?? sample(`${lang}.hosts`);
  const headline = edits.headline ?? sample(`${lang}.headline`);
  const venue = edits.venue ?? sample(`${lang}.venue`);
  const date = dateIso ? formatEventDate(dateIso, lang) : sample(`${lang}.date`);
  const set = (k: keyof Edits) => (e: React.ChangeEvent<HTMLInputElement>) => setEdits((x) => ({ ...x, [k]: e.target.value }));

  return (
    <dialog
      ref={ref}
      aria-labelledby={`${id}-title`}
      onClose={onClose}
      onClick={(e) => { if (e.target === ref.current) ref.current?.close(); }}
      className="fixed inset-0 m-0 h-dvh open:flex open:flex-col max-h-none w-screen max-w-none overflow-y-auto bg-ivory p-0 text-oud backdrop:bg-oud/60 md:ms-auto md:w-[min(58rem,100vw)] md:shadow-lift"
    >
      <style>{`
        @keyframes dw-drift { 0% { transform: scale(1) translate3d(0,0,0); } 50% { transform: scale(1.035) translate3d(0,-6px,0); } 100% { transform: scale(1) translate3d(0,0,0); } }
        @media (prefers-reduced-motion: no-preference) { .dw-drift { animation: dw-drift 9s ease-in-out infinite; } }
      `}</style>
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-line bg-ivory/95 px-5 py-3 backdrop-blur">
        <h2 id={`${id}-title`} className="font-display text-xl font-bold text-navy sm:text-2xl">{spec.name[lang]}</h2>
        <button
          type="button"
          onClick={() => ref.current?.close()}
          aria-label={t("preview.close")}
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-line text-xl hover:bg-sand"
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>

      <div className="grid flex-1 content-start gap-8 p-5 pb-32 md:grid-cols-[minmax(0,19rem)_1fr] md:gap-10 md:p-8 md:pb-8">
        <div className="mx-auto w-full max-w-[19rem] md:sticky md:top-24 md:self-start">
          <div className={clsx(spec.kind === "video" && "dw-drift")}>
            <InvitationCard
              spec={spec}
              lang={lang}
              content={{ eyebrow: sample(`${lang}.eyebrow.${spec.occasion}`), title: hosts, host: headline, date, venue }}
            />
          </div>
          {animated && (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <Badge tone="gold">{spec.kind === "video" ? `▶ ${t("preview.videoBadge")}` : `♪ ${t("preview.animatedBadge")}`}</Badge>
              <MusicToggle onLabel={t("preview.musicOn")} offLabel={t("preview.musicOff")} />
            </div>
          )}
        </div>

        <div className="space-y-5">
          <p className="text-sm text-oud-soft">{t("preview.editHint")}</p>
          <fieldset>
            <legend className="mb-1.5 text-sm font-semibold text-navy">{t("preview.language")}</legend>
            <div className="inline-flex rounded-full border border-line bg-white p-1">
              {(["ar", "en"] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  aria-pressed={lang === l}
                  onClick={() => setLang(l)}
                  className={clsx("min-h-11 min-w-24 rounded-full px-4 text-sm font-semibold transition", lang === l ? "bg-navy text-ivory" : "text-oud-soft hover:bg-sand")}
                >
                  {t(`preview.lang.${l}`)}
                </button>
              ))}
            </div>
          </fieldset>
          <Field label={t("preview.hosts")} htmlFor={`${id}-hosts`}>
            <Input id={`${id}-hosts`} value={edits.hosts ?? ""} placeholder={sample(`${lang}.hosts`)} maxLength={60} onChange={set("hosts")} />
          </Field>
          <Field label={t("preview.headline")} htmlFor={`${id}-headline`}>
            <Input id={`${id}-headline`} value={edits.headline ?? ""} placeholder={sample(`${lang}.headline`)} maxLength={80} onChange={set("headline")} />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label={t("preview.date")} htmlFor={`${id}-date`}>
              <Input id={`${id}-date`} type="date" value={edits.date ?? ""} onChange={set("date")} />
            </Field>
            <Field label={t("preview.venue")} htmlFor={`${id}-venue`}>
              <Input id={`${id}-venue`} value={edits.venue ?? ""} placeholder={sample(`${lang}.venue`)} maxLength={80} onChange={set("venue")} />
            </Field>
          </div>

          <div className="rounded-2xl border border-line bg-sand/60 p-4">
            <p className="text-sm font-semibold text-navy">{t(`preview.tier.${tier}`)}</p>
            <p className="mt-1 font-display text-2xl font-bold text-navy">
              {t("preview.price", { price: formatSar(PRICING.basePrice[tier], locale) })}
            </p>
            <p className="text-sm text-oud-soft">{t("preview.perGuest", { price: formatSar(PRICING.perGuest, locale) })}</p>
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-ivory/95 p-4 backdrop-blur md:sticky md:mt-auto md:px-8">
        <div className="mx-auto flex max-w-xl flex-col gap-2 md:max-w-none md:flex-row md:items-center md:justify-between">
          <p className="hidden text-sm text-oud-soft md:block">{t("preview.ctaNote")}</p>
          <ButtonLink href={`/events/new?template=${spec.slug}`} className="w-full md:w-auto">{t("preview.cta")}</ButtonLink>
        </div>
      </div>
    </dialog>
  );
}
