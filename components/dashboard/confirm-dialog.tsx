"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/primitives";

/** Modal confirmation on the native <dialog> (focus trap + Escape for free). Optional type-to-confirm phrase. */
export function ConfirmDialog({
  open, title, body, confirmLabel, phrase, onConfirm, onCancel,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  /** If set, the user must type this exact text before the confirm button enables. */
  phrase?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const t = useTranslations("dashboard.confirm");
  const ref = useRef<HTMLDialogElement>(null);
  const [typed, setTyped] = useState("");
  const id = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) { setTyped(""); d.showModal(); }
    if (!open && d.open) d.close();
  }, [open]);

  const ok = !phrase || typed.trim().toLowerCase() === phrase.toLowerCase();

  return (
    <dialog
      ref={ref}
      onClose={onCancel}
      aria-labelledby={`${id}-t`}
      aria-describedby={`${id}-b`}
      className="m-auto w-[min(92vw,28rem)] rounded-3xl border border-line bg-ivory p-6 text-oud shadow-lift backdrop:bg-oud/50"
    >
      <h2 id={`${id}-t`} className="font-display text-2xl font-bold text-navy">{title}</h2>
      <p id={`${id}-b`} className="mt-2 text-sm leading-relaxed text-oud-soft">{body}</p>
      {phrase && (
        <div className="mt-4">
          <label htmlFor={`${id}-i`} className="mb-1.5 block text-sm font-semibold text-navy">{t("typeToConfirm", { phrase })}</label>
          <Input id={`${id}-i`} value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" />
        </div>
      )}
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <Button variant="ghost" type="button" onClick={onCancel}>{t("cancel")}</Button>
        <Button type="button" disabled={!ok} onClick={onConfirm} className="bg-rose text-ivory hover:bg-rose/90 disabled:opacity-40">{confirmLabel}</Button>
      </div>
    </dialog>
  );
}
