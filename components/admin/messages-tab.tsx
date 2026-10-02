"use client";

import { useLocale, useTranslations } from "next-intl";
import { Badge, StatCard } from "@/components/ui/primitives";
import { makeFormatters } from "@/lib/admin/format";
import { MESSAGE_GROUPS, deliveryFunnel, failureReasons, groupOfKind, recentMessages } from "@/lib/admin/metrics";
import type { DemoState } from "@/lib/demo/types";
import { HBars } from "./charts";
import { MessageStatusBadge, Panel, TableWrap, tdClass, thClass } from "./shared";

export function MessagesTab({ state }: { state: DemoState }) {
  const t = useTranslations("admin.messages");
  const locale = useLocale();
  const f = makeFormatters(locale);
  const funnel = deliveryFunnel(state.messages);
  const reasons = failureReasons(state);
  const recent = recentMessages(state.messages, 25);
  const replies = state.messages.filter((m) => m.kind === "reply").length;
  const byGroup = Object.fromEntries(MESSAGE_GROUPS.map((g) => [g, state.messages.filter((m) => groupOfKind(m.kind) === g).length]));
  const stages = [
    { key: "sent", value: funnel.sent },
    { key: "delivered", value: funnel.delivered },
    { key: "readOrReplied", value: funnel.readOrReplied },
  ] as const;
  const guestName = (id: string) => state.guests.find((g) => g.id === id)?.name ?? "—";
  const eventTitle = (id: string) => state.events.find((e) => e.id === id)?.title ?? "—";
  const kindLabel = (k: string) => t(`kinds.${k}` as "kinds.invite");
  const reasonLabel = (r: string) => (t.has(`reasons.${r}` as "reasons.unknown") ? t(`reasons.${r}` as "reasons.unknown") : r);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard tone="navy" label={t("outbound")} value={f.num(funnel.outbound)} hint={t("outboundHint")} />
        <StatCard tone="sage" label={t("delivered")} value={funnel.outbound ? f.pct(funnel.delivered / funnel.outbound) : "—"} hint={t("deliveredHint", { count: funnel.delivered })} />
        <StatCard tone="rose" label={t("failureRate")} value={f.pct(funnel.failureRate)} hint={t("failureHint", { count: funnel.failed })} />
        <StatCard tone="gold" label={t("replies")} value={f.num(replies)} hint={t("repliesHint")} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title={t("funnelTitle")} lead={t("funnelLead")}>
          <ol className="space-y-3">
            {stages.map((s, i) => (
              <li key={s.key}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span>{t(`funnel.${s.key}`)}</span>
                  <span className="font-semibold tabular-nums text-navy">{f.num(s.value)} <span className="text-xs font-normal text-oud-soft">({funnel.outbound ? f.pct(s.value / funnel.outbound) : "—"})</span></span>
                </div>
                <div className="mt-1 h-3 overflow-hidden rounded-full bg-sand" aria-hidden="true">
                  <div className={["bg-navy", "bg-sage", "bg-gold"][i] + " h-full rounded-full"} style={{ width: `${funnel.outbound ? (s.value / funnel.outbound) * 100 : 0}%` }} />
                </div>
              </li>
            ))}
          </ol>
        </Panel>
        <div className="space-y-6">
          <Panel title={t("byKindTitle")}>
            <HBars tone="navy" formatValue={f.num} data={MESSAGE_GROUPS.map((g) => ({ label: t(`groups.${g}`), value: byGroup[g] }))} />
          </Panel>
          <Panel title={t("reasonsTitle")} lead={t("reasonsLead", { rate: f.pct(funnel.failureRate) })}>
            {reasons.length === 0 ? <p className="text-sm text-oud-soft">{t("noFailures")}</p> : (
              <HBars tone="gold" formatValue={f.num} data={reasons.map((r) => ({ label: reasonLabel(r.reason), value: r.count }))} />
            )}
          </Panel>
        </div>
      </div>

      <section aria-labelledby="recent-h">
        <h3 id="recent-h" className="mb-3 font-display text-xl font-bold text-navy">{t("recentTitle")}</h3>
        <TableWrap>
          <table className="w-full min-w-[44rem] border-collapse">
            <thead className="border-b border-line bg-sand/60">
              <tr>{(["time", "kind", "status", "event", "guest"] as const).map((c) => <th key={c} scope="col" className={thClass}>{t(`cols.${c}`)}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-line">
              {recent.map((m) => (
                <tr key={m.id}>
                  <td className={`${tdClass} whitespace-nowrap`}>{f.dateTime(m.createdAt)}</td>
                  <td className={tdClass}><Badge tone="sky">{kindLabel(m.kind)}</Badge></td>
                  <td className={tdClass}><MessageStatusBadge status={m.status} /></td>
                  <td className={tdClass}>{eventTitle(m.eventId)}</td>
                  <td className={tdClass}>{guestName(m.guestId)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
        <ul className="space-y-3 md:hidden">
          {recent.map((m) => (
            <li key={m.id} className="rounded-2xl border border-line bg-white/70 p-4 shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge tone="sky">{kindLabel(m.kind)}</Badge>
                <MessageStatusBadge status={m.status} />
              </div>
              <p className="mt-2 text-sm font-medium text-navy">{guestName(m.guestId)}</p>
              <p className="text-xs text-oud-soft">{eventTitle(m.eventId)} · {f.dateTime(m.createdAt)}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
