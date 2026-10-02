"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/primitives";
import { EventStatusBadge } from "@/components/admin/shared";
import { formatSar } from "@/lib/pricing/calculate";
import type { Formatters } from "@/lib/admin/format";
import { formatSaudiMobile } from "@/lib/phone/saudi";
import type { ClientStats } from "./clients-view";

export function ClientCard({ row, f, selected, onSelect, plannerName }: { row: ClientStats; f: Formatters; selected: boolean; onSelect: () => void; plannerName?: string }) {
  const t = useTranslations("admin.clients");
  const locale = useLocale();
  return (
    <li className={`flex flex-col rounded-3xl border bg-white/70 p-5 shadow-card ${selected ? "border-gold ring-2 ring-gold/40" : "border-line"}`}>
      <h3 className="font-display text-xl font-bold text-navy">{row.client.name}</h3>
      {plannerName && <p className="text-xs text-oud-soft">{t("planner", { name: plannerName })}</p>}
      {row.client.contact && <p className="mt-0.5 text-sm text-oud-soft"><bdi dir="ltr">{formatSaudiMobile(row.client.contact)}</bdi></p>}
      <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-2xl bg-sand/60 px-2 py-2"><dt className="text-xs text-oud-soft">{t("card.events")}</dt><dd className="font-display text-xl font-bold tabular-nums text-navy">{f.num(row.events.length)}</dd></div>
        <div className="rounded-2xl bg-sand/60 px-2 py-2"><dt className="text-xs text-oud-soft">{t("card.guests")}</dt><dd className="font-display text-xl font-bold tabular-nums text-navy">{f.num(row.guests)}</dd></div>
        <div className="rounded-2xl bg-sand/60 px-2 py-2"><dt className="text-xs text-oud-soft">{t("card.spend")}</dt><dd className="font-display text-base font-bold tabular-nums text-navy">{formatSar(row.spend, locale)}</dd></div>
      </dl>
      <p className="mt-3 text-sm text-oud-soft">
        {row.upcoming ? t("card.upcoming", { title: row.upcoming.title, date: f.date(row.upcoming.startsAt) }) : t("card.noUpcoming")}
      </p>
      <button
        type="button"
        aria-expanded={selected}
        aria-controls="client-detail"
        onClick={onSelect}
        className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full border border-oud/25 px-5 text-sm font-semibold text-oud hover:border-oud hover:bg-oud/5"
      >
        {selected ? t("card.hide") : t("card.view")}
      </button>
    </li>
  );
}

export function ClientDetail({ row, f }: { row: ClientStats; f: Formatters }) {
  const t = useTranslations("admin.clients");
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="font-display text-xl font-bold text-navy">{t("detail.title", { name: row.client.name })}</h3>
        <ButtonLink href={`/events/new?client=${row.client.id}`} variant="gold" className="min-h-11">{t("detail.newEvent")}</ButtonLink>
      </div>
      {row.events.length === 0 ? (
        <p className="mt-3 text-sm text-oud-soft">{t("detail.empty")}</p>
      ) : (
        <ul className="mt-4 divide-y divide-line rounded-2xl border border-line bg-white">
          {row.events.map((e) => (
            <li key={e.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3">
              <Link href={`/dashboard/events/${e.id}`} className="min-w-0 flex-1 font-semibold text-navy underline-offset-4 hover:underline">{e.title}</Link>
              <EventStatusBadge status={e.status} />
              <span className="text-sm text-oud-soft">{f.date(e.startsAt)}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
