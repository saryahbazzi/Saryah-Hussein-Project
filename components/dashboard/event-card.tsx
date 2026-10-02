"use client";

import { useTranslations } from "next-intl";
import { ButtonLink, Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/primitives";
import { Link } from "@/i18n/navigation";
import { computeStats, guestsOf } from "@/lib/demo/actions";
import { useDemo } from "@/lib/demo/store";
import type { DemoEvent } from "@/lib/demo/types";
import { daysUntil } from "./event-utils";
import { EventStatusBadge } from "./status-badge";
import { EventThumb } from "./event-thumb";
import { LiveNumber } from "./live-number";
import { RsvpBar } from "./rsvp-bar";
import { useExportGuests } from "./use-export";
import { useFmt } from "./use-fmt";

const small = "!min-h-11 !px-4 !text-sm";

/** Rich event card for the dashboard list: thumbnail, schedule, RSVP stats and quick actions. */
export function EventCard({ ev, ownerName, clientName }: { ev: DemoEvent; ownerName?: string; clientName?: string }) {
  const t = useTranslations("dashboard.card");
  const { state } = useDemo();
  const f = useFmt();
  const exportCsv = useExportGuests();
  const guests = guestsOf(state, ev.id);
  const stats = computeStats(guests);
  const days = daysUntil(ev.startsAt);
  const showCountdown = ev.status !== "draft";
  const past = days < 0 || ev.status === "done";
  const cities = useTranslations("dashboard.cities");

  const cells: { key: "sent" | "delivered" | "confirmed" | "declined" | "pending"; tone: string }[] = [
    { key: "sent", tone: "text-navy" }, { key: "delivered", tone: "text-navy" },
    { key: "confirmed", tone: "text-sage" }, { key: "declined", tone: "text-rose" }, { key: "pending", tone: "text-gold-ink" },
  ];

  return (
    <article className="flex flex-col gap-4 rounded-3xl border border-line bg-white/70 p-4 shadow-card transition duration-300 hover:shadow-lift sm:p-5">
      <div className="flex gap-4">
        <EventThumb ev={ev} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <EventStatusBadge status={ev.status} />
            {showCountdown && (
              <Badge tone={!past && days <= 7 ? "gold" : "neutral"}>
                {past ? t("daysAgo", { count: Math.abs(days), n: f.num(Math.abs(days)) }) : t("daysTo", { count: days, n: f.num(days) })}
              </Badge>
            )}
          </div>
          <h3 className="mt-2 font-display text-xl font-bold leading-snug text-navy">
            <Link href={`/dashboard/events/${ev.id}`} className="rounded hover:underline">{ev.title}</Link>
          </h3>
          <p className="mt-1 text-sm text-oud">{f.date(ev.startsAt)} · {f.time(ev.startsAt)}</p>
          <p className="text-sm text-oud-soft">{ev.venue}{/[,،]/.test(ev.venue) ? "" : ` · ${cities(ev.city)}`}</p>
          {(clientName || ownerName) && (
            <p className="mt-1.5 flex flex-wrap gap-x-3 text-xs font-medium text-gold-ink">
              {clientName && <span>{t("client", { name: clientName })}</span>}
              {ownerName && <span>{t("owner", { name: ownerName })}</span>}
            </p>
          )}
        </div>
      </div>

      {stats.total > 0 ? (
        <div>
          <RsvpBar stats={stats} guests={guests} />
          <dl className="mt-3 grid grid-cols-5 gap-1 text-center">
            {cells.map((c) => (
              <div key={c.key} className="min-w-0">
                <dt className="truncate text-[0.7rem] font-medium text-oud-soft">{t(`stats.${c.key}`)}</dt>
                <dd className={`font-display text-lg font-bold ${c.tone}`}><LiveNumber value={stats[c.key]} /></dd>
              </div>
            ))}
          </dl>
          {ev.status !== "draft" && (
            <p className="mt-2 text-xs text-oud-soft">
              {t("checkedIn", { done: f.num(stats.attended), total: f.num(stats.confirmed) })}
            </p>
          )}
        </div>
      ) : (
        <p className="rounded-2xl bg-sand/60 px-4 py-3 text-sm text-oud-soft">{t("noGuests")}</p>
      )}

      <div className="mt-auto flex flex-wrap gap-2">
        <ButtonLink href={`/dashboard/events/${ev.id}`} className={small}>{t("manage")}</ButtonLink>
        {ev.status !== "draft" && (
          <ButtonLink href={`/checkin/${ev.id}`} variant="ghost" className={small}>{t("checkin")}</ButtonLink>
        )}
        {guests.length > 0 && (
          <Button variant="ghost" type="button" className={small} onClick={() => exportCsv(ev, guests)}>{t("export")}</Button>
        )}
      </div>
    </article>
  );
}
