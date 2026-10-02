"use client";

import { useId, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import clsx from "clsx";
import { Button } from "@/components/ui/button";
import { Badge, Card, Input, Select } from "@/components/ui/primitives";
import { eraseGuest } from "@/lib/demo/actions";
import { dispatch } from "@/lib/demo/store";
import { resendGuest, simulateGuestReply } from "@/lib/demo/services";
import type { DemoGuest, GuestStatus } from "@/lib/demo/types";
import { formatSaudiMobile } from "@/lib/phone/saudi";
import { AddGuestForm } from "./add-guest-form";
import { ConfirmDialog } from "./confirm-dialog";
import { lastActivity, RESENDABLE, STATUS_ORDER } from "./event-utils";
import { GuestStatusBadge, StatusIcon } from "./status-badge";
import { useFmt } from "./use-fmt";

const PAGE = 25;
type Sort = "name" | "status" | "activity";
type Reply = "confirm" | "decline" | "stop";

const REPLYABLE: GuestStatus[] = ["sent", "delivered", "confirmed", "declined"];
const btn = "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-45";

function GuestActions({ g, busy, onResend, onErase }: { g: DemoGuest; busy: boolean; onResend: () => void; onErase: () => void }) {
  const t = useTranslations("dashboard.guests");
  const canResend = RESENDABLE.includes(g.status);
  const whyId = `${useId()}-why`;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={onResend}
        disabled={!canResend || busy}
        title={canResend ? undefined : t(`resendWhy.${g.status as "confirmed" | "declined" | "opted_out"}`)}
        aria-describedby={canResend ? undefined : whyId}
        className={clsx(btn, "border-navy/30 text-navy hover:bg-navy/5")}
      >
        {busy ? t("sending") : g.status === "pending" ? t("send") : t("resend")}
        <span className="sr-only"> — {g.name}</span>
      </button>
      {!canResend && <span id={whyId} className="sr-only">{t(`resendWhy.${g.status as "confirmed" | "declined" | "opted_out"}`)}</span>}
      <select
        aria-label={t("demoReplyFor", { name: g.name })}
        title={t("demoHint")}
        disabled={!REPLYABLE.includes(g.status)}
        value=""
        onChange={(e) => { if (e.target.value) simulateGuestReply(g.id, e.target.value as Reply); }}
        className="min-h-11 max-w-[11rem] rounded-full border border-dashed border-gold bg-gold-bright/10 px-3 text-xs font-semibold text-gold-ink disabled:cursor-not-allowed disabled:opacity-45"
      >
        <option value="">{t("demoReply")}</option>
        <option value="confirm">{t("demoConfirm")}</option>
        <option value="decline">{t("demoDecline")}</option>
        <option value="stop">{t("demoStop")}</option>
      </select>
      <button type="button" onClick={onErase} className={clsx(btn, "border-transparent text-rose hover:bg-rose/10")}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></svg>
        {t("erase")}
        <span className="sr-only"> — {g.name}</span>
      </button>
    </div>
  );
}

export function GuestTable({ eventId, guests }: { eventId: string; guests: DemoGuest[] }) {
  const t = useTranslations("dashboard.guests");
  const f = useFmt();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<GuestStatus | "all" | "attended">("all");
  const [sort, setSort] = useState<Sort>("name");
  const [limit, setLimit] = useState(PAGE);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState<Set<string>>(new Set());
  const [note, setNote] = useState("");
  const [toErase, setToErase] = useState<DemoGuest | null>(null);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: guests.length, attended: guests.filter((g) => g.checkedInAt).length };
    for (const g of guests) c[g.status] = (c[g.status] ?? 0) + 1;
    return c;
  }, [guests]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const digits = q.replace(/\D/g, "");
    const list = guests.filter((g) => {
      if (status === "attended" ? !g.checkedInAt : status !== "all" && g.status !== status) return false;
      return !q || g.name.toLowerCase().includes(q) || (digits.length > 2 && g.phone.includes(digits));
    });
    const cmp: Record<Sort, (a: DemoGuest, b: DemoGuest) => number> = {
      name: (a, b) => f.compare(a.name, b.name),
      status: (a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status) || f.compare(a.name, b.name),
      activity: (a, b) => (lastActivity(b) ?? "").localeCompare(lastActivity(a) ?? "") || f.compare(a.name, b.name),
    };
    return list.sort(cmp[sort]);
  }, [guests, query, status, sort, f]);

  const visible = rows.slice(0, limit);

  async function resend(g: DemoGuest) {
    setBusy((b) => new Set(b).add(g.id));
    await resendGuest(eventId, g.id);
    setBusy((b) => { const n = new Set(b); n.delete(g.id); return n; });
    setNote(t("resent", { name: g.name }));
  }

  const chips: { key: GuestStatus | "all" | "attended"; label: string }[] = [
    { key: "all", label: t("filterAll") },
    ...STATUS_ORDER.filter((s) => counts[s]).map((s) => ({ key: s, label: t(`status.${s}`) })),
    ...(counts.attended ? [{ key: "attended" as const, label: t("status.attended") }] : []),
  ];

  const activityText = (g: DemoGuest) => { const a = lastActivity(g); return a ? f.dateTime(a) : t("noActivity"); };

  return (
    <Card className="!p-0 overflow-hidden">
      <div className="flex flex-col gap-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-2xl font-bold text-navy">{t("title")}</h2>
          <Button variant="ghost" type="button" aria-expanded={adding} onClick={() => setAdding((a) => !a)} className="!min-h-11 !px-5 !text-sm">
            {adding ? t("closeAdd") : t("add")}
          </Button>
        </div>
        {adding && <AddGuestForm eventId={eventId} onAdded={(name) => setNote(t("added", { name }))} />}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <label htmlFor="guest-search" className="sr-only">{t("search")}</label>
            <Input id="guest-search" type="search" value={query} onChange={(e) => { setQuery(e.target.value); setLimit(PAGE); }} placeholder={t("search")} />
          </div>
          <div className="sm:w-52">
            <label htmlFor="guest-sort" className="sr-only">{t("sortLabel")}</label>
            <Select id="guest-sort" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
              <option value="name">{t("sort.name")}</option>
              <option value="status">{t("sort.status")}</option>
              <option value="activity">{t("sort.activity")}</option>
            </Select>
          </div>
        </div>
        <div role="group" aria-label={t("filterLabel")} className="flex flex-wrap gap-2">
          {chips.map((c) => (
            <button
              key={c.key}
              type="button"
              aria-pressed={status === c.key}
              onClick={() => { setStatus(c.key); setLimit(PAGE); }}
              className={clsx("inline-flex min-h-11 items-center gap-2 rounded-full border px-3.5 text-sm font-semibold transition", status === c.key ? "border-navy bg-navy text-ivory" : "border-line bg-white text-oud hover:border-oud/40")}
            >
              {c.label}
              <span className={clsx("rounded-full px-2 py-0.5 text-xs tabular-nums", status === c.key ? "bg-ivory/20" : "bg-sand")}>{f.num(counts[c.key] ?? 0)}</span>
            </button>
          ))}
        </div>
        <p className="text-sm text-oud-soft" aria-live="polite">{note || t("showing", { shown: f.num(visible.length), total: f.num(rows.length) })}</p>
      </div>

      {rows.length === 0 ? (
        <p className="border-t border-line px-6 py-10 text-center text-oud-soft">{guests.length === 0 ? t("empty") : t("noMatch")}</p>
      ) : (
        <>
          {/* Desktop table (scrolls inside its own container, never the page) */}
          <div className="hidden overflow-x-auto border-t border-line md:block">
            <table className="w-full min-w-[56rem] text-start text-sm">
              <caption className="sr-only">{t("title")}</caption>
              <thead className="bg-sand/60 text-xs text-oud-soft">
                <tr>
                  {(["name", "phone", "party", "statusCol", "activity", "actions"] as const).map((c) => (
                    <th key={c} scope="col" className="px-4 py-3 text-start font-semibold first:ps-6 last:pe-6">{t(`columns.${c}`)}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {visible.map((g) => (
                  <tr key={g.id} className="align-middle">
                    <th scope="row" className="px-4 py-3 text-start font-semibold text-navy first:ps-6">{g.name}</th>
                    <td className="px-4 py-3 tabular-nums text-oud"><bdi dir="ltr">{formatSaudiMobile(g.phone)}</bdi></td>
                    <td className="px-4 py-3 tabular-nums">{f.num(g.partySize)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <GuestStatusBadge status={g.status} />
                        {g.checkedInAt && <Badge tone="sage" className="ring-1 ring-inset ring-sage/40"><StatusIcon name="attended" />{t("status.attended")}</Badge>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-oud-soft">{activityText(g)}</td>
                    <td className="px-4 py-2 pe-6">
                      <GuestActions g={g} busy={busy.has(g.id)} onResend={() => resend(g)} onErase={() => setToErase(g)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="divide-y divide-line border-t border-line md:hidden">
            {visible.map((g) => (
              <li key={g.id} className="flex flex-col gap-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-navy">{g.name}</p>
                    <p className="mt-0.5 text-sm text-oud"><bdi dir="ltr" className="tabular-nums">{formatSaudiMobile(g.phone)}</bdi></p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <GuestStatusBadge status={g.status} />
                    {g.checkedInAt && <Badge tone="sage" className="ring-1 ring-inset ring-sage/40"><StatusIcon name="attended" />{t("status.attended")}</Badge>}
                  </div>
                </div>
                <p className="text-xs text-oud-soft">{t("partyOf", { n: f.num(g.partySize) })} · {activityText(g)}</p>
                <GuestActions g={g} busy={busy.has(g.id)} onResend={() => resend(g)} onErase={() => setToErase(g)} />
              </li>
            ))}
          </ul>

          {rows.length > visible.length && (
            <div className="border-t border-line p-4 text-center">
              <Button variant="ghost" type="button" onClick={() => setLimit((l) => l + PAGE)} className="!min-h-11 !text-sm">
                {t("showMore", { n: f.num(Math.min(PAGE, rows.length - visible.length)), rest: f.num(rows.length - visible.length) })}
              </Button>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={!!toErase}
        title={t("eraseTitle", { name: toErase?.name ?? "" })}
        body={t("eraseBody")}
        confirmLabel={t("eraseConfirm")}
        onCancel={() => setToErase(null)}
        onConfirm={() => { if (toErase) { dispatch((s) => eraseGuest(s, toErase.id)); setNote(t("erased", { name: toErase.name })); } setToErase(null); }}
      />
    </Card>
  );
}
