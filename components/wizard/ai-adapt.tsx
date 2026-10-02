"use client";

import { useId, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Badge, Input } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import type { Palette } from "@/lib/templates/catalog";
import { adaptStub } from "@/lib/ai/stub";
import type { AdaptResponse } from "@/lib/ai/schema";

export interface AdaptSnapshot { palette: Palette | null; headline: string; message: string }

/** "Adapt this template to my theme": calls the server route, falls back to the local stub on any failure. */
export function AiAdapt({
  slug, palette, hosts, headline, current, onApply, onUndo,
}: {
  slug: string;
  palette: Palette;
  hosts: string;
  headline: string;
  current: AdaptSnapshot;
  onApply: (r: AdaptResponse) => void;
  onUndo: (snap: AdaptSnapshot) => void;
}) {
  const t = useTranslations("wizard.ai");
  const locale = useLocale() as "ar" | "en";
  const id = useId();
  const [theme, setTheme] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<AdaptResponse | null>(null);
  const [msg, setMsg] = useState("");
  const undoSnap = useRef<AdaptSnapshot | null>(null);

  async function run() {
    if (busy || theme.trim().length < 2) return;
    setBusy(true);
    setMsg("");
    const body = { theme: theme.trim(), locale, template: { slug, palette }, hosts, headline };
    let res: AdaptResponse;
    try {
      const r = await fetch("/api/ai/adapt-template", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      if (!r.ok) throw new Error(String(r.status));
      res = (await r.json()) as AdaptResponse;
    } catch {
      res = { source: "stub", ...adaptStub(body) };
    }
    undoSnap.current = current;
    setResult(res);
    onApply(res);
    setMsg(t("applied"));
    setBusy(false);
  }

  return (
    <div className="rounded-3xl border border-gold/50 bg-gold-bright/10 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-display text-xl font-bold text-navy"><span aria-hidden="true">✦ </span>{t("title")}</h3>
        {result && <Badge tone={result.source === "ai" ? "navy" : "gold"}>{result.source === "ai" ? t("badgeAi") : t("badgeDemo")}</Badge>}
      </div>
      <p className="mt-1 text-sm text-oud-soft">{t("lead")}</p>
      <label htmlFor={id} className="mt-4 block text-sm font-semibold text-navy">{t("label")}</label>
      <div className="mt-1.5 flex flex-col gap-3 sm:flex-row">
        <Input id={id} value={theme} maxLength={200} placeholder={t("placeholder")} onChange={(e) => setTheme(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void run(); } }} />
        <Button type="button" variant="gold" disabled={busy || theme.trim().length < 2} onClick={run} className="shrink-0">
          {busy ? t("loading") : t("button")}
        </Button>
      </div>
      <ul className="mt-3 flex flex-wrap gap-2">
        {(["one", "two", "three"] as const).map((k) => (
          <li key={k}>
            <button type="button" onClick={() => setTheme(t(`examples.${k}`))} className="min-h-11 rounded-full border border-line bg-white/70 px-3 text-xs font-medium text-oud-soft hover:border-gold">
              {t(`examples.${k}`)}
            </button>
          </li>
        ))}
      </ul>
      <div aria-live="polite" className="mt-3 text-sm">
        {msg && <p className="font-medium text-sage">{msg}</p>}
        {result?.rationale && <p className="mt-1 text-oud-soft">{result.rationale}</p>}
        {result && undoSnap.current && (
          <button
            type="button"
            onClick={() => { onUndo(undoSnap.current!); undoSnap.current = null; setResult(null); setMsg(t("undone")); }}
            className="mt-2 inline-flex min-h-11 items-center rounded-full border border-oud/25 px-4 font-semibold hover:bg-oud/5"
          >
            {t("undo")}
          </button>
        )}
      </div>
    </div>
  );
}
