"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createNativeDetector, decodeQrFromImageData, type NativeDetector } from "@/lib/qr/scan";

export type CameraStatus = "off" | "starting" | "on" | "error";
export type CameraError = "denied" | "noCamera" | "insecure" | "generic";

const FRAME_INTERVAL_MS = 120; // ~8 decodes per second is plenty for a QR in hand
const MAX_DECODE_WIDTH = 640;

type TorchTrack = { getCapabilities?: () => { torch?: boolean } };

/**
 * Rear-camera QR scanning: native BarcodeDetector when present, otherwise jsQR on throttled canvas frames.
 * The stream is stopped on unmount and whenever the tab is hidden.
 */
export function useCameraScanner(onCode: (code: string) => void) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const detectorRef = useRef<NativeDetector | null>(null);
  const cbRef = useRef(onCode);
  const runId = useRef(0);
  const [status, setStatus] = useState<CameraStatus>("off");
  const [error, setError] = useState<CameraError | null>(null);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  useEffect(() => { cbRef.current = onCode; }, [onCode]);

  const stop = useCallback(() => {
    runId.current++;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setTorchOn(false);
    setTorchSupported(false);
    setStatus((s) => (s === "error" ? s : "off"));
  }, []);

  const start = useCallback(async () => {
    if (streamRef.current) return;
    setError(null);
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError(window.isSecureContext ? "noCamera" : "insecure");
      setStatus("error");
      return;
    }
    const id = ++runId.current;
    setStatus("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      if (id !== runId.current) { stream.getTracks().forEach((tr) => tr.stop()); return; }
      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play().catch(() => {});
      }
      const track = stream.getVideoTracks()[0] as unknown as TorchTrack | undefined;
      setTorchSupported(!!track?.getCapabilities?.().torch);
      detectorRef.current ??= createNativeDetector();
      setStatus("on");

      const tick = async () => {
        if (id !== runId.current) return;
        const v = videoRef.current;
        try {
          if (v && v.readyState >= 2 && v.videoWidth > 0) {
            let code: string | null = null;
            if (detectorRef.current) {
              const found = await detectorRef.current.detect(v);
              code = found[0]?.rawValue ?? null;
            } else {
              const scale = Math.min(1, MAX_DECODE_WIDTH / v.videoWidth);
              const w = Math.round(v.videoWidth * scale);
              const h = Math.round(v.videoHeight * scale);
              const cv = (canvasRef.current ??= document.createElement("canvas"));
              cv.width = w; cv.height = h;
              const c2 = cv.getContext("2d", { willReadFrequently: true });
              if (c2) { c2.drawImage(v, 0, 0, w, h); code = decodeQrFromImageData(c2.getImageData(0, 0, w, h)); }
            }
            if (code && id === runId.current) cbRef.current(code);
          }
        } catch {
          // A failed detect on one frame must not end the loop; if the native detector is broken, fall back to jsQR.
          detectorRef.current = null;
        }
        if (id === runId.current) timerRef.current = setTimeout(tick, FRAME_INTERVAL_MS);
      };
      timerRef.current = setTimeout(tick, FRAME_INTERVAL_MS);
    } catch (e) {
      if (id !== runId.current) return;
      const name = (e as { name?: string }).name;
      setError(name === "NotAllowedError" || name === "SecurityError" ? "denied" : name === "NotFoundError" || name === "OverconstrainedError" ? "noCamera" : "generic");
      setStatus("error");
    }
  }, []);

  const toggleTorch = useCallback(async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    const next = !torchOn;
    try {
      await track.applyConstraints({ advanced: [{ torch: next } as MediaTrackConstraintSet] });
      setTorchOn(next);
    } catch { setTorchSupported(false); }
  }, [torchOn]);

  useEffect(() => {
    const onHide = () => { if (document.hidden) stop(); };
    document.addEventListener("visibilitychange", onHide);
    return () => { document.removeEventListener("visibilitychange", onHide); stop(); };
  }, [stop]);

  return { videoRef, status, error, torchSupported, torchOn, start, stop, toggleTorch };
}
