import type {
  InboundEvent, InvitationMessage, MessagingProvider, ReminderMessage, SendResult, TicketMessage,
} from "./types";

export interface MockSent {
  providerMessageId: string;
  to: string;
  kind: "invitation" | "reminder" | "ticket";
  text: string;
  at: string;
}

let counter = 0;
const nextId = () => `mock.wamid.${Date.now().toString(36)}${(counter++).toString(36)}`;

/**
 * Local stand-in for WhatsApp. It never leaves the process: sends succeed (except for the
 * special number +966500000000, which fails like an unregistered number) and the caller can
 * ask for the delivery/reply events a real webhook would produce via `simulateEvents`.
 */
export class MockMessagingProvider implements MessagingProvider {
  readonly name = "mock";
  readonly outbox: MockSent[] = [];

  private record(kind: MockSent["kind"], to: string, text: string): SendResult {
    if (to === "+966500000000") return { ok: false, error: "not_on_whatsapp" };
    const providerMessageId = nextId();
    this.outbox.push({ providerMessageId, to, kind, text, at: new Date().toISOString() });
    return { ok: true, providerMessageId };
  }

  async sendInvitation(m: InvitationMessage) { return this.record("invitation", m.to, m.text); }
  async sendReminder(m: ReminderMessage) { return this.record("reminder", m.to, m.text); }
  async sendTicket(m: TicketMessage) { return this.record("ticket", m.to, m.text); }

  async verifyWebhook() { return true; }

  async parseWebhook(rawBody: string): Promise<InboundEvent[]> {
    const parsed = JSON.parse(rawBody) as InboundEvent | InboundEvent[];
    return Array.isArray(parsed) ? parsed : [parsed];
  }

  /** Events a real provider would deliver after a send: delivered, read, then (sometimes) a reply. */
  simulateEvents(providerMessageId: string, to: string, reply?: "confirm" | "decline"): InboundEvent[] {
    const at = new Date().toISOString();
    const events: InboundEvent[] = [
      { type: "status", providerMessageId, status: "delivered", at },
      { type: "status", providerMessageId, status: "read", at },
    ];
    if (reply) {
      events.push({
        type: "reply", from: to, intent: reply, at,
        text: reply === "confirm" ? "rsvp_yes" : "rsvp_no",
        inReplyToProviderMessageId: providerMessageId,
      });
    }
    return events;
  }
}
