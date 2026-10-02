"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/primitives";
import { addGuest } from "@/lib/demo/actions";
import { dispatch, getDemoState } from "@/lib/demo/store";
import { normalizeSaudiMobile } from "@/lib/phone/saudi";

/** Inline form to append one guest to an event. The host's consent attestation covers added guests. */
export function AddGuestForm({ eventId, onAdded }: { eventId: string; onAdded: (name: string) => void }) {
  const t = useTranslations("dashboard.addGuest");
  const id = useId();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [size, setSize] = useState("1");
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    const cleanName = name.trim();
    const normalized = normalizeSaudiMobile(phone);
    if (!cleanName) next.name = t("errors.name");
    if (!normalized) next.phone = t("errors.phone");
    else if (getDemoState().guests.some((g) => g.eventId === eventId && g.phone === normalized)) next.phone = t("errors.duplicate");
    setErrors(next);
    if (next.name || next.phone || !normalized) return;
    dispatch((s) => addGuest(s, eventId, { name: cleanName, phone: normalized, partySize: Number(size) }));
    onAdded(cleanName);
    setName(""); setPhone(""); setSize("1");
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-4 rounded-2xl border border-line bg-sand/50 p-4 sm:grid-cols-[1fr_1fr_8rem_auto] sm:items-start">
      <Field label={t("name")} htmlFor={`${id}-n`} error={errors.name}>
        <Input id={`${id}-n`} value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!errors.name} autoComplete="off" />
      </Field>
      <Field label={t("phone")} htmlFor={`${id}-p`} hint={t("phoneHint")} error={errors.phone}>
        <Input id={`${id}-p`} dir="ltr" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="05X XXX XXXX" aria-invalid={!!errors.phone} autoComplete="off" className="text-start" />
      </Field>
      <Field label={t("party")} htmlFor={`${id}-s`}>
        <Select id={`${id}-s`} value={size} onChange={(e) => setSize(e.target.value)}>
          {Array.from({ length: 10 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
        </Select>
      </Field>
      <div className="sm:pt-[1.85rem]"><Button type="submit" className="w-full sm:w-auto">{t("submit")}</Button></div>
    </form>
  );
}
