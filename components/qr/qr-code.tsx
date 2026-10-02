"use client";

import { useMemo } from "react";
import { qrPath } from "@/lib/qr/matrix";

const QUIET = 4; // modules; the QR spec minimum

/** Accessible, high-contrast QR (dark on white, with the required quiet zone). Scales to `size` px. */
export function QrCode({ value, size = 192, label, level = "M", dimmed = false, className }: {
  value: string;
  size?: number;
  label: string;
  level?: "M" | "Q";
  dimmed?: boolean;
  className?: string;
}) {
  const { d, size: n } = useMemo(() => qrPath(value, level), [value, level]);
  const box = n + QUIET * 2;
  return (
    <svg
      role="img"
      aria-label={label}
      width={size}
      height={size}
      viewBox={`0 0 ${box} ${box}`}
      shapeRendering="crispEdges"
      className={className}
      style={{ opacity: dimmed ? 0.25 : 1, maxWidth: "100%", height: "auto" }}
    >
      <rect width={box} height={box} fill="#ffffff" />
      <path d={d} transform={`translate(${QUIET} ${QUIET})`} fill="#14110f" />
    </svg>
  );
}
