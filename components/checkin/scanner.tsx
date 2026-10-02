"use client";

import { useCallback, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import clsx from "clsx";
import { Link } from "@/i18n/navigation";
import { EmptyState } from "@/components/ui/primitives";
import { ButtonLink } from "@/components/ui/button";
import { dispatch, getDemoState, useDemo, useDemoUser } from "@/lib/demo/store";
import { scannableEvents } from "@/lib/door/access";
import { giveFeedback, primeAudio } from "@/lib/door/feedback";
import { applyCheckIn, applyClassified, classifyCode, doorCounts, shouldProcess, type LastScan, type ScanView } from "@/lib/door/scan-logic";
import { DemoPanel } from "./demo-panel";
import { DoorCounter } from "./door-counter";
import { ManualEntry } from "./manual-entry";
import { RecentScans } from "./recent-scans";
import { ResultBanner } from "./result-banner";
import { useCameraScanner } from "./use-camera-scanner";

const CTRL = "inline-flex min-h-14 flex-1 items-center justify-center gap-2 rounded-2xl px-4 text-base font-bold transition active:scale-[0.99]";

/** Door scanner: camera + manual fallback + live counter, built for one-handed use in low light. */
export function Scanner({ eventId }: { eventId: string }) {
  const t = useTranslations("checkin.scanner");
  const { state } = useDemo();
  const { user } = useDemoUser();
  const [view, setView] = useState<ScanView | null>(null);
  const [sound, setSound] = useState(true);
  const lastRef = useRef<LastScan | null>(null);
  const soundRef = useRef(sound);
  soundRef.current = sound;
  const userId = user?.id ?? "";

  /** Verify, check in via the store (capturing the outcome inside dispatch), then show + signal the result. */
  const handleCode = useCallback(async (raw: string) => {
    const c = await classifyCode(raw, eventId, getDemoState().guests);
    let out: ScanView | undefined;
    dispatch((s) => { const r = applyClassified(s, eventId, c, userId); out = r.view; return r.state; });
    if (out) show(out);
  }, [eventId, userId]);

  const handleGuest = useCallback((guestId: string) => {
    let out: ScanView | undefined;
    dispatch((s) => { const r = applyCheckIn(s, eventId, guestId, userId); out = r.view; return r.state; });
    if (out) show(out);
  }, [eventId, userId]);

  function show(v: ScanView) {
    setView(v);
    giveFeedback(v.result === "valid" ? "valid" : v.result === "already_used" ? "used" : "invalid", { sound: soundRef.current });
  }

  // Camera path only: ignore the same code for ~3 s so a code held in view doesn't re-trigger.
  const onCameraCode = useCallback((code: string) => {
    const now = Date.now();
    if (!shouldProcess(lastRef.current, code, now)) return;
    lastRef.current = { code, at: now };
    void handleCode(code);
  }, [handleCode]);

  const cam = useCameraScanner(onCameraCode);

  const event = user ? scannableEvents(state, user).find((e) => e.id === eventId) : undefined;
  if (!event) {
    return (
      <EmptyState
        title={t("unavailable.title")}
        body={t("unavailable.body")}
        action={<ButtonLink href="/checkin">{t("unavailable.back")}</ButtonLink>}
      />
    );
  }

  const guests = state.guests.filter((g) => g.eventId === eventId);
  const counts = doorCounts(guests);
  const scans = state.scans.filter((s) => s.eventId === eventId).slice(0, 10);
  const nameOf = (id?: string) => (id ? state.users.find((u) => u.id === id)?.name : undefined);
  const camOn = cam.status === "on";

  return (
    <div className="mx-auto max-w-xl space-y-4 pb-10">
      <Link href="/checkin" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-oud-soft hover:text-navy">
        <span aria-hidden="true" className="rtl:-scale-x-100">←</span>{t("back")}
      </Link>

      <div className="sticky top-0 z-20 -mx-1 bg-ivory/95 px-1 pb-2 pt-1 backdrop-blur">
        <DoorCounter counts={counts} title={event.title} />
      </div>

      {view && <ResultBanner view={view} nameOf={nameOf} onDismiss={() => { setView(null); lastRef.current = null; }} />}

      <section aria-label={t("camera.viewfinder")} className="space-y-3">
        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-3xl bg-oud shadow-lift sm:aspect-[4/3]">
          <video ref={cam.videoRef} muted playsInline className={clsx("h-full w-full object-cover", !camOn && "invisible")} />
          {camOn && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
              <div className="h-[62%] w-[62%] rounded-3xl border-4 border-gold-bright/90 shadow-[0_0_0_9999px_rgba(20,17,15,0.45)]" />
            </div>
          )}
          <div className={clsx("absolute inset-x-0 bottom-0 px-4 py-3 text-center text-sm font-semibold text-ivory", camOn && "bg-black/50")} role="status">
            {cam.status === "starting" && t("camera.starting")}
            {camOn && t("camera.scanning")}
          </div>
          {!camOn && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center text-ivory">
              {cam.status === "error" && cam.error ? (
                <p role="alert" className="max-w-sm rounded-2xl bg-rose/90 px-4 py-3 text-sm font-semibold">{t(`camera.errors.${cam.error}`)}</p>
              ) : cam.status !== "starting" && (
                <>
                  <p className="font-display text-2xl font-bold">{t("camera.off")}</p>
                  <p className="max-w-xs text-sm text-ivory/80">{t("camera.offHint")}</p>
                </>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {camOn ? (
            <button type="button" onClick={cam.stop} className={`${CTRL} border-2 border-oud/25 bg-white text-oud`}>{t("camera.stop")}</button>
          ) : (
            <button type="button" disabled={cam.status === "starting"} onClick={() => { primeAudio(); void cam.start(); }} className={`${CTRL} col-span-2 bg-navy text-ivory hover:bg-navy-soft disabled:opacity-60`}>
              {t("camera.start")}
            </button>
          )}
          {camOn && cam.torchSupported && (
            <button type="button" aria-pressed={cam.torchOn} onClick={() => void cam.toggleTorch()} className={clsx(CTRL, cam.torchOn ? "bg-gold-bright text-oud" : "border-2 border-oud/25 bg-white text-oud")}>
              {cam.torchOn ? t("camera.torchOn") : t("camera.torchOff")}
            </button>
          )}
          {camOn && !cam.torchSupported && <span aria-hidden="true" />}
          <button type="button" aria-pressed={sound} onClick={() => { primeAudio(); setSound(!sound); }} className={`${CTRL} col-span-2 min-h-12 border border-line bg-white/70 text-sm text-oud-soft`}>
            <span aria-hidden="true">{sound ? "🔊" : "🔇"}</span>{sound ? t("camera.soundOn") : t("camera.soundOff")}
          </button>
        </div>
      </section>

      <ManualEntry guests={guests} onCode={(c) => void handleCode(c)} onGuest={handleGuest} />
      <RecentScans scans={scans} nameOf={nameOf} />
      <DemoPanel eventId={eventId} guests={guests} onCode={(c) => void handleCode(c)} />
    </div>
  );
}
