/** Haptic + audio feedback for scan results. Everything is best-effort: unsupported APIs are silently skipped. */
export type FeedbackKind = "valid" | "used" | "invalid";

const PATTERNS: Record<FeedbackKind, number[]> = { valid: [70], used: [70, 70, 70], invalid: [260] };
// [frequency Hz, start offset s, duration s, waveform]
const TONES: Record<FeedbackKind, [number, number, number, OscillatorType][]> = {
  valid: [[880, 0, 0.12, "sine"], [1320, 0.13, 0.2, "sine"]],
  used: [[520, 0, 0.14, "triangle"], [520, 0.2, 0.14, "triangle"]],
  invalid: [[170, 0, 0.42, "sawtooth"]],
};

let ctx: AudioContext | null = null;

/** Call from a user gesture so mobile browsers allow audio later. */
export function primeAudio() {
  if (typeof window === "undefined") return;
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx ??= new AC();
    if (ctx.state === "suspended") void ctx.resume();
  } catch { /* audio unavailable */ }
}

export function giveFeedback(kind: FeedbackKind, opts: { sound: boolean }) {
  try { navigator.vibrate?.(PATTERNS[kind]); } catch { /* no haptics */ }
  if (!opts.sound) return;
  primeAudio();
  if (!ctx) return;
  const t0 = ctx.currentTime;
  for (const [freq, at, dur, type] of TONES[kind]) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t0 + at);
    gain.gain.exponentialRampToValueAtTime(0.18, t0 + at + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + at + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t0 + at);
    osc.stop(t0 + at + dur + 0.05);
  }
}
