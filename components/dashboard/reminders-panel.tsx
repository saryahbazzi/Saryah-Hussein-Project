"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Badge, Card } from "@/components/ui/primitives";
import { reminderRecipients, reminderSchedule, type ReminderKind } from "@/lib/demo/actions";
import { sendReminders } from "@/lib/demo/services";
import { useDemo } from "@/lib/demo/store";
import type { DemoEvent } from "@/lib/demo/types";
import { useFmt } from "./use-fmt";

const TONE = { scheduled: "sky", due: "gold", sent: "sage", skipped: "neutral" } as const;

/** The automatic 7-day and 1-day reminder schedule, with a demo button to fire a reminder now. */
export function RemindersPanel({ ev }: { ev: DemoEvent }) {
  const t = useTranslations("dashboard.reminders");
  const { state } = useDemo();
  const f = useFmt();
  const [busy, setBusy] = useState<ReminderKind | null>(null);
  const [result, setResult] = useState("");
  const schedule = reminderSchedule(state, ev);

  async function send(kind: ReminderKind) {
    setBusy(kind);
    const n = await sendReminders(ev.id, kind);
    setBusy(null);
    setResult(t("result", { count: n, n: f.num(n) }));
  }

  return (
    <Card>
      <h2 className="font-display text-2xl font-bold text-navy">{t("title")}</h2>
      <p className="mt-2 text-sm leading-relaxed text-oud-soft">{t("explain")}</p>
      <ul className="mt-5 grid gap-3 md:grid-cols-2">
        {schedule.map((r) => {
          const recipients = reminderRecipients(state, ev.id, r.kind).length;
          return (
            <li key={r.kind} className="rounded-2xl border border-line bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="font-semibold text-navy">{t(`kind.${r.kind}`)}</p>
                <Badge tone={TONE[r.state]}>{t(`state.${r.state}`)}</Badge>
              </div>
              <p className="mt-1 text-sm text-oud">{f.date(r.at)} · {f.time(r.at)}</p>
              <p className="mt-1 text-xs text-oud-soft">
                {r.state === "sent" ? t("sentTo", { count: r.sentCount, n: f.num(r.sentCount) }) : t("recipients", { count: recipients, n: f.num(recipients) })}
              </p>
              <button
                type="button"
                disabled={busy !== null || recipients === 0}
                onClick={() => send(r.kind)}
                className="mt-3 inline-flex min-h-11 items-center rounded-full border border-dashed border-gold bg-gold-bright/10 px-4 text-sm font-semibold text-gold-ink transition hover:bg-gold-bright/25 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {busy === r.kind ? t("sending") : t("sendNow")}
              </button>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-xs text-oud-soft">{t("demoNote")}</p>
      <p className="mt-2 min-h-5 text-sm font-medium text-sage" role="status" aria-live="polite">{result}</p>
    </Card>
  );
}
