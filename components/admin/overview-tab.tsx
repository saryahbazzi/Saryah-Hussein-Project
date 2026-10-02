"use client";

import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/primitives";
import { formatSar } from "@/lib/pricing/calculate";
import { makeFormatters } from "@/lib/admin/format";
import {
  MESSAGE_GROUPS, computeKpis, eventsByCity, eventsByOccasion, messagesByMonth, revenueByMonth, topCustomers, VAT_PCT,
} from "@/lib/admin/metrics";
import { OCCASIONS } from "@/lib/templates/catalog";
import type { City, DemoState } from "@/lib/demo/types";
import { BarChart, HBars, StackedBarChart } from "./charts";
import { Kpi, Panel } from "./shared";

export function OverviewTab({ state, now, onGoto }: { state: DemoState; now: number; onGoto: (tab: "customers") => void }) {
  const t = useTranslations("admin");
  const roles = useTranslations("app.roles");
  const occ = useTranslations("occasions.items");
  const locale = useLocale();
  const f = makeFormatters(locale);
  const sar = (n: number) => formatSar(n, locale);
  const k = computeKpis(state, now);
  const rev = revenueByMonth(state, now, 6);
  const msgs = messagesByMonth(state.messages, now, 6);
  const cities = eventsByCity(state.events);
  const occasions = eventsByOccasion(state.events);
  const top = topCustomers(state, 5);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Kpi tone="navy" label={t("kpi.customers")} value={f.num(k.customers.total)} hint={t("kpi.customersHint", { hosts: k.customers.hosts, planners: k.customers.planners })} delta={k.customers.delta} pct={f.pct} />
        <Kpi tone="sage" label={t("kpi.events")} value={f.num(k.events.total)} hint={t("kpi.eventsHint", { live: k.events.live, done: k.events.done, draft: k.events.draft })} delta={k.events.delta} pct={f.pct} />
        <Kpi tone="gold" label={t("kpi.guests")} value={f.num(k.guests.total)} hint={t("kpi.guestsHint")} delta={k.guests.delta} pct={f.pct} />
        <Kpi tone="navy" label={t("kpi.revenue")} value={sar(k.revenue.incVat)} hint={t("kpi.revenueHint", { amount: sar(k.revenue.exVat), vat: VAT_PCT })} delta={k.revenue.delta} pct={f.pct} />
        <Kpi tone="rose" label={t("kpi.messages")} value={f.num(k.messages.total)} hint={t("kpi.messagesHint")} delta={k.messages.delta} pct={f.pct} />
        <Kpi tone="gold" label={t("kpi.aov")} value={sar(k.aov.value)} hint={t("kpi.aovHint")} delta={k.aov.delta} pct={f.pct} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title={t("charts.revenueTitle")} lead={t("charts.revenueLead", { vat: VAT_PCT })}>
          <BarChart
            caption={t("charts.revenueCaption")}
            labelHeader={t("charts.month")}
            valueHeader={t("charts.revenueValue")}
            data={rev.map((m) => ({ label: f.month(m.key), value: m.incVat }))}
            formatValue={sar}
            formatLabel={(n) => (n === 0 ? "0" : f.compact(n))}
          />
        </Panel>
        <Panel title={t("charts.messagesTitle")} lead={t("charts.messagesLead")}>
          <StackedBarChart
            caption={t("charts.messagesCaption")}
            labelHeader={t("charts.month")}
            series={MESSAGE_GROUPS.map((g) => ({ key: g, label: t(`charts.groups.${g}`) }))}
            rows={msgs.map((m) => ({ label: f.month(m.key), total: m.total, values: m.byGroup }))}
            formatValue={f.num}
          />
        </Panel>
        <Panel title={t("charts.cityTitle")}>
          <HBars tone="navy" formatValue={f.num} data={(["riyadh", "jeddah"] as City[]).map((c) => ({ label: t(`city.${c}`), value: cities[c] ?? 0 }))} />
        </Panel>
        <Panel title={t("charts.occasionTitle")}>
          <HBars tone="gold" formatValue={f.num} data={OCCASIONS.map((o) => ({ label: occ(o), value: occasions[o] ?? 0 })).sort((a, b) => b.value - a.value)} />
        </Panel>
      </div>

      <Panel title={t("top.title")} lead={t("top.lead")}>
        {top.length === 0 ? <p className="text-sm text-oud-soft">{t("top.empty")}</p> : (
          <ol className="divide-y divide-line">
            {top.map((r, i) => (
              <li key={r.user.id} className="flex items-center gap-3 py-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sand text-sm font-bold text-navy" aria-hidden="true">{f.num(i + 1)}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-navy">{r.user.org ?? r.user.name}</p>
                  <p className="text-xs text-oud-soft">{t("top.meta", { count: r.events.length })}</p>
                </div>
                <Badge tone={r.user.role === "planner" ? "gold" : "sky"}>{roles(r.user.role)}</Badge>
                <span className="font-semibold tabular-nums text-navy">{sar(r.spend)}</span>
              </li>
            ))}
          </ol>
        )}
        <p className="mt-3 text-xs text-oud-soft"><button type="button" onClick={() => onGoto("customers")} className="inline-flex min-h-11 items-center font-semibold text-gold-ink underline underline-offset-4">{t("top.all")}</button></p>
      </Panel>
    </div>
  );
}
