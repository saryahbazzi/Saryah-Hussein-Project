"use client";

import { useEffect, useRef } from "react";
import { useFmt } from "./use-fmt";

/** A number that gives a brief, layout-neutral pulse when it changes (transform only, skipped for reduced motion). */
export function LiveNumber({ value, className }: { value: number; className?: string }) {
  const f = useFmt();
  const ref = useRef<HTMLSpanElement>(null);
  const prev = useRef(value);
  useEffect(() => {
    if (prev.current === value) return;
    prev.current = value;
    const el = ref.current;
    if (!el || typeof el.animate !== "function" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    el.animate([{ transform: "scale(1.2)", color: "#b8893b" }, { transform: "scale(1)" }], { duration: 700, easing: "ease-out" });
  }, [value]);
  return <span ref={ref} className={`inline-block lining-nums tabular-nums ${className ?? ""}`}>{f.num(value)}</span>;
}
