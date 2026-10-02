import { describe, expect, it } from "vitest";
import { MockMessagingProvider, intentFromText, quickReplies, renderMessage } from "@/lib/messaging";
import { createToken, verifyToken } from "@/lib/qr/token";

const ctx = { guestName: "Fahad", hosts: "A & B", eventTitle: "Wedding", dateText: "Thu 14 May", venue: "Hall" };

describe("messaging", () => {
  it("renders both locales with ordered template variables", () => {
    const ar = renderMessage("invitation", "ar", ctx);
    expect(ar.text).toContain("Fahad");
    expect(ar.template.variables).toEqual(["Fahad", "Wedding", "Thu 14 May", "Hall"]);
    expect(renderMessage("reminder1d", "en", ctx).text).toContain("tomorrow");
    expect(quickReplies("ar")).toHaveLength(2);
  });
  it.each([["نعم", "confirm"], ["rsvp_yes", "confirm"], ["لا", "decline"], ["STOP", "stop"], ["إيقاف", "stop"], ["hmm", "other"]])(
    "maps %s to %s", (text, intent) => expect(intentFromText(text)).toBe(intent),
  );
  it("mock provider sends, fails for the unregistered number, and simulates webhooks", async () => {
    const p = new MockMessagingProvider();
    const base = { eventId: "e", guestId: "g", locale: "en" as const, text: "hi", template: { name: "t", language: "en" as const, variables: [] }, buttons: [] };
    const ok = await p.sendInvitation({ ...base, to: "+966501234567" });
    expect(ok.ok).toBe(true);
    expect((await p.sendInvitation({ ...base, to: "+966500000000" })).error).toBe("not_on_whatsapp");
    const ev = p.simulateEvents(ok.providerMessageId!, "+966501234567", "confirm");
    expect(ev.map((e) => e.type)).toEqual(["status", "status", "reply"]);
    expect(await p.parseWebhook(JSON.stringify(ev))).toHaveLength(3);
  });
});

describe("qr tokens", () => {
  it("round-trips and rejects tampering", async () => {
    const t = await createToken("e1", "g1");
    expect(await verifyToken(t)).toEqual({ eventId: "e1", guestId: "g1" });
    expect(await verifyToken(`https://x.test/i/${t}`)).toEqual({ eventId: "e1", guestId: "g1" });
    expect(await verifyToken(t.replace("g1", "g2"))).toBeNull();
    expect(await verifyToken(t, "other-secret")).toBeNull();
    expect(await verifyToken("garbage")).toBeNull();
  });
});
