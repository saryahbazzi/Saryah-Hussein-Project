import type { DemoEvent } from "@/lib/demo/types";
import type { CardContent } from "@/components/invitation/invitation-card";
import { formatEventDate, riyadhToIso, type CardLang } from "@/components/templates/format";
import type { CustomizeState, DetailsState } from "./model";

export const cardLang = (c: CustomizeState): CardLang => (c.language === "en" ? "en" : "ar");

export function startsAtIso(d: DetailsState): string | null {
  return riyadhToIso(d.date, d.time);
}

/** Content for the live card preview. Empty fields fall back to short placeholders so the card never looks broken. */
export function buildCardContent(
  d: DetailsState,
  c: CustomizeState,
  eyebrow: string,
  placeholders: { hosts: string; headline: string; date: string; venue: string },
  withMessage = false,
): CardContent {
  const iso = startsAtIso(d);
  return {
    eyebrow,
    title: c.hosts.trim() || placeholders.hosts,
    host: c.headline.trim() || placeholders.headline,
    date: iso ? formatEventDate(iso, cardLang(c)) : placeholders.date,
    venue: d.venue.trim() || placeholders.venue,
    message: withMessage ? c.message.trim() || undefined : undefined,
  };
}

/** A transient event object so `contextFor` can render WhatsApp text before anything is saved. */
export function draftEvent(d: DetailsState, c: CustomizeState): DemoEvent {
  return {
    id: "draft", ownerId: "", title: d.title.trim(), occasion: d.occasion,
    startsAt: startsAtIso(d) ?? new Date().toISOString(), venue: d.venue.trim(), city: d.city,
    templateSlug: "", status: "draft", createdAt: new Date().toISOString(),
    customization: { hosts: c.hosts.trim(), headline: c.headline.trim(), message: c.message.trim(), palette: { bg: "", ink: "", accent: "", frame: "" }, language: c.language },
  };
}
