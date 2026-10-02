"use client";

import { useId, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import clsx from "clsx";
import { PRICING, type PricingTier } from "@/lib/pricing/config";
import { calculatePrice, clampGuests, formatSar } from "@/lib/pricing/calculate";
import { ButtonLink } from "@/components/ui/button";

export function PricingCalculator() {
  const t = useTranslations("pricing");
  const locale = useLocale();
  const id = useId();
  const [tier, setTier] = useState<PricingTier>("standard");
  const [guests, setGuests] = useState(150);
  const price = calculatePrice(tier, guests);
  const money = (n: number) => formatSar(n, locale);

  return (
    <div className="grid gap-8 rounded-[2rem] border border-line bg-white/70 p-6 shadow-card sm:p-10 lg:grid-cols-[1.2fr_1fr]">
      <div className="space-y-9">
        <fieldset>
          <legend className="mb-3 text-sm font-semibold text-navy">{t("tierLabel")}</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {(Object.keys(PRICING.basePrice) as PricingTier[]).map((k) => (
              <label
                key={k}
                className={clsx(
                  "cursor-pointer rounded-2xl border p-4 transition focus-within:outline focus-within:outline-[3px] focus-within:outline-offset-2 focus-within:outline-gold",
                  tier === k ? "border-navy bg-navy text-ivory" : "border-line bg-ivory hover:border-gold",
                )}
              >
                <input type="radio" name={`${id}-tier`} className="sr-only" checked={tier === k} onChange={() => setTier(k)} />
                <span className="block font-semibold">{t(`tiers.${k}.name`)}</span>
                <span className={clsx("mt-1 block text-sm", tier === k ? "text-ivory/80" : "text-oud-soft")}>
                  {t(`tiers.${k}.desc`)}
                </span>
                <span className="mt-3 block font-display text-2xl font-bold">
                  {money(PRICING.basePrice[k])}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <div className="flex items-baseline justify-between">
            <label htmlFor={`${id}-guests`} className="text-sm font-semibold text-navy">
              {t("guestsLabel")}
            </label>
            <input
              type="number"
              inputMode="numeric"
              aria-label={t("guestsLabel")}
              min={PRICING.minGuests}
              max={PRICING.maxGuests}
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value))}
              onBlur={() => setGuests(clampGuests(guests))}
              className="w-24 rounded-xl border border-line bg-ivory px-3 py-2 text-center font-semibold"
            />
          </div>
          <input
            id={`${id}-guests`}
            type="range"
            min={PRICING.minGuests}
            max={1000}
            step={10}
            value={Math.min(guests, 1000)}
            onChange={(e) => setGuests(Number(e.target.value))}
            className="mt-4 h-2 w-full cursor-pointer accent-[var(--color-navy)]"
          />
          <p className="mt-2 text-sm text-oud-soft">{t("perGuestNote", { price: money(PRICING.perGuest) })}</p>
        </div>
      </div>

      <div className="flex flex-col rounded-3xl bg-navy p-7 text-ivory" aria-live="polite">
        <dl className="space-y-3 text-sm">
          <Row label={t("summary.base")} value={money(price.base)} />
          <Row label={t("summary.guests", { count: price.guests })} value={money(price.guestsTotal)} />
          <Row label={t("summary.vat", { rate: PRICING.vatRate * 100 })} value={money(price.vat)} />
        </dl>
        <div className="my-5 h-px bg-ivory/20" />
        <p className="text-sm text-ivory/70">{t("summary.total")}</p>
        <p className="font-display text-5xl font-bold text-gold-bright">{money(price.total)}</p>
        <ButtonLink href="/events/new" variant="gold" className="mt-7">
          {t("cta")}
        </ButtonLink>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ivory/80">{label}</dt>
      <dd className="font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
