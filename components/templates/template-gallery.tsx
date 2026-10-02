"use client";

import { useCallback, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import clsx from "clsx";
import { InvitationCard } from "@/components/invitation/invitation-card";
import { Badge } from "@/components/ui/primitives";
import { Container } from "@/components/ui/container";
import { OCCASIONS, STYLES, tierOf, type CardSpec, type Occasion, type TemplateKind, type TemplateStyle } from "@/lib/templates/catalog";
import { PRICING } from "@/lib/pricing/config";
import { formatSar } from "@/lib/pricing/calculate";
import { useCatalog } from "./use-catalog";
import { TemplatePreview } from "./template-preview";
import type { CardLang } from "./format";

const KINDS: TemplateKind[] = ["static", "animated", "video"];

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={clsx(
        "inline-flex min-h-11 items-center whitespace-nowrap rounded-full border px-4 text-sm font-semibold transition",
        active ? "border-navy bg-navy text-ivory" : "border-line bg-white/70 text-oud hover:border-gold",
      )}
    >
      {children}
    </button>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div role="group" aria-label={label} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
      <span className="text-sm font-semibold text-navy sm:w-24 sm:shrink-0">{label}</span>
      <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">{children}</div>
    </div>
  );
}

const pick = <T extends string>(v: string | null, all: readonly T[]): T | null => (v && (all as readonly string[]).includes(v) ? (v as T) : null);

export function TemplateGallery() {
  const t = useTranslations("templates");
  const locale = useLocale();
  const sp = useSearchParams();
  const { templates } = useCatalog();
  const [occasion, setOccasion] = useState<Occasion | null>(() => pick(sp.get("occasion"), OCCASIONS));
  const [style, setStyle] = useState<TemplateStyle | null>(() => pick(sp.get("style"), STYLES));
  const [kind, setKind] = useState<TemplateKind | null>(() => pick(sp.get("kind"), KINDS));
  const [open, setOpen] = useState<CardSpec | null>(null);
  const trigger = useRef<HTMLElement | null>(null);

  const sync = useCallback((next: Record<string, string | null>) => {
    const p = new URLSearchParams(window.location.search);
    for (const [k, v] of Object.entries(next)) { if (v) p.set(k, v); else p.delete(k); }
    const qs = p.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${qs ? `?${qs}` : ""}`);
  }, []);

  const toggle = <T extends string>(cur: T | null, v: T, set: (x: T | null) => void, key: string) => {
    const next = cur === v ? null : v;
    set(next);
    sync({ [key]: next });
  };

  const shown = templates.filter(
    (x) => (!occasion || x.occasion === occasion) && (!style || x.style === style) && (!kind || x.kind === kind),
  );
  const filtered = !!(occasion || style || kind);
  const lang: CardLang = locale === "en" ? "en" : "ar";
  const sample = useTranslations("templates.sample");

  return (
    <Container className="pb-24">
      <div className="space-y-4 rounded-3xl border border-line bg-white/60 p-4 sm:p-6">
        <FilterRow label={t("filters.occasion")}>
          {OCCASIONS.map((o) => <Chip key={o} active={occasion === o} onClick={() => toggle(occasion, o, setOccasion, "occasion")}>{t(`occasions.${o}`)}</Chip>)}
        </FilterRow>
        <FilterRow label={t("filters.style")}>
          {STYLES.map((s) => <Chip key={s} active={style === s} onClick={() => toggle(style, s, setStyle, "style")}>{t(`styles.${s}`)}</Chip>)}
        </FilterRow>
        <FilterRow label={t("filters.kind")}>
          {KINDS.map((k) => <Chip key={k} active={kind === k} onClick={() => toggle(kind, k, setKind, "kind")}>{t(`kinds.${k}`)}</Chip>)}
        </FilterRow>
        <div className="flex items-center justify-between gap-3 border-t border-line pt-3">
          <p role="status" aria-live="polite" className="text-sm text-oud-soft">{t("filters.count", { count: shown.length })}</p>
          {filtered && (
            <button
              type="button"
              onClick={() => { setOccasion(null); setStyle(null); setKind(null); sync({ occasion: null, style: null, kind: null }); }}
              className="min-h-11 rounded-full px-4 text-sm font-semibold text-gold-ink underline-offset-4 hover:underline"
            >
              {t("filters.reset")}
            </button>
          )}
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-dashed border-line bg-sand/50 px-6 py-14 text-center">
          <p className="font-display text-2xl font-bold text-navy">{t("filters.empty")}</p>
          <p className="mt-2 text-oud-soft">{t("filters.emptyBody")}</p>
        </div>
      ) : (
        <ul className="mt-10 grid grid-cols-2 gap-x-4 gap-y-9 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4">
          {shown.map((spec) => {
            const tier = tierOf(spec.kind);
            return (
              <li key={spec.slug}>
                <button
                  type="button"
                  onClick={(e) => { trigger.current = e.currentTarget; setOpen(spec); }}
                  aria-label={t("card.preview", { name: spec.name[lang] })}
                  className="group block w-full rounded-[1.4rem] text-start transition duration-300 hover:-translate-y-1"
                >
                  <InvitationCard
                    spec={spec}
                    lang={lang}
                    content={{
                      eyebrow: sample(`${lang}.eyebrow.${spec.occasion}`),
                      title: sample(`${lang}.hosts`),
                      host: sample(`${lang}.headline`),
                      date: sample(`${lang}.date`),
                      venue: sample(`${lang}.venue`),
                    }}
                  />
                </button>
                <p className="mt-3 font-semibold text-navy">{spec.name[lang]}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <Badge tone={spec.kind === "static" ? "neutral" : "gold"}>{t(`kinds.${spec.kind}`)}</Badge>
                  <Badge tone="sky">{t(`styles.${spec.style as TemplateStyle}`)}</Badge>
                </div>
                <p className="mt-1.5 text-xs text-oud-soft">{t("card.price", { price: formatSar(PRICING.basePrice[tier], locale) })}</p>
              </li>
            );
          })}
        </ul>
      )}

      {open && (
        <TemplatePreview
          spec={open}
          onClose={() => { setOpen(null); trigger.current?.focus(); }}
        />
      )}
    </Container>
  );
}
