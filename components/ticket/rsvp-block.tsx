"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/primitives";
import { simulateGuestReply } from "@/lib/demo/services";
import type { GuestStatus } from "@/lib/demo/types";

const BTN = "inline-flex min-h-14 w-full items-center justify-center rounded-2xl px-6 text-lg font-bold transition active:scale-[0.99] disabled:opacity-60";

/** RSVP for the guest's phone view. In production the answer is the WhatsApp reply; here the buttons simulate it. */
export function RsvpBlock({ guestId, status, hosts, locked }: { guestId: string; status: GuestStatus; hosts: string; locked: boolean }) {
  const t = useTranslations("ticket.rsvp");
  const [busy, setBusy] = useState(false);

  function reply(intent: "confirm" | "decline" | "stop") {
    setBusy(true);
    simulateGuestReply(guestId, intent);
    setTimeout(() => setBusy(false), 400);
  }

  if (status === "opted_out") {
    return (
      <Card className="text-center" role="status">
        <p className="font-display text-xl font-bold text-navy">{t("stoppedTitle")}</p>
        <p className="mt-2 text-sm text-oud-soft">{t("stoppedBody")}</p>
      </Card>
    );
  }

  const answered = status === "confirmed" || status === "declined";
  return (
    <Card className="text-center">
      {!answered ? (
        <>
          <h2 className="font-display text-2xl font-bold text-navy">{t("title")}</h2>
          <p className="mt-1 text-sm text-oud-soft">{t("lead", { hosts })}</p>
          <div className="mt-5 grid gap-3">
            <button type="button" disabled={busy} onClick={() => reply("confirm")} className={`${BTN} bg-navy text-ivory hover:bg-navy-soft`}>{t("yes")}</button>
            <button type="button" disabled={busy} onClick={() => reply("decline")} className={`${BTN} border-2 border-oud/20 bg-white text-oud hover:bg-sand`}>{t("no")}</button>
          </div>
        </>
      ) : (
        <div role="status">
          <p className="font-display text-xl font-bold text-navy">{status === "confirmed" ? t("confirmedTitle") : t("declinedTitle")}</p>
          {status === "declined" && <p className="mt-2 text-sm text-oud-soft">{t("declinedBody")}</p>}
          {!locked && (
            <button
              type="button"
              disabled={busy}
              onClick={() => reply(status === "confirmed" ? "decline" : "confirm")}
              className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full border border-oud/20 bg-white px-5 text-sm font-semibold text-oud hover:bg-sand"
            >
              {status === "confirmed" ? t("changeToNo") : t("changeToYes")}
            </button>
          )}
        </div>
      )}
      <div className="mt-5 border-t border-line pt-4">
        <button type="button" disabled={busy} onClick={() => reply("stop")} className="inline-flex min-h-11 items-center px-3 text-sm font-semibold text-oud-soft underline underline-offset-4 hover:text-rose">
          {t("stop")}
        </button>
        <p className="text-xs text-oud-soft">{t("stopHint")}</p>
        <p className="mx-auto mt-3 max-w-xs rounded-xl bg-sand/70 px-3 py-2 text-xs text-oud-soft">{t("demoNote")}</p>
      </div>
    </Card>
  );
}
