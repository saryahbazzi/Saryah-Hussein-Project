"use client";

import { useTranslations } from "next-intl";
import { QrCode } from "@/components/qr/qr-code";

/** The guest's personal entry pass: an elegant ticket with a perforated divider and the QR. */
export function PassCard({ token, name, partyText, eventTitle, checkedInText }: {
  token: string;
  name: string;
  partyText: string;
  eventTitle: string;
  checkedInText?: string;
}) {
  const t = useTranslations("ticket.pass");
  const used = !!checkedInText;
  return (
    <section aria-labelledby="pass-title" className="relative overflow-hidden rounded-[2rem] bg-navy text-ivory shadow-lift">
      <div className="pattern-star pointer-events-none absolute inset-0 opacity-10" aria-hidden="true" />
      <div className="relative px-6 pt-7 text-center">
        <p className="text-xs font-semibold tracking-[0.2em] text-gold-bright">{t("eyebrow")}</p>
        <p className="mt-2 font-display text-2xl font-bold leading-snug">{eventTitle}</p>
        <p className="mt-4 text-sm text-ivory/70">{t("guest")}</p>
        <p className="font-display text-3xl font-bold leading-tight">{name}</p>
        <p className="mt-2 inline-flex rounded-full border border-gold/50 px-3 py-1 text-sm font-semibold text-gold-bright">{partyText}</p>
      </div>

      <div className="relative my-6" aria-hidden="true">
        <div className="border-t-2 border-dashed border-ivory/25" />
        <span className="absolute -start-3.5 -top-3.5 h-7 w-7 rounded-full bg-ivory" />
        <span className="absolute -end-3.5 -top-3.5 h-7 w-7 rounded-full bg-ivory" />
      </div>

      <div className="relative px-6 pb-7 text-center">
        <div className="relative mx-auto w-fit rounded-3xl bg-white p-2 shadow-card">
          <QrCode value={token} size={216} label={t("qrLabel", { name })} level="Q" dimmed={used} />
          {used && (
            <span className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-sage text-3xl text-white shadow-lift">✓</span>
            </span>
          )}
        </div>
        <h2 id="pass-title" className="mt-5 font-display text-xl font-bold">{t("title")}</h2>
        {used ? (
          <div role="status" className="mt-3 rounded-2xl bg-ivory/10 px-4 py-3">
            <p className="font-semibold text-gold-bright">{checkedInText}</p>
            <p className="mt-0.5 text-sm text-ivory/75">{t("checkedInHint")}</p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
