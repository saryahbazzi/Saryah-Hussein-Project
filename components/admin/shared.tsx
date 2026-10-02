"use client";

import clsx from "clsx";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/primitives";
import type { Delta } from "@/lib/admin/metrics";
import type { EventStatus, MessageStatus } from "@/lib/demo/types";

export const STATUS_TONE = { live: "sage", draft: "neutral", done: "navy" } as const;

export function EventStatusBadge({ status }: { status: EventStatus }) {
  const t = useTranslations("admin.status");
  return <Badge tone={STATUS_TONE[status]}>{t(status)}</Badge>;
}

const MSG_TONE: Record<MessageStatus, "neutral" | "sage" | "rose" | "navy" | "gold"> = {
  queued: "neutral", sent: "neutral", delivered: "sage", read: "navy", failed: "rose", received: "gold",
};
export function MessageStatusBadge({ status }: { status: MessageStatus }) {
  const t = useTranslations("admin.messages.status");
  return <Badge tone={MSG_TONE[status]}>{t(status)}</Badge>;
}

/** Percentage change chip: arrow + sign + text, never colour alone. */
export function DeltaChip({ delta, pct }: { delta: Delta; pct: (n: number) => string }) {
  const t = useTranslations("admin.kpi");
  if (delta.pct === null) return <span className="text-xs text-oud-soft">{t("noBaseline")}</span>;
  const up = delta.pct >= 0;
  return (
    <span className={clsx("inline-flex items-center gap-1 text-xs font-semibold", up ? "text-sage" : "text-rose")}>
      <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" className={up ? "" : "rotate-180"}><path d="M5 1l4 7H1z" fill="currentColor" /></svg>
      <span dir="ltr">{up ? "+" : "−"}{pct(Math.abs(delta.pct))}</span>
      <span className="font-normal text-oud-soft">{t("vsPrevious")}</span>
    </span>
  );
}

export function Kpi({ label, value, hint, delta, pct, tone }: { label: string; value: React.ReactNode; hint?: React.ReactNode; delta?: Delta; pct: (n: number) => string; tone: "navy" | "sage" | "rose" | "gold" }) {
  const bar = { navy: "bg-navy", sage: "bg-sage", rose: "bg-rose", gold: "bg-gold" }[tone];
  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-white/70 p-4 shadow-card">
      <span className={clsx("absolute inset-y-0 start-0 w-1", bar)} aria-hidden="true" />
      <p className="text-xs font-medium text-oud-soft">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold tabular-nums text-navy sm:text-3xl">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-oud-soft">{hint}</p>}
      {delta && <p className="mt-1.5"><DeltaChip delta={delta} pct={pct} /></p>}
    </div>
  );
}

/** Accessible on/off switch (button with role="switch"). */
export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="group inline-flex min-h-11 min-w-11 items-center justify-center"
    >
      <span className={clsx("relative h-7 w-12 rounded-full border transition-colors motion-reduce:transition-none", checked ? "border-sage bg-sage" : "border-oud-soft/50 bg-sand-deep")}>
        <span className={clsx("absolute top-0.5 size-5 rounded-full bg-white shadow transition-all motion-reduce:transition-none", checked ? "start-6" : "start-0.5")} />
      </span>
    </button>
  );
}

export function Panel({ title, children, className, lead }: { title: string; lead?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={clsx("rounded-3xl border border-line bg-white/70 p-5 shadow-card sm:p-6", className)}>
      <h3 className="font-display text-xl font-bold text-navy">{title}</h3>
      {lead && <p className="mt-1 text-sm text-oud-soft">{lead}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** Bordered scroll container so wide tables never cause page-level horizontal scroll. */
export function TableWrap({ children }: { children: React.ReactNode }) {
  return <div className="hidden overflow-x-auto rounded-3xl border border-line bg-white/70 shadow-card md:block">{children}</div>;
}

export const thClass = "px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide text-oud-soft";
export const tdClass = "px-4 py-3 align-middle text-sm";
