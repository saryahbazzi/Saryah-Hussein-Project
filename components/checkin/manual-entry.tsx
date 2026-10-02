"use client";

import { useId, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Badge, Card, Field, Input } from "@/components/ui/primitives";
import { searchGuests } from "@/lib/door/scan-logic";
import type { DemoGuest } from "@/lib/demo/types";

/** Fallback when the camera can't read a code: paste a token, or find a confirmed guest by name/phone. */
export function ManualEntry({ guests, onCode, onGuest }: { guests: DemoGuest[]; onCode: (code: string) => void; onGuest: (guestId: string) => void }) {
  const t = useTranslations("checkin.scanner.manual");
  const [code, setCode] = useState("");
  const [query, setQuery] = useState("");
  const codeId = useId();
  const searchId = useId();
  const results = useMemo(() => searchGuests(guests, query), [guests, query]);

  return (
    <Card className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-navy">{t("title")}</h2>
        <p className="text-sm text-oud-soft">{t("lead")}</p>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); if (code.trim()) { onCode(code.trim()); setCode(""); } }}
        className="space-y-2"
      >
        <Field label={t("codeLabel")} htmlFor={codeId}>
          <Input id={codeId} dir="ltr" value={code} onChange={(e) => setCode(e.target.value)} placeholder={t("codePlaceholder")} autoComplete="off" autoCapitalize="off" spellCheck={false} />
        </Field>
        <button type="submit" disabled={!code.trim()} className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-navy px-5 font-semibold text-ivory hover:bg-navy-soft disabled:opacity-50">
          {t("codeSubmit")}
        </button>
      </form>

      <div>
        <Field label={t("searchLabel")} htmlFor={searchId}>
          <Input id={searchId} type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("searchPlaceholder")} autoComplete="off" />
        </Field>
        <div aria-live="polite">
          {query.trim().length >= 2 && results.length === 0 && <p className="mt-3 text-sm text-oud-soft">{t("noResults")}</p>}
          <ul className="mt-3 space-y-2">
            {results.map((g) => (
              <li key={g.id} className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-white p-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-navy">{g.name}</p>
                  <p className="text-xs text-oud-soft"><bdi dir="ltr">{g.phone}</bdi> · {t("party", { count: g.partySize })}</p>
                </div>
                {g.checkedInAt ? (
                  <Badge tone="sage">{t("checkedIn")}</Badge>
                ) : (
                  <button type="button" onClick={() => onGuest(g.id)} className="inline-flex min-h-12 shrink-0 items-center rounded-full bg-navy px-5 text-sm font-bold text-ivory hover:bg-navy-soft">
                    {t("checkIn")}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}
