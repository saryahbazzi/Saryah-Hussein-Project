"use client";

import { useTranslations } from "next-intl";
import type { DoorCounts } from "@/lib/door/scan-logic";

/** Pinned live counter: animated ring plus attended / confirmed, and the head-count including party sizes. */
export function DoorCounter({ counts, title }: { counts: DoorCounts; title: string }) {
  const t = useTranslations("checkin.scanner.counter");
  const pct = counts.confirmed ? Math.min(1, counts.attended / counts.confirmed) : 0;
  const R = 26;
  const C = 2 * Math.PI * R;
  return (
    <div className="flex items-center gap-4 rounded-3xl bg-navy px-5 py-3 text-ivory shadow-lift">
      <div className="relative h-16 w-16 shrink-0" role="img" aria-label={t("progress", { attended: counts.attended, confirmed: counts.confirmed })}>
        <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90" aria-hidden="true">
          <circle cx="32" cy="32" r={R} fill="none" stroke="currentColor" strokeOpacity="0.2" strokeWidth="6" />
          <circle
            cx="32" cy="32" r={R} fill="none" stroke="#d9b061" strokeWidth="6" strokeLinecap="round"
            strokeDasharray={C} strokeDashoffset={C * (1 - pct)} className="transition-[stroke-dashoffset] duration-700"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold tabular-nums" aria-hidden="true">{Math.round(pct * 100)}%</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-ivory/70">{title}</p>
        <p className="flex items-baseline gap-2" aria-live="off">
          <span className="font-sans text-4xl font-bold leading-none tabular-nums">{counts.attended}</span>
          <span className="text-lg font-semibold tabular-nums text-ivory/70">/ {counts.confirmed}</span>
          <span className="text-sm text-ivory/70">{t("label")}</span>
        </p>
        <p className="text-xs text-ivory/70">{t("people", { people: counts.people, expected: counts.peopleConfirmed })}</p>
      </div>
    </div>
  );
}
