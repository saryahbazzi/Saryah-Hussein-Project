import QRCode from "qrcode";

/** Builds one SVG path for all dark modules; merges horizontal runs to keep the markup small and seams invisible. */
export function qrPath(text: string, level: "M" | "Q" = "M"): { d: string; size: number } {
  const qr = QRCode.create(text, { errorCorrectionLevel: level });
  const n = qr.modules.size;
  let d = "";
  for (let y = 0; y < n; y++) {
    let x = 0;
    while (x < n) {
      if (!qr.modules.get(y, x)) { x++; continue; }
      const start = x;
      while (x < n && qr.modules.get(y, x)) x++;
      d += `M${start} ${y}h${x - start}v1h-${x - start}z`;
    }
  }
  return { d, size: n };
}
