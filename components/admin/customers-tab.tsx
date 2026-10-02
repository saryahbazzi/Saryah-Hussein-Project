"use client";

import { Fragment, useMemo, useState } from "react";
import clsx from "clsx";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Badge, EmptyState, Input, Select } from "@/components/ui/primitives";
import { formatSar } from "@/lib/pricing/calculate";
import { makeFormatters, type Formatters } from "@/lib/admin/format";
import { customerRows, type CustomerRow } from "@/lib/admin/metrics";
import type { DemoState } from "@/lib/demo/types";
import { EventStatusBadge, TableWrap, tdClass, thClass } from "./shared";

function Chevron({ open }: { open: boolean }) {
  return <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" className={clsx("transition-transform motion-reduce:transition-none", open && "rotate-180")}><path d="M2 5l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>;
}

function Detail({ row, state, f }: { row: CustomerRow; state: DemoState; f: Formatters }) {
  const t = useTranslations("admin.customers");
  const clients = state.clients.filter((c) => c.plannerId === row.user.id);
  return (
    <div className="space-y-4 bg-sand/40 p-4 sm:p-5">
      <div>
        <h4 className="text-sm font-semibold text-navy">{t("eventsTitle")}</h4>
        {row.events.length === 0 ? <p className="mt-1 text-sm text-oud-soft">{t("noEvents")}</p> : (
          <ul className="mt-2 divide-y divide-line rounded-2xl border border-line bg-white">
            {row.events.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5">
                <Link href={`/dashboard/events/${e.id}`} className="min-w-0 flex-1 font-medium text-navy underline-offset-4 hover:underline">{e.title}</Link>
                <EventStatusBadge status={e.status} />
                <span className="text-xs text-oud-soft">{f.date(e.startsAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      {row.user.role === "planner" && (
        <div>
          <h4 className="text-sm font-semibold text-navy">{t("clientsTitle")}</h4>
          {clients.length === 0 ? <p className="mt-1 text-sm text-oud-soft">{t("noClients")}</p> : (
            <ul className="mt-2 flex flex-wrap gap-2">
              {clients.map((c) => (
                <li key={c.id}><Badge tone="gold">{c.name} · {t("clientEvents", { count: state.events.filter((e) => e.clientId === c.id).length })}</Badge></li>
              ))}
            </ul>
          )}
        </div>
      )}
      <p className="text-xs text-oud-soft"><bdi dir="ltr">{row.user.email}</bdi> · <bdi dir="ltr">{row.user.phone}</bdi></p>
    </div>
  );
}

export function CustomersTab({ state }: { state: DemoState }) {
  const t = useTranslations("admin.customers");
  const roles = useTranslations("app.roles");
  const locale = useLocale();
  const f = makeFormatters(locale);
  const sar = (n: number) => formatSar(n, locale);
  const [q, setQ] = useState("");
  const [role, setRole] = useState<"all" | "host" | "planner">("all");
  const [open, setOpen] = useState<string | null>(null);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return customerRows(state)
      .filter((r) => role === "all" || r.user.role === role)
      .filter((r) => !needle || [r.user.name, r.user.org ?? "", r.user.email].some((x) => x.toLowerCase().includes(needle)))
      .sort((a, b) => b.spend - a.spend);
  }, [state, q, role]);

  const toggle = (id: string) => setOpen((o) => (o === id ? null : id));

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-[1fr_14rem]">
        <div>
          <label htmlFor="cust-q" className="sr-only">{t("search")}</label>
          <Input id="cust-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("searchPlaceholder")} />
        </div>
        <div>
          <label htmlFor="cust-role" className="sr-only">{t("roleFilter")}</label>
          <Select id="cust-role" value={role} onChange={(e) => setRole(e.target.value as typeof role)}>
            <option value="all">{t("allRoles")}</option>
            <option value="host">{roles("host")}</option>
            <option value="planner">{roles("planner")}</option>
          </Select>
        </div>
      </div>
      <p className="text-sm text-oud-soft" role="status" aria-live="polite">{t("count", { count: rows.length })}</p>

      {rows.length === 0 ? <EmptyState title={t("emptyTitle")} body={t("emptyBody")} /> : (
        <>
          <TableWrap>
            <table className="w-full min-w-[56rem] border-collapse">
              <thead className="border-b border-line bg-sand/60">
                <tr>
                  <th className={thClass} scope="col">{t("cols.name")}</th>
                  <th className={thClass} scope="col">{t("cols.role")}</th>
                  <th className={thClass} scope="col">{t("cols.org")}</th>
                  <th className={thClass} scope="col">{t("cols.joined")}</th>
                  <th className={thClass} scope="col">{t("cols.events")}</th>
                  <th className={thClass} scope="col">{t("cols.guests")}</th>
                  <th className={thClass} scope="col">{t("cols.spend")}</th>
                  <th className={thClass} scope="col">{t("cols.last")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((r) => {
                  const isOpen = open === r.user.id;
                  return (
                    <Fragment key={r.user.id}>
                      <tr className={clsx(isOpen && "bg-sand/40")}>
                        <th scope="row" className={clsx(tdClass, "text-start font-semibold text-navy")}>
                          <button type="button" aria-expanded={isOpen} aria-controls={`cust-d-${r.user.id}`} onClick={() => toggle(r.user.id)} className="inline-flex min-h-11 items-center gap-2 text-start">
                            <Chevron open={isOpen} />{r.user.name}
                          </button>
                        </th>
                        <td className={tdClass}><Badge tone={r.user.role === "planner" ? "gold" : "sky"}>{roles(r.user.role)}</Badge></td>
                        <td className={tdClass}>{r.user.org ?? "—"}</td>
                        <td className={tdClass}>{f.date(r.user.createdAt)}</td>
                        <td className={clsx(tdClass, "tabular-nums")}>{f.num(r.events.length)}</td>
                        <td className={clsx(tdClass, "tabular-nums")}>{f.num(r.guests)}</td>
                        <td className={clsx(tdClass, "font-semibold tabular-nums text-navy")}>{sar(r.spend)}</td>
                        <td className={tdClass}>{r.lastEventAt ? f.date(r.lastEventAt) : "—"}</td>
                      </tr>
                      {isOpen && <tr id={`cust-d-${r.user.id}`}><td colSpan={8} className="p-0"><Detail row={r} state={state} f={f} /></td></tr>}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </TableWrap>

          <ul className="space-y-3 md:hidden">
            {rows.map((r) => {
              const isOpen = open === r.user.id;
              return (
                <li key={r.user.id} className="overflow-hidden rounded-3xl border border-line bg-white/70 shadow-card">
                  <button type="button" aria-expanded={isOpen} aria-controls={`cust-m-${r.user.id}`} onClick={() => toggle(r.user.id)} className="flex w-full items-start gap-3 p-4 text-start">
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-navy">{r.user.name}</span>
                      <span className="block text-xs text-oud-soft">{r.user.org ?? t("noOrg")} · {f.date(r.user.createdAt)}</span>
                    </span>
                    <Badge tone={r.user.role === "planner" ? "gold" : "sky"}>{roles(r.user.role)}</Badge>
                    <span className="mt-1 text-oud-soft"><Chevron open={isOpen} /></span>
                  </button>
                  <dl className="grid grid-cols-3 gap-2 border-t border-line px-4 py-3 text-center text-xs">
                    <div><dt className="text-oud-soft">{t("cols.events")}</dt><dd className="font-semibold tabular-nums text-navy">{f.num(r.events.length)}</dd></div>
                    <div><dt className="text-oud-soft">{t("cols.guests")}</dt><dd className="font-semibold tabular-nums text-navy">{f.num(r.guests)}</dd></div>
                    <div><dt className="text-oud-soft">{t("cols.spend")}</dt><dd className="font-semibold tabular-nums text-navy">{sar(r.spend)}</dd></div>
                  </dl>
                  {isOpen && <div id={`cust-m-${r.user.id}`}><Detail row={r} state={state} f={f} /></div>}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
