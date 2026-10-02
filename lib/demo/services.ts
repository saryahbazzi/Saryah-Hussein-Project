"use client";

import { getMessagingProvider, MockMessagingProvider, quickReplies, renderMessage } from "@/lib/messaging";
import type { InboundEvent, MessageLocale } from "@/lib/messaging";
import { createToken } from "@/lib/qr/token";
import { applyInboundEvent, guestsOf, recordSend, reminderRecipients, type ReminderKind } from "./actions";
import { dispatch, getDemoState } from "./store";
import type { DemoEvent, DemoGuest } from "./types";

/**
 * Orchestration between the demo store and the messaging provider. This is the same flow the real
 * backend will run: send through the provider, then apply the provider's webhook events.
 */

export function eventDateText(ev: DemoEvent, locale: MessageLocale): string {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA-u-nu-latn" : "en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Riyadh",
  }).format(new Date(ev.startsAt));
}

export function messageLocaleFor(ev: DemoEvent): MessageLocale {
  return ev.customization.language === "en" ? "en" : "ar";
}

export function contextFor(ev: DemoEvent, guest: Pick<DemoGuest, "name">, locale = messageLocaleFor(ev), ticketUrl?: string) {
  return { guestName: guest.name, hosts: ev.customization.hosts, eventTitle: ev.title, dateText: eventDateText(ev, locale), venue: ev.venue, ticketUrl };
}

const hash = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

function applyEvents(events: InboundEvent[]) {
  for (const ev of events) {
    let confirmed: string | undefined;
    dispatch((s) => { const r = applyInboundEvent(s, ev); confirmed = r.confirmedGuestId; return r.state; });
    if (confirmed) void sendTicket(confirmed);
  }
}

/** Mock provider only: fake the webhooks a real provider would send back after a delivery. */
function simulateWebhooks(providerMessageId: string, to: string, guestId: string, withReply: boolean) {
  const provider = getMessagingProvider();
  if (!(provider instanceof MockMessagingProvider)) return;
  const h = hash(guestId) % 10;
  const reply = withReply ? (h < 6 ? "confirm" : h < 8 ? "decline" : undefined) : undefined;
  const events = provider.simulateEvents(providerMessageId, to, reply);
  const delay = 700 + (h % 5) * 450;
  setTimeout(() => applyEvents(events.filter((e) => e.type === "status")), delay);
  if (reply) setTimeout(() => applyEvents(events.filter((e) => e.type === "reply")), delay + 2500 + (h % 4) * 1500);
}

export async function sendInvitationTo(eventId: string, guestId: string, opts: { withReply?: boolean } = {}) {
  const s = getDemoState();
  const ev = s.events.find((e) => e.id === eventId);
  const g = s.guests.find((x) => x.id === guestId);
  if (!ev || !g || g.status === "opted_out") return;
  const locale = messageLocaleFor(ev);
  const { text, template } = renderMessage("invitation", locale, contextFor(ev, g, locale));
  const res = await getMessagingProvider().sendInvitation({
    to: g.phone, eventId, guestId, locale, text, template, buttons: quickReplies(locale), mediaType: "image",
  });
  dispatch((st) => recordSend(st, guestId, "invite", text, res));
  if (res.ok && res.providerMessageId) simulateWebhooks(res.providerMessageId, g.phone, guestId, opts.withReply ?? true);
}

/** Send to every guest who has not been contacted yet. Returns how many were attempted. */
export async function sendInvites(eventId: string): Promise<number> {
  const targets = guestsOf(getDemoState(), eventId).filter((g) => g.status === "pending");
  for (const g of targets) await sendInvitationTo(eventId, g.id);
  return targets.length;
}

export async function resendGuest(eventId: string, guestId: string) {
  await sendInvitationTo(eventId, guestId);
}

export async function sendReminders(eventId: string, kind: ReminderKind): Promise<number> {
  const s = getDemoState();
  const ev = s.events.find((e) => e.id === eventId);
  if (!ev) return 0;
  const locale = messageLocaleFor(ev);
  const targets = reminderRecipients(s, eventId, kind);
  for (const g of targets) {
    const { text, template } = renderMessage(kind === "reminder_7d" ? "reminder7d" : "reminder1d", locale, contextFor(ev, g, locale));
    const res = await getMessagingProvider().sendReminder({ to: g.phone, eventId, guestId: g.id, locale, text, template, reminder: kind === "reminder_7d" ? "7d" : "1d" });
    dispatch((st) => recordSend(st, g.id, kind, text, res));
  }
  return targets.length;
}

export async function sendTicket(guestId: string) {
  const s = getDemoState();
  const g = s.guests.find((x) => x.id === guestId);
  const ev = g && s.events.find((e) => e.id === g.eventId);
  if (!g || !ev) return;
  const locale = messageLocaleFor(ev);
  const token = await createToken(ev.id, g.id);
  const ticketUrl = `${window.location.origin}/${locale}/i/${token}`;
  const { text, template } = renderMessage("ticket", locale, contextFor(ev, g, locale, ticketUrl));
  const res = await getMessagingProvider().sendTicket({ to: g.phone, eventId: ev.id, guestId: g.id, locale, text, template, qrImageUrl: ticketUrl, ticketUrl });
  dispatch((st) => recordSend(st, g.id, "ticket", text, res));
}

/** Demo control: act as the guest replying in WhatsApp. */
export function simulateGuestReply(guestId: string, intent: "confirm" | "decline" | "stop") {
  const g = getDemoState().guests.find((x) => x.id === guestId);
  if (!g) return;
  const at = new Date().toISOString();
  applyEvents([{ type: "reply", from: g.phone, intent, text: intent === "confirm" ? "rsvp_yes" : intent === "decline" ? "rsvp_no" : "STOP", at }]);
}
