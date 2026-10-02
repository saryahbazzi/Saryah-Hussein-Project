"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button, ButtonLink } from "@/components/ui/button";
import { Badge, EmptyState, StatCard } from "@/components/ui/primitives";
import { InvitationCard } from "@/components/invitation/invitation-card";
import { Link } from "@/i18n/navigation";
import { canAccess } from "@/lib/auth/roles";
import { computeStats, guestsOf } from "@/lib/demo/actions";
import { sendInvites } from "@/lib/demo/services";
import { useDemo, useDemoUser } from "@/lib/demo/store";
import { createToken } from "@/lib/qr/token";
import { expectedPeople, percent } from "./event-utils";
import { EventStatusBadge } from "./status-badge";
import { GuestTable } from "./guest-table";
import { LiveNumber } from "./live-number";
import { MessageLog } from "./message-log";
import { PrivacyPanel } from "./privacy-panel";
import { RemindersPanel } from "./reminders-panel";
import { RsvpBar } from "./rsvp-bar";
import { useCardProps } from "./use-card-props";
import { useExportGuests } from "./use-export";
import { useFmt } from "./use-fmt";
import type { DemoEvent } from "@/lib/demo/types";

const wrap = "mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10";

function BackLink() {
  const t = useTranslations("dashboard.detail");
  return (
    <Link href="/dashboard" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-oud-soft hover:text-navy">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 rtl:rotate-180" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
      {t("back")}
    </Link>
  );
}

export function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const t = useTranslations("dashboard.detail");
  const { state } = useDemo();
  const { user } = useDemoUser();
  const [leaving, setLeaving] = useState(false);
  const ev = state.events.find((e) => e.id === id);
  const allowed = !!user && !!ev && (user.role === "admin" || ev.ownerId === user.id);

  if (leaving) return <div className={wrap} role="status"><p className="text-oud-soft">{t("leaving")}</p></div>;
  if (!ev || !allowed) {
    return (
      <div className={wrap}>
        <BackLink />
        <div className="mt-4">
          <EmptyState title={t("notFound.title")} body={t("notFound.body")} action={<ButtonLink href="/dashboard">{t("notFound.cta")}</ButtonLink>} />
        </div>
      </div>
    );
  }
  return <Loaded ev={ev} onLeaving={() => setLeaving(true)} />;
}

function Loaded({ ev, onLeaving }: { ev: DemoEvent; onLeaving: () => void }) {
  const t = useTranslations("dashboard.detail");
  const { state } = useDemo();
  const { user } = useDemoUser();
  const f = useFmt();
  const card = useCardProps(ev);
  const exportCsv = useExportGuests();
  const guests = guestsOf(state, ev.id);
  const stats = computeStats(guests);
  const awaiting = stats.pending;
  const other = Math.max(0, stats.total - stats.confirmed - stats.declined - awaiting);
  const pendingToSend = guests.filter((g) => g.status === "pending").length;
  const people = expectedPeople(guests);
  const clientName = ev.clientId ? state.clients.find((c) => c.id === ev.clientId)?.name : undefined;
  const ownerName = user?.role === "admin" ? state.users.find((u) => u.id === ev.ownerId)?.name : undefined;

  // Sending
  const [sending, setSending] = useState(false);
  const [startedWith, setStartedWith] = useState(0);
  const [result, setResult] = useState("");
  async function send() {
    setSending(true);
    setStartedWith(pendingToSend);
    setResult("");
    const n = await sendInvites(ev.id);
    setSending(false);
    setResult(t("sendResult", { count: n, n: f.num(n) }));
  }

  // Link to the public ticket page, as the first confirmed guest sees it
  const viewGuest = useMemo(() => guests.find((g) => g.status === "confirmed") ?? guests.find((g) => g.sentAt) ?? guests[0], [guests]);
  const [token, setToken] = useState<{ guestId: string; value: string } | null>(null);
  const viewGuestId = viewGuest?.id;
  useEffect(() => {
    if (!viewGuestId) return;
    let live = true;
    createToken(ev.id, viewGuestId).then((value) => { if (live) setToken({ guestId: viewGuestId, value }); });
    return () => { live = false; };
  }, [ev.id, viewGuestId]);

  // Polite, debounced screen-reader announcement of live changes
  const summary = t("liveSummary", { confirmed: f.num(stats.confirmed), declined: f.num(stats.declined), pending: f.num(awaiting), delivered: f.num(stats.delivered) });
  const [announce, setAnnounce] = useState("");
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const h = setTimeout(() => setAnnounce(summary), 1500);
    return () => clearTimeout(h);
  }, [summary]);

  const legend = [
    { key: "confirmed", n: stats.confirmed, dot: "bg-sage" },
    { key: "declined", n: stats.declined, dot: "bg-rose" },
    { key: "awaiting", n: awaiting, dot: "bg-navy/25" },
    { key: "other", n: other, dot: "bg-oud-soft/30" },
  ] as const;

  return (
    <div className={wrap}>
      <BackLink />
      <header className="mt-4 grid gap-8 lg:grid-cols-[17rem_1fr] lg:items-start">
        <div className="mx-auto w-full max-w-[17rem] lg:mx-0">
          <InvitationCard spec={card.spec} palette={card.palette} content={card.content} lang={card.lang} />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <EventStatusBadge status={ev.status} />
            {clientName && <Badge tone="gold">{t("client", { name: clientName })}</Badge>}
            {ownerName && <Badge tone="sky">{t("owner", { name: ownerName })}</Badge>}
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold text-navy sm:text-4xl">{ev.title}</h1>
          <p className="mt-2 text-oud">{f.full(ev.startsAt)} · {f.time(ev.startsAt)}</p>
          <p className="text-oud-soft">
            {ev.venue}
            {ev.mapsUrl && <> · <a href={ev.mapsUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-gold-ink underline">{t("map")}</a></>}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            {pendingToSend > 0 && (
              <Button type="button" onClick={send} disabled={sending} aria-busy={sending}>
                {sending ? t("sending", { done: f.num(Math.max(0, startedWith - pendingToSend)), total: f.num(startedWith) }) : t("sendInvites", { count: pendingToSend, n: f.num(pendingToSend) })}
              </Button>
            )}
            {token && viewGuest && (
              <ButtonLink href={`/i/${token.value}`} target="_blank" rel="noopener" variant="ghost">{t("guestView")}</ButtonLink>
            )}
            <Button type="button" variant="ghost" disabled={guests.length === 0} onClick={() => exportCsv(ev, guests)}>{t("exportCsv")}</Button>
            {user && canAccess("checkin", user.role) && ev.status !== "draft" && (
              <ButtonLink href={`/checkin/${ev.id}`} variant="ghost">{t("checkin")}</ButtonLink>
            )}
          </div>
          <p className="mt-3 min-h-5 text-sm font-medium text-sage" role="status" aria-live="polite">{result}</p>
          {token && viewGuest && <p className="text-xs text-oud-soft">{t("guestViewHint", { name: viewGuest.name })}</p>}
        </div>
      </header>

      <section aria-labelledby="stats-h" className="mt-10">
        <h2 id="stats-h" className="mb-4 font-display text-2xl font-bold text-navy">{t("stats.title")}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <StatCard label={t("stats.sent")} value={<LiveNumber value={stats.sent} />} hint={t("stats.ofTotal", { total: f.num(stats.total) })} />
          <StatCard label={t("stats.delivered")} value={<LiveNumber value={stats.delivered} />} hint={t("stats.pct", { pct: f.num(percent(stats.delivered, stats.sent)) })} />
          <StatCard label={t("stats.confirmed")} value={<LiveNumber value={stats.confirmed} />} tone="sage" hint={t("stats.pct", { pct: f.num(percent(stats.confirmed, stats.total)) })} />
          <StatCard label={t("stats.declined")} value={<LiveNumber value={stats.declined} />} tone="rose" hint={t("stats.pct", { pct: f.num(percent(stats.declined, stats.total)) })} />
          <StatCard label={t("stats.pending")} value={<LiveNumber value={awaiting} />} tone="gold" hint={t("stats.pendingHint")} />
          <StatCard label={t("stats.attended")} value={<LiveNumber value={stats.attended} />} tone="sage" hint={t("stats.attendedHint", { confirmed: f.num(stats.confirmed) })} />
          <StatCard label={t("stats.people")} value={<LiveNumber value={people} />} hint={t("stats.peopleHint")} />
        </div>
        <div className="mt-5 rounded-2xl border border-line bg-white/70 p-4 shadow-card">
          <RsvpBar stats={stats} guests={guests} />
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm">
            {legend.map((l) => (
              <li key={l.key} className="inline-flex items-center gap-2 text-oud">
                <span className={`h-2.5 w-2.5 rounded-full ${l.dot}`} aria-hidden="true" />
                {t(`legend.${l.key}`)}
                <span className="font-semibold tabular-nums text-navy">{f.num(l.n)} · {f.num(percent(l.n, stats.total))}%</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">{announce}</div>
      </section>

      <div className="mt-10 space-y-8">
        <GuestTable eventId={ev.id} guests={guests} />
        <RemindersPanel ev={ev} />
        <MessageLog eventId={ev.id} />
        <PrivacyPanel ev={ev} guests={guests} onLeaving={onLeaving} />
      </div>
    </div>
  );
}
