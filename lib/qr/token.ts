/**
 * Signed QR tokens: `<eventId>.<guestId>.<sig>` where sig = base64url(HMAC-SHA256(secret, "eventId.guestId")[0..12]).
 * Uses Web Crypto so it runs in the browser (demo), Node and the edge.
 * In production the secret is QR_SIGNING_SECRET and verification happens server-side before calling check_in_guest.
 */
export const DEMO_QR_SECRET = "dawati-demo-secret-not-for-production";

const enc = new TextEncoder();

function b64url(bytes: Uint8Array): string {
  let s = "";
  bytes.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sign(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(payload)));
  return b64url(mac.slice(0, 12));
}

export async function createToken(eventId: string, guestId: string, secret = DEMO_QR_SECRET): Promise<string> {
  return `${eventId}.${guestId}.${await sign(secret, `${eventId}.${guestId}`)}`;
}

export interface ParsedToken { eventId: string; guestId: string }

/** Returns the ids if the signature is valid, otherwise null. Accepts a bare token or a URL ending in it. */
export async function verifyToken(raw: string, secret = DEMO_QR_SECRET): Promise<ParsedToken | null> {
  const candidate = raw.trim().split("/").pop()?.split("?")[0] ?? "";
  const parts = candidate.split(".");
  if (parts.length !== 3) return null;
  const [eventId, guestId, sig] = parts;
  if (!eventId || !guestId || !sig) return null;
  const expected = await sign(secret, `${eventId}.${guestId}`);
  if (expected.length !== sig.length) return null;
  let diff = 0; // constant-time compare
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  return diff === 0 ? { eventId, guestId } : null;
}
