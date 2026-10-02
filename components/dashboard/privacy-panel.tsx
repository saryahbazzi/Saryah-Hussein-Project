"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/primitives";
import { useRouter } from "@/i18n/navigation";
import { deleteEvent, eraseEventGuests } from "@/lib/demo/actions";
import { dispatch } from "@/lib/demo/store";
import type { DemoEvent, DemoGuest } from "@/lib/demo/types";
import { ConfirmDialog } from "./confirm-dialog";
import { useExportGuests } from "./use-export";
import { useFmt } from "./use-fmt";

/** PDPL panel: consent record, retention policy, export, erase and delete. */
export function PrivacyPanel({ ev, guests, onLeaving }: { ev: DemoEvent; guests: DemoGuest[]; onLeaving: () => void }) {
  const t = useTranslations("dashboard.privacy");
  const f = useFmt();
  const router = useRouter();
  const exportCsv = useExportGuests();
  const [dialog, setDialog] = useState<"erase" | "delete" | null>(null);
  const [note, setNote] = useState("");
  const optedOut = guests.filter((g) => g.status === "opted_out").length;
  const outline = "!min-h-11 !px-5 !text-sm";

  return (
    <Card>
      <h2 className="font-display text-2xl font-bold text-navy">{t("title")}</h2>
      <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="font-semibold text-navy">{t("consent")}</dt>
          <dd className="mt-1 text-oud-soft">{ev.consentAttestedAt ? t("consentAt", { date: f.full(ev.consentAttestedAt) }) : t("consentNone")}</dd>
        </div>
        <div>
          <dt className="font-semibold text-navy">{t("retention")}</dt>
          <dd className="mt-1 text-oud-soft">{t("retentionBody")}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="font-semibold text-navy">{t("optOut")}</dt>
          <dd className="mt-1 text-oud-soft">{t("optOutBody", { count: optedOut, n: f.num(optedOut) })}</dd>
        </div>
      </dl>
      <div className="mt-5 flex flex-wrap gap-3">
        <Button variant="ghost" type="button" className={outline} disabled={guests.length === 0} onClick={() => exportCsv(ev, guests)}>{t("export")}</Button>
        <Button variant="ghost" type="button" className={`${outline} !border-rose/40 !text-rose hover:!bg-rose/10`} disabled={guests.length === 0} onClick={() => setDialog("erase")}>{t("erase")}</Button>
        <Button variant="ghost" type="button" className={`${outline} !border-rose/40 !text-rose hover:!bg-rose/10`} onClick={() => setDialog("delete")}>{t("deleteEvent")}</Button>
      </div>
      <p className="mt-3 min-h-5 text-sm font-medium text-sage" role="status" aria-live="polite">{note}</p>

      <ConfirmDialog
        open={dialog === "erase"}
        title={t("eraseTitle")}
        body={t("eraseBody", { count: guests.length, n: f.num(guests.length) })}
        phrase={t("phrase")}
        confirmLabel={t("eraseConfirm")}
        onCancel={() => setDialog(null)}
        onConfirm={() => { dispatch((s) => eraseEventGuests(s, ev.id)); setDialog(null); setNote(t("erased")); }}
      />
      <ConfirmDialog
        open={dialog === "delete"}
        title={t("deleteTitle")}
        body={t("deleteBody")}
        phrase={t("phrase")}
        confirmLabel={t("deleteConfirm")}
        onCancel={() => setDialog(null)}
        onConfirm={() => { setDialog(null); onLeaving(); router.replace("/dashboard"); setTimeout(() => dispatch((s) => deleteEvent(s, ev.id)), 50); }}
      />
    </Card>
  );
}
