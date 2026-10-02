"use client";

import { useId, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import clsx from "clsx";
import { InvitationCard } from "@/components/invitation/invitation-card";
import { Select } from "@/components/ui/primitives";
import { quickReplies, renderMessage, type MessageLocale } from "@/lib/messaging";
import { contextFor } from "@/lib/demo/services";
import { getTemplate, type CardSpec, type Palette } from "@/lib/templates/catalog";
import { isUsable, reviewGuests } from "@/lib/guests/parse";
import { buildCardContent, draftEvent } from "./card";
import type { WizardState } from "./model";

function FakeQr({ seed }: { seed: string }) {
  const cells = useMemo(() => {
    let h = [...seed].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 11);
    const n = 21;
    const out: [number, number][] = [];
    const finder = (x: number, y: number) => (x < 8 && y < 8) || (x > 12 && y < 8) || (x < 8 && y > 12);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      if (finder(x, y)) {
        const lx = x % 14, ly = y % 14;
        const edge = lx === 0 || ly === 0 || lx === 6 || ly === 6;
        const core = lx >= 2 && lx <= 4 && ly >= 2 && ly <= 4;
        if ((lx < 7 && ly < 7) && (edge || core)) out.push([x, y]);
        continue;
      }
      h = (h * 1103515245 + 12345) >>> 0;
      if ((h >> 16) % 2) out.push([x, y]);
    }
    return out;
  }, [seed]);
  return (
    <svg viewBox="0 0 21 21" className="size-28 rounded-lg bg-white p-1.5" aria-hidden="true" shapeRendering="crispEdges">
      {cells.map(([x, y]) => <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="#14213d" />)}
    </svg>
  );
}

function Frame({ title, subtitle, children, label }: { title: string; subtitle: string; children: React.ReactNode; label: string }) {
  return (
    <div role="group" aria-label={label} className="mx-auto w-full max-w-[22rem] rounded-[2.5rem] border-[10px] border-oud bg-oud shadow-lift">
      <div className="overflow-hidden rounded-[1.9rem] bg-[#efe6d8]">
        <div className="flex items-center gap-3 bg-[#0f4c45] px-4 py-3 text-white">
          <span aria-hidden="true" className="inline-flex size-9 items-center justify-center rounded-full bg-gold-bright font-display font-bold text-oud">د</span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{title}</p>
            <p className="text-[0.7rem] text-white/80">{subtitle}</p>
          </div>
        </div>
        <div className="max-h-[34rem] min-h-80 space-y-2 overflow-y-auto p-3">{children}</div>
      </div>
    </div>
  );
}

function Bubble({ children, time }: { children: React.ReactNode; time: string }) {
  return (
    <div className="max-w-[92%] rounded-2xl rounded-ss-sm bg-white p-1.5 text-sm text-oud shadow-sm">
      {children}
      <p className="px-1.5 pb-0.5 text-end text-[0.65rem] text-oud-soft"><bdi dir="ltr">{time}</bdi></p>
    </div>
  );
}

export function WhatsAppPreview({ state, spec, palette }: { state: WizardState; spec: CardSpec; palette: Palette }) {
  const t = useTranslations("wizard.preview");
  const occ = useTranslations("occasions");
  const ph = useTranslations("wizard.placeholders");
  const uiLocale = useLocale();
  const id = useId();
  const [lang, setLang] = useState<MessageLocale>(state.custom.language === "en" ? "en" : uiLocale === "en" && state.custom.language === "both" ? "en" : "ar");
  const [idx, setIdx] = useState(0);

  const guests = useMemo(() => reviewGuests(state.guests).filter(isUsable), [state.guests]);
  const guest = guests[Math.min(idx, guests.length - 1)] ?? { name: ph("guest"), e164: "+966501234567" };
  const ev = draftEvent(state.details, state.custom);
  const ctx = (url?: string) => contextFor(ev, { name: guest.name }, lang, url);
  const invite = renderMessage("invitation", lang, ctx());
  const r7 = renderMessage("reminder7d", lang, ctx());
  const r1 = renderMessage("reminder1d", lang, ctx());
  const ticketUrl = "https://dawati.app/i/…";
  const ticket = renderMessage("ticket", lang, ctx(ticketUrl));
  const dir = lang === "ar" ? "rtl" : "ltr";
  const specFull = getTemplate(spec.slug) ?? spec;
  const content = buildCardContent(state.details, { ...state.custom, language: lang }, occ(`items.${state.details.occasion}`), {
    hosts: ph("hosts"), headline: ph("headline"), date: ph("date"), venue: ph("venue"),
  });
  const step = (d: number) => setIdx((i) => (guests.length ? (i + d + guests.length) % guests.length : 0));

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end gap-4">
        {guests.length > 0 && (
          <div className="min-w-0 flex-1 basis-60">
            <label htmlFor={`${id}-guest`} className="mb-1.5 block text-sm font-semibold text-navy">{t("guest")}</label>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => step(-1)} aria-label={t("prev")} className="inline-flex size-12 shrink-0 items-center justify-center rounded-full border border-line bg-white hover:bg-sand"><span aria-hidden="true" className="rtl:rotate-180">‹</span></button>
              <Select id={`${id}-guest`} value={Math.min(idx, guests.length - 1)} onChange={(e) => setIdx(Number(e.target.value))}>
                {guests.map((g, i) => <option key={i} value={i}>{g.name}</option>)}
              </Select>
              <button type="button" onClick={() => step(1)} aria-label={t("next")} className="inline-flex size-12 shrink-0 items-center justify-center rounded-full border border-line bg-white hover:bg-sand"><span aria-hidden="true" className="rtl:rotate-180">›</span></button>
            </div>
          </div>
        )}
        <div role="group" aria-label={t("language")} className="inline-flex rounded-full border border-line bg-white p-1">
          {(["ar", "en"] as const).map((l) => (
            <button key={l} type="button" aria-pressed={lang === l} onClick={() => setLang(l)} className={clsx("min-h-11 min-w-20 rounded-full px-4 text-sm font-semibold", lang === l ? "bg-navy text-ivory" : "text-oud-soft hover:bg-sand")}>{t(`lang.${l}`)}</button>
          ))}
        </div>
      </div>

      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <p className="mb-3 text-center text-sm font-semibold text-navy">{t("invitationCaption")}</p>
          <Frame title={t("sender")} subtitle={t("verified")} label={t("invitationCaption")}>
            <div dir={dir} lang={lang}>
              <Bubble time="8:41 PM">
                <InvitationCard spec={specFull} palette={palette} lang={lang} animate={false} content={{ ...content, message: undefined }} className="!rounded-xl !shadow-none" />
                <p className="whitespace-pre-line px-1.5 pt-2 text-[0.82rem] leading-relaxed">{invite.text}</p>
              </Bubble>
              <div className="mt-1 max-w-[92%] space-y-1">
                {quickReplies(lang).map((b) => (
                  <div key={b.id} className="rounded-xl bg-white py-2.5 text-center text-sm font-semibold text-[#0b6fa4] shadow-sm">{b.label}</div>
                ))}
              </div>
            </div>
          </Frame>
        </div>
        <div>
          <p className="mb-3 text-center text-sm font-semibold text-navy">{t("followUpCaption")}</p>
          <Frame title={t("sender")} subtitle={t("verified")} label={t("followUpCaption")}>
            <div dir={dir} lang={lang} className="space-y-3">
              <div>
                <p className="mb-1 text-center text-[0.7rem] font-semibold text-oud-soft">{t("when.d7")}</p>
                <Bubble time="9:00 AM"><p className="whitespace-pre-line p-1.5 text-[0.82rem] leading-relaxed">{r7.text}</p></Bubble>
              </div>
              <div>
                <p className="mb-1 text-center text-[0.7rem] font-semibold text-oud-soft">{t("when.d1")}</p>
                <Bubble time="9:00 AM"><p className="whitespace-pre-line p-1.5 text-[0.82rem] leading-relaxed">{r1.text}</p></Bubble>
              </div>
              <div>
                <p className="mb-1 text-center text-[0.7rem] font-semibold text-oud-soft">{t("when.ticket")}</p>
                <Bubble time="8:44 PM">
                  <div className="flex justify-center rounded-xl bg-sand p-3"><FakeQr seed={guest.e164 ?? guest.name} /></div>
                  <p className="whitespace-pre-line px-1.5 pt-2 text-[0.82rem] leading-relaxed">{ticket.text.replace(ticketUrl, "").trim()}</p>
                  <p className="px-1.5 pb-1 text-[0.82rem] text-[#0b6fa4] underline"><bdi dir="ltr">{ticketUrl}</bdi></p>
                </Bubble>
              </div>
            </div>
          </Frame>
        </div>
      </div>
    </div>
  );
}
