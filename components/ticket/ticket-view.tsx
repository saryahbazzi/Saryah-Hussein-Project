"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { InvitationCard } from "@/components/invitation/invitation-card";
import { MusicToggle } from "@/components/invitation/music-toggle";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { Logo } from "@/components/ui/logo";
import { ButtonLink } from "@/components/ui/button";
import { PassCard } from "@/components/ticket/pass-card";
import { RsvpBlock } from "@/components/ticket/rsvp-block";
import { EventDetails } from "@/components/ticket/event-details";
import { useDemo } from "@/lib/demo/store";
import { formatLongDate, formatTime } from "@/lib/door/format";
import { verifyToken, type ParsedToken } from "@/lib/qr/token";
import { getTemplate } from "@/lib/templates/catalog";

function Frame({ children }: { children: React.ReactNode }) {
  const brand = useTranslations("meta")("brand");
  return (
    <div className="min-h-screen bg-sand">
      <div className="pattern-star mx-auto min-h-screen max-w-md bg-ivory shadow-lift">
        <header className="flex items-center justify-between px-5 py-3">
          <Logo name={brand} />
          <LanguageSwitcher />
        </header>
        <main id="main" className="px-5 pb-12">{children}</main>
      </div>
    </div>
  );
}

function Notice({ title, body, cta }: { title: string; body: string; cta: string }) {
  return (
    <Frame>
      <div role="alert" className="mt-10 rounded-3xl border border-line bg-white/80 px-6 py-10 text-center shadow-card">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose/10 text-2xl text-rose" aria-hidden="true">✕</span>
        <h1 className="mt-5 font-display text-2xl font-bold text-navy">{title}</h1>
        <p className="mt-3 text-oud-soft">{body}</p>
        <div className="mt-7 flex justify-center"><ButtonLink href="/" variant="ghost">{cta}</ButtonLink></div>
      </div>
    </Frame>
  );
}

function Skeleton({ label }: { label: string }) {
  return (
    <Frame>
      <div role="status" aria-label={label} className="mt-6 animate-pulse space-y-5">
        <div className="mx-auto h-8 w-2/3 rounded-full bg-sand-deep/60" />
        <div className="mx-auto aspect-[3/4] w-full max-w-xs rounded-3xl bg-sand-deep/60" />
        <div className="h-40 rounded-3xl bg-sand-deep/40" />
        <span className="sr-only">{label}</span>
      </div>
    </Frame>
  );
}

/** What a guest sees after tapping the link in WhatsApp: their invitation, RSVP and entry QR. */
export function TicketView({ token }: { token: string }) {
  const t = useTranslations("ticket");
  const locale = useLocale();
  const { ready, state } = useDemo();
  const [parsed, setParsed] = useState<ParsedToken | null | undefined>(undefined);

  useEffect(() => {
    let live = true;
    verifyToken(token).then((p) => { if (live) setParsed(p); }).catch(() => { if (live) setParsed(null); });
    return () => { live = false; };
  }, [token]);

  if (parsed === null) return <Notice title={t("invalid.title")} body={t("invalid.body")} cta={t("invalid.home")} />;
  if (parsed === undefined || !ready) return <Skeleton label={t("loading")} />;

  const guest = state.guests.find((g) => g.id === parsed.guestId && g.eventId === parsed.eventId);
  const ev = guest && state.events.find((e) => e.id === guest.eventId);
  if (!guest || !ev) return <Notice title={t("notFound.title")} body={t("notFound.body")} cta={t("notFound.home")} />;

  // Prefer the catalog (typed motifs); fall back to the stored template's kind for admin-created ones.
  const stored = state.templates.find((x) => x.slug === ev.templateSlug);
  const spec = getTemplate(ev.templateSlug) ?? { kind: stored?.kind ?? "static", motif: "star" as const, palette: ev.customization.palette };
  const cardLang = ev.customization.language === "both" ? (locale === "en" ? "en" : "ar") : ev.customization.language;
  const partyText = t("party", { count: guest.partySize });
  const checkedInText = guest.checkedInAt ? t("pass.checkedIn", { time: formatTime(guest.checkedInAt, locale) }) : undefined;
  const hosts = ev.customization.hosts;

  return (
    <Frame>
      <div className="pt-2 text-center">
        <p className="text-sm font-medium text-gold-ink">{t("greetingLead")}</p>
        <h1 className="mt-1 font-display text-3xl font-bold text-navy">{t("greeting", { name: guest.name })}</h1>
      </div>

      <div className="mx-auto mt-6 max-w-xs">
        <InvitationCard
          spec={spec}
          palette={ev.customization.palette}
          lang={cardLang}
          animate
          content={{
            eyebrow: ev.customization.headline,
            title: ev.title,
            host: hosts,
            message: ev.customization.message || undefined,
            date: `${formatLongDate(ev.startsAt, cardLang)} · ${formatTime(ev.startsAt, cardLang)}`,
            venue: ev.venue,
          }}
        />
        {spec.kind !== "static" && (
          <div className="mt-4 flex justify-center">
            <MusicToggle onLabel={t("music.on")} offLabel={t("music.off")} />
          </div>
        )}
      </div>

      <div className="mt-8 space-y-6">
        {guest.status === "confirmed" && (
          <PassCard token={token} name={guest.name} partyText={partyText} eventTitle={ev.title} checkedInText={checkedInText} />
        )}
        <RsvpBlock guestId={guest.id} status={guest.status} hosts={hosts} locked={!!guest.checkedInAt} />
        <EventDetails event={ev} guestId={guest.id} guestName={guest.name} partyText={partyText} />
      </div>
    </Frame>
  );
}
