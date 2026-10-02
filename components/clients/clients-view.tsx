"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, PageHeader, StatCard } from "@/components/ui/primitives";
import { formatSar } from "@/lib/pricing/calculate";
import { makeFormatters } from "@/lib/admin/format";
import { useDemo, useDemoUser } from "@/lib/demo/store";
import type { DemoState } from "@/lib/demo/types";
import { AddClientForm } from "./add-client-form";
import { ClientCard, ClientDetail } from "./client-card";
import { TeamSection } from "./team-section";

export interface ClientStats {
  client: DemoState["clients"][number];
  events: DemoState["events"];
  guests: number;
  spend: number;
  upcoming?: DemoState["events"][number];
}

export function clientStats(s: DemoState, now: number, plannerId: string | null): ClientStats[] {
  return s.clients
    .filter((c) => plannerId === null || c.plannerId === plannerId)
    .map((client) => {
      const events = s.events.filter((e) => e.clientId === client.id).sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
      const ids = new Set(events.map((e) => e.id));
      return {
        client, events,
        guests: s.guests.filter((g) => ids.has(g.eventId)).length,
        spend: s.orders.filter((o) => o.status === "paid" && ids.has(o.eventId)).reduce((a, o) => a + o.total, 0),
        upcoming: events.find((e) => Date.parse(e.startsAt) >= now && e.status !== "done"),
      };
    });
}

/** Planner workspace: client sub-accounts, multi-event overview and team access. Admin sees every planner's clients. */
export function ClientsView() {
  const t = useTranslations("admin.clients");
  const locale = useLocale();
  const f = makeFormatters(locale);
  const { state } = useDemo();
  const { user } = useDemoUser();
  const [now] = useState(() => Date.now());
  const [selected, setSelected] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const isAdmin = user?.role === "admin";
  const rows = useMemo(() => clientStats(state, now, isAdmin ? null : (user?.id ?? "")), [state, now, isAdmin, user?.id]);
  if (!user) return null;

  const totals = {
    clients: rows.length,
    events: rows.reduce((a, r) => a + r.events.length, 0),
    upcoming: rows.filter((r) => r.upcoming).length,
    guests: rows.reduce((a, r) => a + r.guests, 0),
    spend: rows.reduce((a, r) => a + r.spend, 0),
  };
  const active = rows.find((r) => r.client.id === selected) ?? null;
  const plannerName = (id: string) => state.users.find((u) => u.id === id)?.org ?? state.users.find((u) => u.id === id)?.name;

  return (
    <div>
      <PageHeader title={t("title")} lead={isAdmin ? t("leadAdmin") : t("lead")} />

      <section aria-label={t("summaryLabel")} className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard tone="navy" label={t("summary.clients")} value={f.num(totals.clients)} />
        <StatCard tone="sage" label={t("summary.events")} value={f.num(totals.events)} hint={t("summary.eventsHint")} />
        <StatCard tone="gold" label={t("summary.upcoming")} value={f.num(totals.upcoming)} hint={t("summary.upcomingHint")} />
        <StatCard tone="navy" label={t("summary.guests")} value={f.num(totals.guests)} />
        <StatCard tone="rose" label={t("summary.spend")} value={formatSar(totals.spend, locale)} hint={t("summary.spendHint")} />
      </section>
      <p className="mt-4 max-w-3xl text-sm text-oud-soft">{t("multiEvent")}</p>

      <p className="sr-only" role="status" aria-live="polite">{notice}</p>

      <section className="mt-10" aria-labelledby="clients-h">
        <h2 id="clients-h" className="font-display text-2xl font-bold text-navy">{t("listTitle")}</h2>
        {rows.length === 0 ? (
          <div className="mt-4"><EmptyState title={t("emptyTitle")} body={t("emptyBody")} /></div>
        ) : (
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((r) => (
              <ClientCard key={r.client.id} row={r} f={f} selected={selected === r.client.id} plannerName={isAdmin ? plannerName(r.client.plannerId) : undefined}
                onSelect={() => setSelected(selected === r.client.id ? null : r.client.id)} />
            ))}
          </ul>
        )}
        {active && (
          <div id="client-detail" className="mt-5">
            <ClientDetail row={active} f={f} />
          </div>
        )}
      </section>

      {!isAdmin && (
        <>
          <section className="mt-10" aria-labelledby="add-h">
            <h2 id="add-h" className="font-display text-2xl font-bold text-navy">{t("add.title")}</h2>
            <p className="mt-1 max-w-2xl text-sm text-oud-soft">{t("add.lead")}</p>
            <div className="mt-4 max-w-2xl"><AddClientForm plannerId={user.id} onAdded={(name, id) => { setSelected(id); setNotice(t("add.done", { name })); }} /></div>
          </section>
          <TeamSection planner={user} state={state} onNotice={setNotice} />
        </>
      )}
      {isAdmin && <p className="mt-10 rounded-3xl border border-dashed border-line bg-sand/50 p-6 text-sm text-oud-soft">{t("adminNote")}</p>}
      {!isAdmin && rows.length > 0 && (
        <div className="mt-8"><ButtonLink href="/events/new" variant="ghost">{t("newEventNoClient")}</ButtonLink></div>
      )}
    </div>
  );
}
