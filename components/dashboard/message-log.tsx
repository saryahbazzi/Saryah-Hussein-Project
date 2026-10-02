"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Badge, Card } from "@/components/ui/primitives";
import { useDemo } from "@/lib/demo/store";
import type { DemoMessage } from "@/lib/demo/types";
import { useFmt } from "./use-fmt";

const TONE: Record<DemoMessage["status"], "neutral" | "sky" | "gold" | "sage" | "rose"> = {
  queued: "neutral", sent: "sky", delivered: "gold", read: "sage", failed: "rose", received: "sage",
};

/** Collapsible log of the latest WhatsApp messages for the event. */
export function MessageLog({ eventId }: { eventId: string }) {
  const t = useTranslations("dashboard.log");
  const { state } = useDemo();
  const f = useFmt();
  const [open, setOpen] = useState(false);
  const all = state.messages.filter((m) => m.eventId === eventId);
  const last = [...all].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 20);
  const names = new Map(state.guests.filter((g) => g.eventId === eventId).map((g) => [g.id, g.name]));

  const label = (m: DemoMessage) => {
    if (m.kind !== "reply") return t(`kind.${m.kind}`);
    return t(m.text === "rsvp_yes" ? "kind.reply_yes" : m.text === "rsvp_no" ? "kind.reply_no" : m.text.toUpperCase() === "STOP" ? "kind.reply_stop" : "kind.reply");
  };

  return (
    <Card>
      <h2>
        <button type="button" aria-expanded={open} aria-controls="message-log-body" onClick={() => setOpen((o) => !o)} className="flex min-h-11 w-full items-center justify-between gap-3 text-start font-display text-2xl font-bold text-navy">
          <span>{t("title")} <span className="text-base font-medium text-oud-soft">({f.num(all.length)})</span></span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={`h-5 w-5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
        </button>
      </h2>
      <div id="message-log-body" hidden={!open}>
        <p className="mt-1 text-sm text-oud-soft">{t("lead")}</p>
        {last.length === 0 ? (
          <p className="mt-4 text-sm text-oud-soft">{t("empty")}</p>
        ) : (
          <ul className="mt-4 divide-y divide-line">
            {last.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2.5 text-sm">
                <div className="min-w-0">
                  <p className="font-semibold text-navy">{label(m)}</p>
                  <p className="truncate text-xs text-oud-soft">{names.get(m.guestId) ?? t("erasedGuest")}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone={TONE[m.status]}>{t(`status.${m.status}`)}</Badge>
                  <span className="text-xs tabular-nums text-oud-soft">{f.dateTime(m.createdAt)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
