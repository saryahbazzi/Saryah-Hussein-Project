"use client";

import { useLocale, useTranslations } from "next-intl";
import { Card } from "@/components/ui/primitives";
import { buildIcs, mapsLinkFor } from "@/lib/door/ics";
import { formatLongDate, formatTime } from "@/lib/door/format";
import type { DemoEvent } from "@/lib/demo/types";

const ACTION = "inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl border border-oud/20 bg-white px-4 text-sm font-semibold text-oud hover:bg-sand";

export function EventDetails({ event, guestId, guestName, partyText }: { event: DemoEvent; guestId: string; guestName: string; partyText: string }) {
  const t = useTranslations("ticket.details");
  const locale = useLocale();

  function downloadIcs() {
    const ics = buildIcs({
      uid: `${event.id}-${guestId}`,
      title: event.title,
      startsAt: event.startsAt,
      venue: event.venue,
      description: t("calendarDescription", { hosts: event.customization.hosts || guestName, party: partyText }),
    });
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${event.id}.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <Card>
      <h2 className="font-display text-2xl font-bold text-navy">{t("title")}</h2>
      <dl className="mt-4 grid gap-4 text-start">
        <div>
          <dt className="text-xs font-semibold text-oud-soft">{t("when")}</dt>
          <dd className="mt-0.5 font-semibold text-oud">{formatLongDate(event.startsAt, locale)}</dd>
          <dd className="text-oud-soft">{formatTime(event.startsAt, locale)}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold text-oud-soft">{t("where")}</dt>
          <dd className="mt-0.5 font-semibold text-oud">{event.venue}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold text-oud-soft">{t("partyLabel")}</dt>
          <dd className="mt-0.5 font-semibold text-oud">{guestName} · {partyText}</dd>
        </div>
      </dl>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <a href={mapsLinkFor(event)} target="_blank" rel="noopener noreferrer" className={ACTION}>
          <span aria-hidden="true">📍</span>{t("openMaps")}
        </a>
        <button type="button" onClick={downloadIcs} className={ACTION}>
          <span aria-hidden="true">🗓</span>{t("addCalendar")}
        </button>
      </div>
      <p className="mt-2 text-xs text-oud-soft">{t("calendarNote")}</p>
    </Card>
  );
}
