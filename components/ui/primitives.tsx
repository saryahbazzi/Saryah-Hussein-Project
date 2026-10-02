import clsx from "clsx";
import type { ComponentProps, ReactNode } from "react";

export function Card({ className, ...p }: ComponentProps<"div">) {
  return <div className={clsx("rounded-3xl border border-line bg-white/70 p-5 shadow-card sm:p-6", className)} {...p} />;
}

type Tone = "neutral" | "navy" | "sage" | "rose" | "gold" | "sky";
const TONES: Record<Tone, string> = {
  neutral: "bg-sand text-oud",
  navy: "bg-navy text-ivory",
  sage: "bg-sage/15 text-sage",
  rose: "bg-rose/15 text-rose",
  gold: "bg-gold-bright/30 text-gold-ink",
  sky: "bg-navy/10 text-navy",
};
export function Badge({ tone = "neutral", className, ...p }: ComponentProps<"span"> & { tone?: Tone }) {
  return <span className={clsx("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold", TONES[tone], className)} {...p} />;
}

export function StatCard({ label, value, hint, tone = "navy" }: { label: string; value: ReactNode; hint?: ReactNode; tone?: "navy" | "sage" | "rose" | "gold" }) {
  const bar = { navy: "bg-navy", sage: "bg-sage", rose: "bg-rose", gold: "bg-gold" }[tone];
  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-white/70 p-4 shadow-card">
      <span className={clsx("absolute inset-y-0 start-0 w-1", bar)} aria-hidden="true" />
      <p className="text-xs font-medium text-oud-soft">{label}</p>
      <p className="mt-1 font-display text-3xl font-bold tabular-nums text-navy">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-oud-soft">{hint}</p>}
    </div>
  );
}

export function Field({ label, hint, error, children, htmlFor }: { label: string; hint?: string; error?: string | null; children: ReactNode; htmlFor: string }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold text-navy">{label}</label>
      {children}
      {hint && !error && <p className="mt-1.5 text-xs text-oud-soft">{hint}</p>}
      {error && <p role="alert" className="mt-1.5 text-xs font-medium text-rose">{error}</p>}
    </div>
  );
}

export const inputClass =
  "w-full min-h-12 rounded-2xl border border-line bg-white px-4 py-2.5 text-base text-oud placeholder:text-oud-soft/60 focus:border-navy aria-[invalid=true]:border-rose";

export function Input({ className, ...p }: ComponentProps<"input">) {
  return <input className={clsx(inputClass, className)} {...p} />;
}
export function Select({ className, ...p }: ComponentProps<"select">) {
  return <select className={clsx(inputClass, "pe-10", className)} {...p} />;
}
export function Textarea({ className, ...p }: ComponentProps<"textarea">) {
  return <textarea className={clsx(inputClass, "min-h-24", className)} {...p} />;
}

export function PageHeader({ title, lead, actions }: { title: string; lead?: string; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-3xl font-bold text-navy sm:text-4xl">{title}</h1>
        {lead && <p className="mt-2 max-w-2xl text-oud-soft">{lead}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </div>
  );
}

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="rounded-3xl border border-dashed border-line bg-sand/50 px-6 py-14 text-center">
      <p className="font-display text-2xl font-bold text-navy">{title}</p>
      {body && <p className="mx-auto mt-2 max-w-md text-oud-soft">{body}</p>}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}

/** Horizontal segmented bar used for RSVP breakdowns. */
export function SegmentBar({ segments, label }: { segments: { value: number; className: string }[]; label: string }) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  return (
    <div role="img" aria-label={label} className="flex h-2.5 w-full overflow-hidden rounded-full bg-sand">
      {segments.map((s, i) => <span key={i} className={s.className} style={{ width: `${(s.value / total) * 100}%` }} />)}
    </div>
  );
}
