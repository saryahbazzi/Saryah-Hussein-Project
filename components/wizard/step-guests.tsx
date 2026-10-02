"use client";

import { useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import clsx from "clsx";
import { Badge, Input, Textarea } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { PRICING } from "@/lib/pricing/config";
import { isUsable, MAX_PARTY, parseDelimitedText, parseGuestRows, reviewGuests, sampleCsv, type GuestDraft, type GuestIssue } from "@/lib/guests/parse";
import { formatSaudiMobile } from "@/lib/phone/saudi";
import { StepShell, type StepProps } from "./step-shell";

const PAGE = 40;

async function readFileRows(file: File): Promise<unknown[][]> {
  if (/\.xlsx$/i.test(file.name)) {
    const { readSheet } = await import("read-excel-file/browser"); // loaded only when an Excel file is chosen
    return (await readSheet(file)) as unknown[][];
  }
  return parseDelimitedText(await file.text());
}

const ISSUE_TONE: Record<GuestIssue, "rose" | "gold"> = { missing_name: "rose", invalid_phone: "rose", duplicate: "gold" };

export function StepGuests({ state, update, errors }: StepProps<"guests" | "consent">) {
  const t = useTranslations("wizard.guests");
  const e = useTranslations("wizard.errors");
  const locale = useLocale() as "ar" | "en";
  const fileRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [paste, setPaste] = useState("");
  const [note, setNote] = useState<{ tone: "ok" | "err"; text: string } | null>(null);
  const [filter, setFilter] = useState<"all" | "issues">("all");
  const [shown, setShown] = useState(PAGE);

  const reviewed = useMemo(() => reviewGuests(state.guests), [state.guests]);
  const valid = reviewed.filter(isUsable).length;
  const dups = reviewed.filter((g) => g.issues.includes("duplicate")).length;
  const invalid = reviewed.filter((g) => g.issues.includes("invalid_phone") || g.issues.includes("missing_name")).length;
  const rowsToShow = reviewed.map((g, i) => ({ g, i })).filter(({ g }) => filter === "all" || g.issues.length > 0);

  const setGuests = (fn: (g: GuestDraft[]) => GuestDraft[]) => update((s) => ({ ...s, guests: fn(s.guests) }));

  function ingest(raw: unknown[][]) {
    const res = parseGuestRows(raw);
    if (!res.rows.length) { setNote({ tone: "err", text: t("importEmpty") }); return; }
    const room = PRICING.maxGuests - state.guests.length;
    if (res.rows.length > room) { setNote({ tone: "err", text: t("tooMany", { max: PRICING.maxGuests }) }); return; }
    const drafts = res.rows.map((r) => ({ name: r.name, phone: r.phone, partySize: r.partySize }));
    setGuests((g) => [...g, ...drafts]);
    const ok = res.rows.filter(isUsable).length;
    setNote({ tone: "ok", text: t("imported", { count: res.rows.length, valid: ok, invalid: res.rows.length - ok }) });
    if (res.rows.length - ok > 0) setFilter("issues");
    setShown(PAGE);
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    if (file.size > 5_000_000) { setNote({ tone: "err", text: t("fileTooBig") }); return; }
    try { ingest(await readFileRows(file)); } catch { setNote({ tone: "err", text: t("importError") }); }
    if (fileRef.current) fileRef.current.value = "";
  }

  function download() {
    const url = URL.createObjectURL(new Blob([sampleCsv(locale)], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url; a.download = "dawati-guests-sample.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  const patch = (i: number, p: Partial<GuestDraft>) => setGuests((g) => g.map((x, j) => (j === i ? { ...x, ...p } : x)));

  return (
    <StepShell title={t("title")} lead={t("lead")}>
      <div className="grid gap-6 lg:grid-cols-2">
        <div
          onDragOver={(ev) => { ev.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(ev) => { ev.preventDefault(); setDrag(false); void onFile(ev.dataTransfer.files[0]); }}
          className={clsx("flex flex-col items-center justify-center rounded-3xl border-2 border-dashed p-8 text-center transition", drag ? "border-gold bg-gold-bright/15" : "border-line bg-white/60")}
        >
          <span aria-hidden="true" className="text-3xl">⇪</span>
          <p className="mt-2 font-semibold text-navy">{t("upload.drop")}</p>
          <p className="mt-1 text-sm text-oud-soft">{t("upload.formats")}</p>
          <input ref={fileRef} id="guest-file" type="file" accept=".csv,.txt,.xlsx" className="sr-only" onChange={(ev) => void onFile(ev.target.files?.[0])} />
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Button type="button" variant="primary" onClick={() => fileRef.current?.click()}>{t("upload.browse")}</Button>
            <Button type="button" variant="ghost" onClick={download}>{t("sample")}</Button>
          </div>
        </div>
        <div>
          <label htmlFor="guest-paste" className="mb-1.5 block text-sm font-semibold text-navy">{t("paste.label")}</label>
          <Textarea id="guest-paste" dir="auto" rows={5} value={paste} placeholder={t("paste.placeholder")} onChange={(ev) => setPaste(ev.target.value)} />
          <Button type="button" variant="ghost" className="mt-3" disabled={!paste.trim()} onClick={() => { ingest(parseDelimitedText(paste)); setPaste(""); }}>{t("paste.button")}</Button>
        </div>
      </div>

      <div aria-live="polite" className="mt-4 min-h-6">
        {note && <p className={clsx("text-sm font-medium", note.tone === "ok" ? "text-sage" : "text-rose")}>{note.text}</p>}
      </div>
      {errors.guests && <p role="alert" className="mb-3 text-sm font-medium text-rose">{e(errors.guests)}</p>}

      <div className="mt-2 rounded-3xl border border-line bg-white/70 p-4 shadow-card sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="sage">{t("counts.valid", { count: valid })}</Badge>
          <Badge tone="rose">{t("counts.invalid", { count: invalid })}</Badge>
          <Badge tone="gold">{t("counts.duplicates", { count: dups })}</Badge>
          <span className="flex-1" />
          {reviewed.length > 0 && (
            <>
              <div className="inline-flex rounded-full border border-line p-1" role="group" aria-label={t("filter.label")}>
                {(["all", "issues"] as const).map((f) => (
                  <button key={f} type="button" aria-pressed={filter === f} onClick={() => { setFilter(f); setShown(PAGE); }} className={clsx("min-h-10 rounded-full px-3 text-sm font-semibold", filter === f ? "bg-navy text-ivory" : "text-oud-soft hover:bg-sand")}>
                    {t(`filter.${f}`)}
                  </button>
                ))}
              </div>
              <button type="button" onClick={() => { setGuests(() => []); setNote(null); }} className="min-h-11 rounded-full px-3 text-sm font-semibold text-rose hover:bg-rose/10">{t("clearAll")}</button>
            </>
          )}
        </div>

        {reviewed.length === 0 ? (
          <p className="py-10 text-center text-oud-soft">{t("empty")}</p>
        ) : rowsToShow.length === 0 ? (
          <p className="py-10 text-center font-medium text-sage">{t("noIssues")}</p>
        ) : (
          <ul className="mt-4 divide-y divide-line">
            {rowsToShow.slice(0, shown).map(({ g, i }) => (
              <li key={i} className="grid grid-cols-[1fr_auto] items-start gap-3 py-3 sm:grid-cols-[1.2fr_1fr_5rem_auto_auto]">
                <div className="min-w-0">
                  <label className="sr-only" htmlFor={`g-name-${i}`}>{t("row.name")}</label>
                  <Input id={`g-name-${i}`} value={g.name} placeholder={t("row.name")} aria-invalid={g.issues.includes("missing_name")} className="min-h-11 py-1.5 text-sm" onChange={(ev) => patch(i, { name: ev.target.value })} />
                </div>
                <div className="row-span-1 sm:order-5">
                  <button type="button" onClick={() => setGuests((x) => x.filter((_, j) => j !== i))} aria-label={t("row.remove", { name: g.name || String(i + 1) })} className="inline-flex size-11 items-center justify-center rounded-full text-rose hover:bg-rose/10"><span aria-hidden="true">✕</span></button>
                </div>
                <div className="min-w-0">
                  <label className="sr-only" htmlFor={`g-phone-${i}`}>{t("row.phone")}</label>
                  <Input id={`g-phone-${i}`} dir="ltr" inputMode="tel" value={g.phone} placeholder="05XXXXXXXX" aria-invalid={g.issues.includes("invalid_phone")} className="min-h-11 py-1.5 text-start text-sm" onChange={(ev) => patch(i, { phone: ev.target.value })} />
                  {g.e164 && <p className="mt-1 text-xs text-oud-soft"><bdi dir="ltr">{formatSaudiMobile(g.e164)}</bdi></p>}
                </div>
                <div>
                  <label className="sr-only" htmlFor={`g-size-${i}`}>{t("row.partySize")}</label>
                  <Input id={`g-size-${i}`} type="number" min={1} max={MAX_PARTY} inputMode="numeric" value={g.partySize} className="min-h-11 py-1.5 text-center text-sm" onChange={(ev) => patch(i, { partySize: Number(ev.target.value) || 1 })} />
                </div>
                <div className="col-span-2 flex flex-wrap gap-1.5 sm:col-span-1 sm:order-4">
                  {g.issues.length === 0 ? <Badge tone="sage">✓ {t("issue.ok")}</Badge> : g.issues.map((x) => <Badge key={x} tone={ISSUE_TONE[x]}>{t(`issue.${x}`)}</Badge>)}
                </div>
              </li>
            ))}
          </ul>
        )}
        {rowsToShow.length > shown && (
          <div className="mt-3 text-center">
            <Button type="button" variant="ghost" onClick={() => setShown((n) => n + PAGE)}>{t("showMore", { count: rowsToShow.length - shown })}</Button>
          </div>
        )}

        <button
          type="button"
          onClick={() => { setGuests((g) => [...g, { name: "", phone: "", partySize: 1 }]); setFilter("all"); setShown(Infinity); }}
          className="mt-4 inline-flex min-h-12 items-center rounded-full border border-oud/25 px-5 text-sm font-semibold hover:bg-oud/5"
        >
          + {t("add")}
        </button>
      </div>

      <label className={clsx("mt-6 flex cursor-pointer gap-3 rounded-2xl border p-4", errors.consent ? "border-rose bg-rose/5" : "border-line bg-white/70")}>
        <input type="checkbox" checked={state.consent} aria-invalid={!!errors.consent} onChange={(ev) => update((s) => ({ ...s, consent: ev.target.checked }))} className="mt-1 size-6 shrink-0 accent-[var(--color-navy)]" />
        <span>
          <span className="block font-semibold text-navy">{t("consent.label")}</span>
          <span className="mt-1 block text-sm text-oud-soft">{t("consent.hint")}</span>
        </span>
      </label>
      {errors.consent && <p role="alert" className="mt-2 text-sm font-medium text-rose">{e(errors.consent)}</p>}
    </StepShell>
  );
}
