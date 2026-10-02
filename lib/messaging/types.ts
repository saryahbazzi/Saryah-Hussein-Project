/**
 * Messaging contract between the Dawati app and a WhatsApp provider.
 *
 * The app only ever talks to `MessagingProvider`. To go live, implement this
 * interface with the WhatsApp Business API (see lib/messaging/whatsapp.ts) and
 * set MESSAGING_PROVIDER=whatsapp. Nothing else in the codebase should change.
 */
export type MessageLocale = "ar" | "en";

/** Business-initiated WhatsApp messages must use a pre-approved template. */
export interface TemplateRef {
  /** Approved template name, e.g. "dawati_invitation_v1". */
  name: string;
  language: MessageLocale;
  /** Positional body variables {{1}}, {{2}}, … in order. */
  variables: string[];
}

export interface QuickReply {
  /** Stable id echoed back in the webhook, e.g. "rsvp_yes". */
  id: "rsvp_yes" | "rsvp_no" | "stop";
  label: string;
}

interface BaseMessage {
  /** Recipient in E.164, always +9665XXXXXXXX. */
  to: string;
  eventId: string;
  guestId: string;
  locale: MessageLocale;
  /** Fully rendered text. Providers that do not use templates can send this directly. */
  text: string;
  template: TemplateRef;
}

export interface InvitationMessage extends BaseMessage {
  /** Public URL of the rendered invitation image/video (header media). */
  mediaUrl?: string;
  mediaType?: "image" | "video";
  buttons: QuickReply[];
}

export interface ReminderMessage extends BaseMessage {
  reminder: "7d" | "1d";
  buttons?: QuickReply[];
}

export interface TicketMessage extends BaseMessage {
  /** Public URL of the guest's QR code image. */
  qrImageUrl: string;
  /** Link to the guest's ticket page. */
  ticketUrl: string;
}

export interface SendResult {
  ok: boolean;
  /** Provider's message id (WhatsApp "wamid"). Used to match status webhooks. Required when ok. */
  providerMessageId?: string;
  /** Machine-readable failure, e.g. "invalid_number", "not_on_whatsapp", "rate_limited". */
  error?: string;
}

export type DeliveryStatus = "sent" | "delivered" | "read" | "failed";
export type ReplyIntent = "confirm" | "decline" | "stop" | "other";

export type InboundEvent =
  | {
      type: "status";
      providerMessageId: string;
      status: DeliveryStatus;
      error?: string;
      at: string; // ISO timestamp
    }
  | {
      type: "reply";
      /** Sender in E.164. */
      from: string;
      intent: ReplyIntent;
      text: string;
      /** The message this replies to, when the provider tells us. */
      inReplyToProviderMessageId?: string;
      at: string;
    };

export interface MessagingProvider {
  readonly name: string;
  sendInvitation(message: InvitationMessage): Promise<SendResult>;
  sendReminder(message: ReminderMessage): Promise<SendResult>;
  sendTicket(message: TicketMessage): Promise<SendResult>;
  /** Check the webhook signature. Must use the raw body and constant-time comparison. */
  verifyWebhook(headers: Headers, rawBody: string): Promise<boolean>;
  /** Turn a provider webhook payload into normalised events. May return several. */
  parseWebhook(rawBody: string): Promise<InboundEvent[]>;
}
