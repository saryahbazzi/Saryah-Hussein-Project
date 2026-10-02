"use client";

import { useTranslations } from "next-intl";
import clsx from "clsx";
import { Button } from "@/components/ui/button";
import { useCatalog } from "@/components/templates/use-catalog";
import { getTemplate } from "@/lib/templates/catalog";
import { isUsable, reviewGuests } from "@/lib/guests/parse";
import { StepShell, type StepProps } from "./step-shell";
import { PriceTable } from "./pricing-summary";
import { PAYMENT_METHODS } from "./model";

export function StepCheckout({ state, update, busy, onPay }: StepProps & { busy: boolean; onPay: () => void }) {
  const t = useTranslations("wizard.checkout");
  const { templates } = useCatalog();
  const spec = templates.find((x) => x.slug === state.templateSlug) ?? getTemplate(state.templateSlug ?? "");
  const count = reviewGuests(state.guests).filter(isUsable).length;

  return (
    <StepShell title={t("title")} lead={t("lead")}>
      <p role="note" className="mb-8 flex gap-3 rounded-2xl border border-gold/50 bg-gold-bright/15 p-4 text-sm font-medium text-oud">
        <span aria-hidden="true">ⓘ</span><span>{t("demoNotice")}</span>
      </p>
      <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        <fieldset disabled={busy}>
          <legend className="mb-3 text-sm font-semibold text-navy">{t("method")}</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {PAYMENT_METHODS.map((m) => (
              <label key={m} className={clsx("flex min-h-16 cursor-pointer items-center gap-3 rounded-2xl border p-4 transition focus-within:outline focus-within:outline-[3px] focus-within:outline-offset-2 focus-within:outline-gold", state.payment === m ? "border-navy bg-navy text-ivory" : "border-line bg-white hover:border-gold")}>
                <input type="radio" name="pay" className="sr-only" checked={state.payment === m} onChange={() => update((s) => ({ ...s, payment: m }))} />
                <span aria-hidden="true" className={clsx("inline-flex size-5 shrink-0 items-center justify-center rounded-full border-2", state.payment === m ? "border-gold-bright" : "border-oud-soft")}>
                  {state.payment === m && <span className="size-2.5 rounded-full bg-gold-bright" />}
                </span>
                <span>
                  <span className="block font-semibold">{t(`methods.${m}.name`)}</span>
                  <span className={clsx("text-xs", state.payment === m ? "text-ivory/75" : "text-oud-soft")}>{t(`methods.${m}.hint`)}</span>
                </span>
              </label>
            ))}
          </div>
          <p className="mt-3 text-xs text-oud-soft">{t("noCard")}</p>
        </fieldset>
        <div className="flex flex-col rounded-3xl bg-navy p-6 text-ivory">
          <PriceTable kind={spec?.kind} guestCount={count} dark />
          <Button type="button" variant="gold" className="mt-6 w-full" disabled={busy} aria-busy={busy} onClick={onPay}>
            {busy ? t("paying") : t("pay")}
          </Button>
          <p className="mt-3 text-center text-xs text-ivory/70">{t("secureNote")}</p>
        </div>
      </div>
    </StepShell>
  );
}
