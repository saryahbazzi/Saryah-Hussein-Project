"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { EmptyState, Input, Select } from "@/components/ui/primitives";
import { formatSar } from "@/lib/pricing/calculate";
import { makeFormatters } from "@/lib/admin/format";
import { eventRows } from "@/lib/admin/metrics";
import { OCCASIONS } from "@/lib/templates/catalog";
import type { DemoState } from "@/lib/demo/types";
import { EventStatusBadge, TableWrap, tdClass, thClass } from "./shared";

export function EventsTab({ state }: { state: DemoState }) {
  const t = useTranslations("admin.events");
  const a = useTranslations("admin");
  const occ = useTranslations("occasions.items");
  const locale = useLocale();
  const f = makeFormatters(locale);
  const sar = (n: number) => formatSar(n, locale);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [city, setCity] = useState("all");
  const [occasion, setOccasion] = useState("all");

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return eventRows(state)
      .filter((r) => status === "all" || r.event.status === status)
      .filter((r) => city === "all" || r.event.city === city)
      .filter((r) => occasion === "all" || r.event.occasion === occasion)
      .filter((r) => !needle || [r.event.title, r.owner?.name ?? "", r.owner?.org ?? "", r.clientName ?? ""].some((x) => x.toLowerCase().includes(needle)))
      .sort((x, y) => Date.parse(y.event.startsAt) - Date.parse(x.event.startsAt));
  }, [state, q, status, city, occasion]);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_10rem_10rem_10rem]">
        <div className="sm:col-span-2 lg:col-span-1">
          <label htmlFor="ev-q" className="sr-only">{t("search")}</label>
          <Input id="ev-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("searchPlaceholder")} />
        </div>
        <div>
          <label htmlFor="ev-status" className="sr-only">{t("statusFilter")}</label>
          <Select id="ev-status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">{t("allStatuses")}</option>
            {(["live", "draft", "done"] as const).map((s) => <option key={s} value={s}>{a(`status.${s}`)}</option>)}
          </Select>
        </div>
        <div>
          <label htmlFor="ev-city" className="sr-only">{t("cityFilter")}</label>
          <Select id="ev-city" value={city} onChange={(e) => setCity(e.target.value)}>
            <option value="all">{t("allCities")}</option>
            {(["riyadh", "jeddah"] as const).map((c) => <option key={c} value={c}>{a(`city.${c}`)}</option>)}
          </Select>
        </div>
        <div>
          <label htmlFor="ev-occ" className="sr-only">{t("occasionFilter")}</label>
          <Select id="ev-occ" value={occasion} onChange={(e) => setOccasion(e.target.value)}>
            <option value="all">{t("allOccasions")}</option>
            {OCCASIONS.map((o) => <option key={o} value={o}>{occ(o)}</option>)}
          </Select>
        </div>
      </div>
      <p className="text-sm text-oud-soft" role="status" aria-live="polite">{t("count", { count: rows.length })}</p>

      {rows.length === 0 ? <EmptyState title={t("emptyTitle")} body={t("emptyBody")} /> : (
        <>
          <TableWrap>
            <table className="w-full min-w-[60rem] border-collapse">
              <thead className="border-b border-line bg-sand/60">
                <tr>
                  {(["event", "owner", "client", "status", "date", "city", "guests", "confirmed", "attended", "total"] as const).map((c) => <th key={c} scope="col" className={thClass}>{t(`cols.${c}`)}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((r) => (
                  <tr key={r.event.id}>
                    <th scope="row" className={`${tdClass} text-start`}>
                      <Link href={`/dashboard/events/${r.event.id}`} className="inline-flex min-h-11 items-center font-semibold text-navy underline-offset-4 hover:underline">{r.event.title}</Link>
                      <span className="block text-xs font-normal text-oud-soft">{occ(r.event.occasion)}</span>
                    </th>
                    <td className={tdClass}>{r.owner?.org ?? r.owner?.name ?? "—"}</td>
                    <td className={tdClass}>{r.clientName ?? "—"}</td>
                    <td className={tdClass}><EventStatusBadge status={r.event.status} /></td>
                    <td className={`${tdClass} whitespace-nowrap`}>{f.date(r.event.startsAt)}</td>
                    <td className={tdClass}>{a(`city.${r.event.city}`)}</td>
                    <td className={`${tdClass} tabular-nums`}>{f.num(r.guests)}</td>
                    <td className={`${tdClass} tabular-nums`}>{f.num(r.confirmed)}</td>
                    <td className={`${tdClass} tabular-nums`}>{f.num(r.attended)}</td>
                    <td className={`${tdClass} whitespace-nowrap font-semibold tabular-nums text-navy`}>{r.orderTotal > 0 ? sar(r.orderTotal) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>

          <ul className="space-y-3 md:hidden">
            {rows.map((r) => (
              <li key={r.event.id} className="rounded-3xl border border-line bg-white/70 p-4 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <Link href={`/dashboard/events/${r.event.id}`} className="font-semibold text-navy underline-offset-4 hover:underline">{r.event.title}</Link>
                  <EventStatusBadge status={r.event.status} />
                </div>
                <p className="mt-1 text-xs text-oud-soft">{occ(r.event.occasion)} · {a(`city.${r.event.city}`)} · {f.date(r.event.startsAt)}</p>
                <p className="mt-1 text-xs text-oud-soft">{r.owner?.org ?? r.owner?.name ?? "—"}{r.clientName ? ` → ${r.clientName}` : ""}</p>
                <dl className="mt-3 grid grid-cols-4 gap-2 border-t border-line pt-3 text-center text-xs">
                  <div><dt className="text-oud-soft">{t("cols.guests")}</dt><dd className="font-semibold tabular-nums text-navy">{f.num(r.guests)}</dd></div>
                  <div><dt className="text-oud-soft">{t("cols.confirmed")}</dt><dd className="font-semibold tabular-nums text-navy">{f.num(r.confirmed)}</dd></div>
                  <div><dt className="text-oud-soft">{t("cols.attended")}</dt><dd className="font-semibold tabular-nums text-navy">{f.num(r.attended)}</dd></div>
                  <div><dt className="text-oud-soft">{t("cols.total")}</dt><dd className="font-semibold tabular-nums text-navy">{r.orderTotal > 0 ? sar(r.orderTotal) : "—"}</dd></div>
                </dl>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
