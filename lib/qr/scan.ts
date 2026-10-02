import jsQR from "jsqr";

/** Minimal shape of the native BarcodeDetector (not yet in lib.dom). */
export interface NativeDetector { detect(src: ImageBitmapSource): Promise<{ rawValue: string }[]> }

export function createNativeDetector(): NativeDetector | null {
  const Ctor = (globalThis as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => NativeDetector }).BarcodeDetector;
  if (!Ctor) return null;
  try { return new Ctor({ formats: ["qr_code"] }); } catch { return null; }
}

/** Fallback decoder: jsQR over raw RGBA pixels. Returns the decoded text or null. */
export function decodeQrFromImageData(img: { data: Uint8ClampedArray; width: number; height: number }): string | null {
  const r = jsQR(img.data, img.width, img.height, { inversionAttempts: "attemptBoth" });
  return r?.data ? r.data : null;
}
