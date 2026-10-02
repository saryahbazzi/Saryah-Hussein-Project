"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { InvitationCard } from "@/components/invitation/invitation-card";
import { ButtonLink, Button } from "@/components/ui/button";
import { SegmentBar } from "@/components/ui/primitives";
import { guestsOf } from "@/lib/demo/actions";
import { useDemo } from "@/lib/demo/store";
import type { CardSpec } from "@/lib/templates/catalog";
import type { WizardState } from "./model";
import { buildCardContent, cardLang } from "./card";

export function Success({ eventId, state, spec, onAnother }: { eventId: string; state: WizardState; spec: CardSpec; onAnother: () => void }) {
  const t = useTranslations("wizard.success");
  const occ = useTranslations("occasions");
  const ph = useTranslations("wizard.placeholders");
  const { state: demo } = useDemo();
  const head = useRef<HTMLHeadingElement>(null);
  useEffect(() => { head.current?.focus(); }, []);
  const guests = guestsOf(demo, eventId);
  const sent = guests.filter((g) => g.status !== "pending").length;
  const done = guests.length > 0 && sent >= guests.length;
  const { details: d, custom: c } = state;

  return (
    <section className="mx-auto max-w-3xl text-center">
      <style>{`@keyframes dw-pop { from { opacity: 0; transform: translateY(14px) scale(.96); } to { opacity: 1; transform: none; } } @media (prefers-reduced-motion: no-preference) { .dw-pop { animation: dw-pop .8s cubic-bezier(.2,.8,.2,1) both; } }`}</style>
      <div className="dw-pop mx-auto w-56 sm:w-64">
        <InvitationCard spec={spec} palette={c.palette ?? spec.palette} lang={cardLang(c)} content={buildCardContent(d, c, occ(`items.${d.occasion}`), { hosts: ph("hosts"), headline: ph("headline"), date: ph("date"), venue: ph("venue") })} />
      </div>
      <p aria-hidden="true" className="mt-8 text-2xl text-gold">✦ ✦ ✦</p>
      <h2 ref={head} tabIndex={-1} className="mt-2 font-display text-4xl font-bold text-navy outline-none sm:text-5xl">{t("title")}</h2>
      <p className="mx-auto mt-3 max-w-xl text-lg text-oud-soft">{t("lead", { title: d.title })}</p>

      <div className="mx-auto mt-8 max-w-md rounded-3xl border border-line bg-white/70 p-5 text-start shadow-card" aria-live="polite">
        <p className="font-semibold text-navy">{done ? t("sentAll", { count: sent }) : t("sending")}</p>
        <p className="mb-3 text-sm text-oud-soft">{t("progress", { sent, total: guests.length })}</p>
        <SegmentBar label={t("progress", { sent, total: guests.length })} segments={[{ value: sent, className: "bg-sage" }, { value: Math.max(guests.length - sent, 0), className: "bg-transparent" }]} />
      </div>

      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <ButtonLink href={`/dashboard/events/${eventId}`}>{t("openDashboard")}</ButtonLink>
        <Button type="button" variant="ghost" onClick={onAnother}>{t("another")}</Button>
      </div>
    </section>
  );
}
