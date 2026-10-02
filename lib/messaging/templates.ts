import type { MessageLocale, QuickReply, TemplateRef } from "./types";

export interface MessageContext {
  guestName: string;
  hosts: string;
  eventTitle: string;
  dateText: string;
  venue: string;
  ticketUrl?: string;
}

/**
 * Message copy lives here (not in next-intl) because it is also the source for the
 * WhatsApp template approval submission. Keep variable order stable: {{1}}…{{n}}.
 */
export const TEMPLATE_NAMES = {
  invitation: "dawati_invitation_v1",
  reminder7d: "dawati_reminder_7d_v1",
  reminder1d: "dawati_reminder_1d_v1",
  ticket: "dawati_ticket_v1",
} as const;

const COPY = {
  ar: {
    invitation: (c: MessageContext) =>
      `السلام عليكم ${c.guestName}،\nيسعدنا دعوتكم لحضور ${c.eventTitle} 🤍\n📅 ${c.dateText}\n📍 ${c.venue}\n\nنأمل تأكيد حضوركم بالضغط على أحد الخيارين أدناه.\nلإيقاف الرسائل أرسل «إيقاف».`,
    reminder7d: (c: MessageContext) =>
      `تذكير لطيف 🤍 ${c.guestName}، يتبقى أسبوع على ${c.eventTitle}.\n📅 ${c.dateText}\n📍 ${c.venue}`,
    reminder1d: (c: MessageContext) =>
      `${c.guestName}، غدًا موعدنا في ${c.eventTitle} 🎉\n📅 ${c.dateText}\n📍 ${c.venue}\nلا تنسَ إبراز رمز QR عند الدخول.`,
    ticket: (c: MessageContext) =>
      `شكرًا لتأكيدك ${c.guestName} 🤍\nهذه بطاقة دخولك الخاصة إلى ${c.eventTitle}. أبرز رمز QR عند المدخل.\n${c.ticketUrl ?? ""}`,
    buttons: { yes: "نعم، سأحضر", no: "أعتذر عن الحضور", stop: "إيقاف الرسائل" },
  },
  en: {
    invitation: (c: MessageContext) =>
      `Hello ${c.guestName},\nYou are warmly invited to ${c.eventTitle} 🤍\n📅 ${c.dateText}\n📍 ${c.venue}\n\nPlease let us know if you can join by tapping one of the buttons below.\nReply STOP to opt out.`,
    reminder7d: (c: MessageContext) =>
      `A gentle reminder 🤍 ${c.guestName}, ${c.eventTitle} is one week away.\n📅 ${c.dateText}\n📍 ${c.venue}`,
    reminder1d: (c: MessageContext) =>
      `${c.guestName}, see you tomorrow at ${c.eventTitle} 🎉\n📅 ${c.dateText}\n📍 ${c.venue}\nPlease show your QR code at the entrance.`,
    ticket: (c: MessageContext) =>
      `Thank you for confirming, ${c.guestName} 🤍\nHere is your personal entry pass for ${c.eventTitle}. Show the QR code at the door.\n${c.ticketUrl ?? ""}`,
    buttons: { yes: "Yes, I'll attend", no: "Sorry, I can't", stop: "Stop messages" },
  },
} as const;

export type MessageKindKey = keyof typeof TEMPLATE_NAMES;

const variables = (c: MessageContext) => [c.guestName, c.eventTitle, c.dateText, c.venue];

export function renderMessage(kind: MessageKindKey, locale: MessageLocale, c: MessageContext) {
  const text = COPY[locale][kind](c);
  const template: TemplateRef = { name: TEMPLATE_NAMES[kind], language: locale, variables: variables(c) };
  return { text, template };
}

export function quickReplies(locale: MessageLocale): QuickReply[] {
  const b = COPY[locale].buttons;
  return [
    { id: "rsvp_yes", label: b.yes },
    { id: "rsvp_no", label: b.no },
  ];
}

/** Map free-text replies (and button ids) to an intent. Arabic and English. */
export function intentFromText(text: string): "confirm" | "decline" | "stop" | "other" {
  const t = text.trim().toLowerCase();
  if (/^(stop|إيقاف|ايقاف|unsubscribe)/.test(t)) return "stop";
  if (/^(rsvp_yes|yes|y|نعم|ايوه|أيوه|سأحضر|اكيد|أكيد|تم)/.test(t)) return "confirm";
  if (/^(rsvp_no|no|n|لا|اعتذر|أعتذر|آسف|اسف)/.test(t)) return "decline";
  return "other";
}
