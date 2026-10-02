"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Badge, EmptyState, PageHeader } from "@/components/ui/primitives";
import { useDemo, useDemoUser } from "@/lib/demo/store";
import { doorCounts } from "@/lib/door/scan-logic";
import { scannableEvents } from "@/lib/door/access";
import { formatShortDate, formatTime } from "@/lib/door/format";

/** Events the signed-in user may scan for, as big tappable cards with live counters. */
export function CheckinEventList() {
  const t = useTranslations("checkin.list");
  const locale = useLocale();
  const { user } = useDemoUser();
  const { state } = useDemo();
  if (!user) return null;
  const events = scannableEvents(state, user);

  return (
    <div>
      <PageHeader title={t("title")} lead={t("lead")} />
      {events.length === 0 ? (
        <EmptyState title={t("empty.title")} body={t("empty.body")} />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {events.map((e) => {
            const c = doorCounts(state.guests.filter((g) => g.eventId === e.id));
            const pct = c.confirmed ? Math.min(100, Math.round((c.attended / c.confirmed) * 100)) : 0;
            return (
              <li key={e.id}>
                <Link
                  href={`/checkin/${e.id}`}
                  className="group block rounded-3xl border border-line bg-white/80 p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-lift sm:p-6"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="font-display text-2xl font-bold leading-snug text-navy">{e.title}</h2>
                    <Badge tone={e.status === "live" ? "sage" : "neutral"}>{e.status === "live" ? t("live") : t("done")}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-oud-soft">{formatShortDate(e.startsAt, locale)} · {formatTime(e.startsAt, locale)}</p>
                  <p className="text-sm text-oud-soft">{e.venue}</p>

                  <div className="mt-5 flex items-end justify-between gap-3">
                    <p className="font-sans text-4xl font-bold tabular-nums text-navy">
                      {c.attended}<span className="text-xl text-oud-soft"> / {c.confirmed}</span>
                    </p>
                    <p className="pb-1 text-sm text-oud-soft">{t("people", { count: c.people })}</p>
                  </div>
                  <div
                    role="progressbar" aria-valuemin={0} aria-valuemax={c.confirmed} aria-valuenow={c.attended}
                    aria-label={t("progress", { attended: c.attended, confirmed: c.confirmed })}
                    className="mt-2 h-3 overflow-hidden rounded-full bg-sand"
                  >
                    <div className="h-full rounded-full bg-sage transition-[width] duration-700" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="mt-2 text-xs text-oud-soft">{t("attendedOf", { attended: c.attended, confirmed: c.confirmed })}</p>
                  <span className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-navy px-6 font-semibold text-ivory transition group-hover:bg-navy-soft">
                    {t("open")}
                    <span aria-hidden="true" className="rtl:-scale-x-100">→</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
