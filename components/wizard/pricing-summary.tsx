"use client";

import { useLocale, useTranslations } from "next-intl";
import { PRICING } from "@/lib/pricing/config";
import { calculatePrice, formatSar } from "@/lib/pricing/calculate";
import { tierOf, type TemplateKind } from "@/lib/templates/catalog";

export function usePrice(kind: TemplateKind | undefined, guestCount: number) {
  return calculatePrice(tierOf(kind ?? "static"), guestCount);
}

export function PriceTable({ kind, guestCount, dark = false }: { kind: TemplateKind | undefined; guestCount: number; dark?: boolean }) {
  const t = useTranslations("wizard.summary");
  const locale = useLocale();
  const p = usePrice(kind, guestCount);
  const money = (n: number) => formatSar(n, locale);
  const muted = dark ? "text-ivory/75" : "text-oud-soft";
  return (
    <div>
      <dl className="space-y-3 text-sm">
        <div className="flex justify-between gap-4"><dt className={muted}>{t(`base.${p.tier}`)}</dt><dd className="font-semibold tabular-nums">{money(p.base)}</dd></div>
        <div className="flex justify-between gap-4"><dt className={muted}>{t("guests", { count: p.guests, fee: money(PRICING.perGuest) })}</dt><dd className="font-semibold tabular-nums">{money(p.guestsTotal)}</dd></div>
        <div className="flex justify-between gap-4"><dt className={muted}>{t("subtotal")}</dt><dd className="font-semibold tabular-nums">{money(p.subtotal)}</dd></div>
        <div className="flex justify-between gap-4"><dt className={muted}>{t("vat", { rate: PRICING.vatRate * 100 })}</dt><dd className="font-semibold tabular-nums">{money(p.vat)}</dd></div>
      </dl>
      <div className={dark ? "my-4 h-px bg-ivory/20" : "my-4 h-px bg-line"} />
      <div className="flex items-baseline justify-between gap-4">
        <p className={muted}>{t("total")}</p>
        <p className={dark ? "font-display text-4xl font-bold text-gold-bright tabular-nums" : "font-display text-4xl font-bold text-navy tabular-nums"}>{money(p.total)}</p>
      </div>
      {guestCount < PRICING.minGuests && <p className={`mt-3 text-xs ${muted}`}>{t("minNote", { min: PRICING.minGuests, count: guestCount })}</p>}
    </div>
  );
}
