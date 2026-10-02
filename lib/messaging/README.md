# Messaging service contract

All WhatsApp traffic goes through `MessagingProvider` (`lib/messaging/types.ts`). The app ships with
`MockMessagingProvider` (in-memory, used by the demo). To go live, implement `WhatsAppProvider`
(`lib/messaging/whatsapp.ts`) and set `MESSAGING_PROVIDER=whatsapp`. No other file should need to change.

## Methods

| Method | When the app calls it | What you must do |
|---|---|---|
| `sendInvitation(m)` | Host pays / presses **Send** or **Resend** | Send template `m.template` (header = `m.mediaUrl`, body vars = `m.template.variables`, quick-reply buttons = `m.buttons`). Return `{ ok: true, providerMessageId }`. |
| `sendReminder(m)` | Cron, 7 days and 1 day before the event (`m.reminder`) | Send the matching approved template. |
| `sendTicket(m)` | Right after a guest taps **Yes** | Send the QR image (`m.qrImageUrl`) + `m.ticketUrl`. |
| `verifyWebhook(headers, rawBody)` | Start of `POST /api/webhooks/whatsapp` | Verify the provider signature (e.g. `X-Hub-Signature-256`) on the **raw** body, constant-time. Return `false` to reject with 401. |
| `parseWebhook(rawBody)` | After verification | Return normalised `InboundEvent[]`. One webhook may carry many events. |

### `SendResult`
`{ ok: true, providerMessageId }` on success. `{ ok: false, error }` on failure, where `error` is one of
`invalid_number | not_on_whatsapp | rate_limited | template_rejected | unknown`. Never throw for per-recipient
failures; throw only for misconfiguration. `providerMessageId` **must** be the id later echoed in status webhooks.

### `InboundEvent`
- `{ type: "status", providerMessageId, status: "sent" | "delivered" | "read" | "failed", error?, at }`
- `{ type: "reply", from, intent: "confirm" | "decline" | "stop" | "other", text, inReplyToProviderMessageId?, at }`

Map button ids `rsvp_yes` / `rsvp_no` / `stop` and free text (Arabic or English: `نعم`, `لا`, `إيقاف`, `STOP`)
to `intent`. `intentFromText()` in `lib/messaging/templates.ts` already does this; reuse it.

## Rules
- Numbers are always E.164 `+9665XXXXXXXX`, already validated by the app.
- **Idempotency:** the app never sends the same `(guest, kind)` twice; you may still receive duplicate webhooks. Handling an event twice must be harmless.
- **Opt-out:** a `stop` reply sets the guest to `opted_out`; the app will not message them again.
- **Templates:** names and variable order are defined in `lib/messaging/templates.ts` (`TEMPLATE_NAMES`, `renderMessage`). Submit the Arabic and English text there for approval. The `text` field is the rendered preview.
- Webhook route to build: `app/api/webhooks/whatsapp/route.ts` → `verifyWebhook` → `parseWebhook` → apply each event (status updates `messages` + guest timestamps; reply updates `guests.status`, then triggers `sendTicket` on `confirm`). The demo applies the same events in `lib/demo/actions.ts` (`applyInboundEvent`), which is the reference behaviour.
