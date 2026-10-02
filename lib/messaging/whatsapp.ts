import type {
  InboundEvent, InvitationMessage, MessagingProvider, ReminderMessage, SendResult, TicketMessage,
} from "./types";

/* eslint-disable @typescript-eslint/no-unused-vars -- stub: parameters document the contract */
/**
 * WhatsApp Business API provider — INTENTIONALLY UNIMPLEMENTED.
 * Fill in each method (Cloud API or a BSP such as 360dialog/Twilio). See lib/messaging/README.md
 * for the exact contract each method must honour.
 */
export class WhatsAppProvider implements MessagingProvider {
  readonly name = "whatsapp";

  sendInvitation(_message: InvitationMessage): Promise<SendResult> {
    throw new Error("WhatsAppProvider.sendInvitation is not implemented");
  }
  sendReminder(_message: ReminderMessage): Promise<SendResult> {
    throw new Error("WhatsAppProvider.sendReminder is not implemented");
  }
  sendTicket(_message: TicketMessage): Promise<SendResult> {
    throw new Error("WhatsAppProvider.sendTicket is not implemented");
  }
  verifyWebhook(_headers: Headers, _rawBody: string): Promise<boolean> {
    throw new Error("WhatsAppProvider.verifyWebhook is not implemented");
  }
  parseWebhook(_rawBody: string): Promise<InboundEvent[]> {
    throw new Error("WhatsAppProvider.parseWebhook is not implemented");
  }
}
