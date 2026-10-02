"use client";

import { useEffect, useRef, useState } from "react";

/** A soft pentatonic phrase synthesised with Web Audio, standing in for licensed invitation music. */
const NOTES = [293.66, 349.23, 392.0, 440.0, 392.0, 349.23, 293.66, 261.63];

export function MusicToggle({ onLabel, offLabel, className }: { onLabel: string; offLabel: string; className?: string }) {
  const [on, setOn] = useState(false);
  const ctx = useRef<AudioContext | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => stop(), []); // eslint-disable-line react-hooks/exhaustive-deps

  function stop() {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    ctx.current?.close().catch(() => {});
    ctx.current = null;
  }

  function start() {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const c = new AC();
    ctx.current = c;
    let i = 0;
    const play = () => {
      const t = c.currentTime;
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = "triangle";
      osc.frequency.value = NOTES[i++ % NOTES.length];
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.08, t + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
      osc.connect(gain).connect(c.destination);
      osc.start(t);
      osc.stop(t + 1.2);
    };
    play();
    timer.current = setInterval(play, 900);
  }

  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => { if (on) stop(); else start(); setOn(!on); }}
      className={className ?? "inline-flex min-h-11 items-center gap-2 rounded-full border border-oud/20 px-4 text-sm font-semibold hover:bg-oud/5"}
    >
      <span aria-hidden="true">{on ? "❚❚" : "♪"}</span>
      {on ? offLabel : onLabel}
    </button>
  );
}
