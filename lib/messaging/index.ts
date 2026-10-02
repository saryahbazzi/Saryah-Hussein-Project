import { MockMessagingProvider } from "./mock";
import { WhatsAppProvider } from "./whatsapp";
import type { MessagingProvider } from "./types";

export * from "./types";
export { renderMessage, quickReplies, intentFromText, TEMPLATE_NAMES } from "./templates";
export type { MessageContext } from "./templates";
export { MockMessagingProvider } from "./mock";

let instance: MessagingProvider | undefined;

/** Single entry point. Selected by MESSAGING_PROVIDER=mock|whatsapp (default: mock). */
export function getMessagingProvider(): MessagingProvider {
  if (!instance) {
    const which = process.env.NEXT_PUBLIC_MESSAGING_PROVIDER ?? process.env.MESSAGING_PROVIDER ?? "mock";
    instance = which === "whatsapp" ? new WhatsAppProvider() : new MockMessagingProvider();
  }
  return instance;
}
