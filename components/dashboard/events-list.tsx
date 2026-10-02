"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import clsx from "clsx";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, Input, PageHeader, Select, StatCard } from "@/components/ui/primitives";
import { computeStats } from "@/lib/demo/actions";
import { useDemo, useDemoUser } from "@/lib/demo/store";
import { bucketOf, eventsFor, percent, sortForBucket, type EventBucket } from "./event-utils";
import { EventCard } from "./event-card";
import { LiveNumber } from "./live-number";
import { useFmt } from "./use-fmt";

const TABS: EventBucket[] = ["upcoming", "past", "drafts"];

export function EventsList() {
  const t = useTranslations("dashboard.list");
  const { state } = useDemo();
  const { user } = useDemoUser();
  const f = useFmt();
  const [tab, setTab] = useState<EventBucket>("upcoming");
  const [query, setQuery] = useState("");
  const [client, setClient] = useState("all");
  const now = Date.now();

  const mine = useMemo(() => (user ? eventsFor(state.events, user) : []), [state.events, user]);
  const isPlanner = user?.role === "planner";
  const isAdmin = user?.role === "admin";
  const myClients = state.clients.filter((c) => c.plannerId === user?.id);

  const scoped = useMemo(
    () => mine.filter((e) => client === "all" || (client === "none" ? !e.clientId : e.clientId === client)),
    [mine, client],
  );

  const counts = useMemo(() => {
    const c: Record<EventBucket, number> = { upcoming: 0, past: 0, drafts: 0 };
    for (const e of scoped) c[bucketOf(e, now)]++;
    return c;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scoped]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const inTab = scoped.filter((e) => bucketOf(e, now) === tab && (!q || e.title.toLowerCase().includes(q) || e.customization.hosts.toLowerCase().includes(q)));
    return sortForBucket(inTab, tab);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scoped, tab, query]);

  const totals = useMemo(() => {
    const ids = new Set(scoped.map((e) => e.id));
    const guests = state.guests.filter((g) => ids.has(g.eventId));
    const s = computeStats(guests);
    return {
      events: scoped.length,
      guests: guests.length,
      rate: percent(s.confirmed, s.sent),
      messages: state.messages.filter((m) => ids.has(m.eventId) && m.kind !== "reply").length,
    };
  }, [scoped, state.guests, state.messages]);

  if (!user) return null;

  const groups = isPlanner && client === "all"
    ? [...new Set(shown.map((e) => e.clientId ?? ""))].map((id) => ({
        id,
        label: id ? (state.clients.find((c) => c.id === id)?.name ?? "") : t("ownEvents"),
        items: shown.filter((e) => (e.clientId ?? "") === id),
      })).sort((a, b) => a.label.localeCompare(b.label))
    : [{ id: "", label: "", items: shown }];

  const firstName = user.name.split(" ")[0];

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
      <PageHeader
        title={t("greeting", { name: firstName })}
        lead={t(isAdmin ? "leadAdmin" : isPlanner ? "leadPlanner" : "lead")}
        actions={<ButtonLink href="/events/new">{t("newEvent")}</ButtonLink>}
      />

      <section aria-label={t("overview")} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={t("totals.events")} value={<LiveNumber value={totals.events} />} />
        <StatCard label={t("totals.guests")} value={<LiveNumber value={totals.guests} />} tone="gold" />
        <StatCard label={t("totals.rate")} value={<><LiveNumber value={totals.rate} />%</>} tone="sage" hint={t("totals.rateHint")} />
        <StatCard label={t("totals.messages")} value={<LiveNumber value={totals.messages} />} tone="rose" />
      </section>

      {mine.length === 0 ? (
        <div className="mt-8">
          <EmptyState title={t("empty.title")} body={t("empty.body")} action={<ButtonLink href="/events/new">{t("empty.cta")}</ButtonLink>} />
        </div>
      ) : (
        <>
          <div className="mt-8 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div role="group" aria-label={t("tabsLabel")} className="flex flex-wrap gap-2">
              {TABS.map((k) => (
                <button
                  key={k}
                  type="button"
                  aria-pressed={tab === k}
                  onClick={() => setTab(k)}
                  className={clsx(
                    "inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition",
                    tab === k ? "border-navy bg-navy text-ivory" : "border-line bg-white/70 text-oud hover:border-oud/40",
                  )}
                >
                  {t(`tabs.${k}`)}
                  <span className={clsx("rounded-full px-2 py-0.5 text-xs tabular-nums", tab === k ? "bg-ivory/20" : "bg-sand")}>{f.num(counts[k])}</span>
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              {isPlanner && (
                <div className="sm:w-56">
                  <label htmlFor="client-filter" className="sr-only">{t("clientFilter")}</label>
                  <Select id="client-filter" value={client} onChange={(e) => setClient(e.target.value)}>
                    <option value="all">{t("allClients")}</option>
                    {myClients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    <option value="none">{t("ownEvents")}</option>
                  </Select>
                </div>
              )}
              <div className="sm:w-64">
                <label htmlFor="event-search" className="sr-only">{t("search")}</label>
                <Input id="event-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("search")} />
              </div>
            </div>
          </div>

          <p className="mt-4 text-sm text-oud-soft" aria-live="polite">{t("resultCount", { count: shown.length, n: f.num(shown.length) })}</p>

          {shown.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                title={t(query ? "noMatch.title" : `emptyTab.${tab}.title`)}
                body={t(query ? "noMatch.body" : `emptyTab.${tab}.body`)}
                action={!query && tab !== "past" ? <ButtonLink href="/events/new">{t("newEvent")}</ButtonLink> : undefined}
              />
            </div>
          ) : (
            groups.map((g) => (
              <section key={g.id || "own"} className="mt-6" aria-label={g.label || undefined}>
                {isPlanner && client === "all" && (
                  <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold text-navy">
                    <span className="h-px w-6 bg-gold" aria-hidden="true" />
                    {g.label}
                    <span className="text-sm font-medium text-oud-soft">({f.num(g.items.length)})</span>
                  </h2>
                )}
                <div className="grid gap-5 md:grid-cols-2">
                  {g.items.map((e) => (
                    <EventCard
                      key={e.id}
                      ev={e}
                      clientName={isPlanner ? undefined : e.clientId ? state.clients.find((c) => c.id === e.clientId)?.name : undefined}
                      ownerName={isAdmin ? state.users.find((u) => u.id === e.ownerId)?.name : undefined}
                    />
                  ))}
                </div>
              </section>
            ))
          )}
        </>
      )}
    </div>
  );
}
