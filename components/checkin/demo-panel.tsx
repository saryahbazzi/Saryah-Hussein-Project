"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { QrCode } from "@/components/qr/qr-code";
import { Card } from "@/components/ui/primitives";
import { createToken } from "@/lib/qr/token";
import { tamperToken } from "@/lib/door/scan-logic";
import type { DemoGuest } from "@/lib/demo/types";

interface Sample { key: string; name: string; label: "fresh" | "used" | "declined" | "invalid"; token: string }

/** Collapsible "Demo: test codes": real QR codes to scan from another screen, or feed straight to the handler. */
export function DemoPanel({ eventId, guests, onCode }: { eventId: string; guests: DemoGuest[]; onCode: (code: string) => void }) {
  const t = useTranslations("checkin.scanner.demo");
  const [open, setOpen] = useState(false);
  const [samples, setSamples] = useState<Sample[]>([]);

  // Pick guests by what they demonstrate; recompute when statuses change so "fresh" stays fresh.
  const fresh = guests.filter((g) => g.status === "confirmed" && !g.checkedInAt).slice(0, 3);
  const used = guests.find((g) => g.checkedInAt);
  const declined = guests.find((g) => g.status === "declined");
  const picks = [
    ...fresh.map((g) => ({ g, label: "fresh" as const })),
    ...(used ? [{ g: used, label: "used" as const }] : []),
    ...(declined ? [{ g: declined, label: "declined" as const }] : []),
  ];
  const sig = picks.map((p) => `${p.g.id}:${p.label}`).join("|");

  useEffect(() => {
    if (!open) return;
    let live = true;
    (async () => {
      const list: Sample[] = [];
      for (const p of picks) list.push({ key: p.g.id, name: p.g.name, label: p.label, token: await createToken(eventId, p.g.id) });
      const baseToken = list[0]?.token ?? (guests[0] ? await createToken(eventId, guests[0].id) : "");
      if (baseToken) list.push({ key: "tampered", name: "", label: "invalid", token: tamperToken(baseToken) });
      if (live) setSamples(list);
    })();
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, eventId, sig]);

  return (
    <Card className="border-gold/50 bg-gold-bright/10">
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="flex min-h-12 w-full items-center justify-between gap-3 text-start">
        <span>
          <span className="block font-display text-2xl font-bold text-navy">{t("title")}</span>
          <span className="block text-sm text-oud-soft">{open ? t("hide") : t("show")}</span>
        </span>
        <span aria-hidden="true" className={`text-xl transition ${open ? "rotate-180" : ""}`}>⌄</span>
      </button>
      {open && (
        <div className="mt-4">
          <p className="text-sm text-oud-soft">{t("lead")}</p>
          {samples.length === 0 && <p className="mt-3 text-sm text-oud-soft">{t("empty")}</p>}
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {samples.map((s) => (
              <li key={s.key} className="flex flex-col items-center rounded-2xl border border-line bg-white p-4 text-center">
                <QrCode value={s.token} size={176} label={s.key === "tampered" ? t("tamperedLabel") : t("qrLabel", { name: s.name })} />
                {s.name && <p className="mt-2 font-semibold text-navy">{s.name}</p>}
                <p className="text-xs font-semibold text-gold-ink">{t(s.key === "tampered" ? "invalid" : s.label)}</p>
                <button type="button" onClick={() => onCode(s.token)} className="mt-3 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-navy px-5 text-sm font-bold text-ivory hover:bg-navy-soft">
                  {t("scanThis")}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
