"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, Field, Input, Select } from "@/components/ui/primitives";
import { InvitationCard } from "@/components/invitation/invitation-card";
import { slugify } from "@/lib/admin/metrics";
import { OCCASIONS, STYLES, type Motif, type Occasion, type TemplateKind, type TemplateStyle } from "@/lib/templates/catalog";
import type { DemoTemplate } from "@/lib/demo/types";
import { Switch } from "./shared";

const KINDS: TemplateKind[] = ["static", "animated", "video"];
const MOTIFS: Motif[] = ["star", "arch", "floral", "lines", "dots"];
const PALETTE_KEYS = ["bg", "ink", "accent", "frame"] as const;
const HEX = /^#[0-9a-f]{6}$/i;

const BLANK: DemoTemplate = {
  slug: "", occasion: "wedding", style: "classic", kind: "static", motif: "star", published: false,
  palette: { bg: "#f6ecd9", ink: "#2a1f17", accent: "#b8893b", frame: "#b8893b" }, name: { ar: "", en: "" },
};

/** Create or edit a template. The slug of a new template is generated from its English name and must be unique. */
export function TemplateForm({ initial, existingSlugs, onSave, onCancel }: {
  initial: DemoTemplate | null;
  existingSlugs: string[];
  onSave: (t: DemoTemplate) => void;
  onCancel: () => void;
}) {
  const t = useTranslations("admin.templates.form");
  const occ = useTranslations("occasions");
  const sample = useTranslations("sampleCard");
  const locale = useLocale();
  const [d, setD] = useState<DemoTemplate>(initial ?? BLANK);
  const [submitted, setSubmitted] = useState(false);
  const head = useRef<HTMLHeadingElement>(null);
  const editing = initial !== null;
  useEffect(() => { head.current?.focus(); }, []);

  const slug = editing ? d.slug : slugify(d.name.en);
  const errors = useMemo(() => {
    const e: { en?: string; ar?: string; slug?: string; colors: string[] } = { colors: [] };
    if (!d.name.en.trim()) e.en = t("errors.nameEn");
    if (!d.name.ar.trim()) e.ar = t("errors.nameAr");
    if (!editing && d.name.en.trim()) {
      if (!slug) e.en = t("errors.slugEmpty");
      else if (existingSlugs.includes(slug)) e.slug = t("errors.slugTaken", { slug });
    }
    for (const k of PALETTE_KEYS) if (!HEX.test(d.palette[k])) e.colors.push(k);
    return e;
  }, [d, editing, slug, existingSlugs, t]);
  const valid = !errors.en && !errors.ar && !errors.slug && errors.colors.length === 0;

  const set = <K extends keyof DemoTemplate>(k: K, v: DemoTemplate[K]) => setD((x) => ({ ...x, [k]: v }));

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    setSubmitted(true);
    if (valid) onSave({ ...d, slug, name: { ar: d.name.ar.trim(), en: d.name.en.trim() } });
  };

  const spec = { kind: d.kind, motif: d.motif as Motif, palette: d.palette };
  const lang = locale === "ar" ? "ar" : "en";
  const content = { eyebrow: sample("eyebrow"), title: sample("title"), host: sample("host"), date: sample("date"), venue: sample("venue") };

  return (
    <Card className="border-gold/40">
      <h3 ref={head} tabIndex={-1} className="font-display text-2xl font-bold text-navy outline-none">{editing ? t("editTitle") : t("newTitle")}</h3>
      <form onSubmit={submit} noValidate className="mt-5 grid gap-8 lg:grid-cols-[1fr_16rem]">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("nameEn")} htmlFor="tpl-en" error={submitted ? (errors.en ?? errors.slug) : null} hint={editing ? undefined : t("slugHint", { slug: slug || "—" })}>
              <Input id="tpl-en" lang="en" dir="ltr" value={d.name.en} onChange={(e) => set("name", { ...d.name, en: e.target.value })} aria-invalid={submitted && !!(errors.en || errors.slug)} />
            </Field>
            <Field label={t("nameAr")} htmlFor="tpl-ar" error={submitted ? errors.ar : null}>
              <Input id="tpl-ar" lang="ar" dir="rtl" value={d.name.ar} onChange={(e) => set("name", { ...d.name, ar: e.target.value })} aria-invalid={submitted && !!errors.ar} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("occasion")} htmlFor="tpl-occ">
              <Select id="tpl-occ" value={d.occasion} onChange={(e) => set("occasion", e.target.value as Occasion)}>
                {OCCASIONS.map((o) => <option key={o} value={o}>{occ(`items.${o}`)}</option>)}
              </Select>
            </Field>
            <Field label={t("style")} htmlFor="tpl-style">
              <Select id="tpl-style" value={d.style} onChange={(e) => set("style", e.target.value as TemplateStyle)}>
                {STYLES.map((s) => <option key={s} value={s}>{t(`styles.${s}`)}</option>)}
              </Select>
            </Field>
            <Field label={t("kind")} htmlFor="tpl-kind">
              <Select id="tpl-kind" value={d.kind} onChange={(e) => set("kind", e.target.value as TemplateKind)}>
                {KINDS.map((k) => <option key={k} value={k}>{occ(`kinds.${k}`)}</option>)}
              </Select>
            </Field>
            <Field label={t("motif")} htmlFor="tpl-motif">
              <Select id="tpl-motif" value={d.motif} onChange={(e) => set("motif", e.target.value as Motif)}>
                {MOTIFS.map((m) => <option key={m} value={m}>{t(`motifs.${m}`)}</option>)}
              </Select>
            </Field>
          </div>

          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-navy">{t("palette")}</legend>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {PALETTE_KEYS.map((k) => (
                <div key={k}>
                  <label htmlFor={`tpl-c-${k}`} className="mb-1 block text-xs font-medium text-oud-soft">{t(`colors.${k}`)}</label>
                  <div className="flex items-center gap-2">
                    <input id={`tpl-c-${k}`} type="color" value={HEX.test(d.palette[k]) ? d.palette[k] : "#000000"} onChange={(e) => set("palette", { ...d.palette, [k]: e.target.value })} className="h-11 w-11 shrink-0 cursor-pointer rounded-xl border border-line bg-white p-1" />
                    <input aria-label={t("hexLabel", { color: t(`colors.${k}`) })} dir="ltr" value={d.palette[k]} onChange={(e) => set("palette", { ...d.palette, [k]: e.target.value })} aria-invalid={errors.colors.includes(k)} className="min-h-11 w-full min-w-0 rounded-xl border border-line bg-white px-2 text-sm aria-[invalid=true]:border-rose" />
                  </div>
                  {errors.colors.includes(k) && <p role="alert" className="mt-1 text-xs font-medium text-rose">{t("errors.color")}</p>}
                </div>
              ))}
            </div>
          </fieldset>

          <div className="flex items-center gap-3 rounded-2xl border border-line bg-sand/40 px-4 py-2">
            <Switch checked={d.published} onChange={(v) => set("published", v)} label={t("published")} />
            <div>
              <p className="text-sm font-semibold text-navy" aria-hidden="true">{t("published")}</p>
              <p className="text-xs text-oud-soft">{t("publishedHint")}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button type="submit">{editing ? t("save") : t("create")}</Button>
            <Button type="button" variant="ghost" onClick={onCancel}>{t("cancel")}</Button>
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-navy">{t("preview")}</p>
          <div className="mx-auto max-w-[16rem]"><InvitationCard spec={spec} content={content} lang={lang} animate={false} /></div>
        </div>
      </form>
    </Card>
  );
}
