"use client";

import { useTranslations } from "next-intl";
import { TEMPLATES, type CardSpec, type Motif } from "@/lib/templates/catalog";
import { useDemo } from "@/lib/demo/store";
import type { DemoEvent } from "@/lib/demo/types";
import { useFmt } from "./use-fmt";

/** Props for <InvitationCard> built from an event (its template, palette override and content). */
export function useCardProps(ev: DemoEvent) {
  const { state } = useDemo();
  const occ = useTranslations("occasions.items");
  const f = useFmt();
  const tpl = state.templates.find((x) => x.slug === ev.templateSlug) ?? TEMPLATES.find((x) => x.slug === ev.templateSlug) ?? TEMPLATES[0];
  const spec: Pick<CardSpec, "kind" | "motif" | "palette"> = { kind: tpl.kind, motif: tpl.motif as Motif, palette: tpl.palette };
  const c = ev.customization;
  const lang: "ar" | "en" = c.language === "en" ? "en" : "ar";
  return {
    spec,
    palette: c.palette,
    lang,
    content: {
      eyebrow: occ(ev.occasion),
      title: c.headline || ev.title,
      host: c.hosts,
      date: f.date(ev.startsAt),
      venue: ev.venue,
      message: c.message || undefined,
    },
  };
}
