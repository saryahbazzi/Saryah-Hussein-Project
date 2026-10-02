"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge, EmptyState } from "@/components/ui/primitives";
import { InvitationCard } from "@/components/invitation/invitation-card";
import { formatSar } from "@/lib/pricing/calculate";
import { PRICING } from "@/lib/pricing/config";
import { tierOf, type Motif } from "@/lib/templates/catalog";
import { templateUsage } from "@/lib/admin/metrics";
import { deleteTemplate, upsertTemplate } from "@/lib/demo/actions";
import { dispatch } from "@/lib/demo/store";
import type { DemoState, DemoTemplate } from "@/lib/demo/types";
import { Switch } from "./shared";
import { TemplateForm } from "./template-form";

export function TemplatesTab({ state }: { state: DemoState }) {
  const t = useTranslations("admin.templates");
  const occ = useTranslations("occasions");
  const sample = useTranslations("sampleCard");
  const locale = useLocale();
  const lang = locale === "ar" ? "ar" : "en";
  const usage = templateUsage(state);
  const [form, setForm] = useState<{ initial: DemoTemplate | null } | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const content = { eyebrow: sample("eyebrow"), title: sample("title"), host: sample("host"), date: sample("date"), venue: sample("venue") };
  const nameOf = (x: DemoTemplate) => x.name[lang];

  const toggle = (x: DemoTemplate, published: boolean) => {
    dispatch((s) => upsertTemplate(s, { ...x, published }));
    setNotice(t(published ? "noticePublished" : "noticeUnpublished", { name: nameOf(x) }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-sm text-oud-soft">{t("lead")}</p>
        <Button onClick={() => setForm({ initial: null })}>{t("new")}</Button>
      </div>
      <p className="sr-only" role="status" aria-live="polite">{notice}</p>

      {form && (
        <TemplateForm
          key={form.initial?.slug ?? "new"}
          initial={form.initial}
          existingSlugs={state.templates.map((x) => x.slug)}
          onCancel={() => setForm(null)}
          onSave={(tpl) => {
            dispatch((s) => upsertTemplate(s, tpl));
            setNotice(t("noticeSaved", { name: nameOf(tpl) }));
            setForm(null);
          }}
        />
      )}

      {state.templates.length === 0 ? <EmptyState title={t("emptyTitle")} body={t("emptyBody")} /> : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {state.templates.map((x) => {
            const used = usage[x.slug] ?? 0;
            const tier = tierOf(x.kind);
            return (
              <li key={x.slug} className="flex flex-col rounded-3xl border border-line bg-white/70 p-4 shadow-card">
                <div className="mx-auto w-full max-w-[13rem]"><InvitationCard spec={{ kind: x.kind, motif: x.motif as Motif, palette: x.palette }} content={content} lang={lang} animate={false} /></div>
                <div className="mt-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="font-semibold text-navy">{x.name[lang]}</h4>
                    <p className="text-xs text-oud-soft" lang={lang === "ar" ? "en" : "ar"} dir={lang === "ar" ? "ltr" : "rtl"}>{x.name[lang === "ar" ? "en" : "ar"]}</p>
                    <p className="mt-0.5 text-xs text-oud-soft"><bdi dir="ltr">{x.slug}</bdi></p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <span className="text-xs font-medium text-oud-soft" aria-hidden="true">{x.published ? t("published") : t("hidden")}</span>
                    <Switch checked={x.published} onChange={(v) => toggle(x, v)} label={t("toggleLabel", { name: nameOf(x) })} />
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge>{occ(`items.${x.occasion}`)}</Badge>
                  <Badge>{t(`form.styles.${x.style as "classic"}`)}</Badge>
                  <Badge tone="sky">{occ(`kinds.${x.kind}`)}</Badge>
                  <Badge tone={tier === "premium" ? "gold" : "neutral"}>{t(`tiers.${tier}`)}</Badge>
                </div>
                <p className="mt-3 text-sm text-oud-soft">{t("price", { price: formatSar(PRICING.basePrice[tier], locale) })} · {t("usedBy", { count: used })}</p>
                <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
                  <Button variant="ghost" className="min-h-11 px-5" onClick={() => setForm({ initial: x })}>{t("edit")}</Button>
                  {used > 0 ? (
                    <span className="text-xs text-oud-soft">{t("cannotDelete")}</span>
                  ) : confirmDel === x.slug ? (
                    <>
                      <Button className="min-h-11 bg-rose px-5 hover:bg-rose/90" onClick={() => { dispatch((s) => deleteTemplate(s, x.slug)); setConfirmDel(null); setNotice(t("noticeDeleted", { name: nameOf(x) })); }}>{t("confirmDelete")}</Button>
                      <Button variant="ghost" className="min-h-11 px-5" onClick={() => setConfirmDel(null)}>{t("form.cancel")}</Button>
                    </>
                  ) : (
                    <Button variant="ghost" className="min-h-11 px-5 text-rose" onClick={() => setConfirmDel(x.slug)}>{t("delete")}</Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
