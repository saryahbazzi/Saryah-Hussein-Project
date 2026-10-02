"use client";

import clsx from "clsx";
import { useEffect, useRef, useState } from "react";

/** Fades content up once when it scrolls into view. Respects reduced motion via CSS. */
export function Reveal({
  children,
  delay = 0,
  className,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "li" | "article";
}) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as never}
      style={{ "--d": `${delay}ms` } as React.CSSProperties}
      className={clsx("reveal", visible && "is-visible", className)}
    >
      {children}
    </Tag>
  );
}
