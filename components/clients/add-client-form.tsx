"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, Field, Input } from "@/components/ui/primitives";
import { addClient } from "@/lib/demo/actions";
import { dispatch, getDemoState } from "@/lib/demo/store";
import { normalizeSaudiMobile } from "@/lib/phone/saudi";

export function AddClientForm({ plannerId, onAdded }: { plannerId: string; onAdded: (name: string, id: string) => void }) {
  const t = useTranslations("admin.clients.add");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    const trimmed = name.trim();
    if (!trimmed) next.name = t("errors.name");
    else if (getDemoState().clients.some((c) => c.plannerId === plannerId && c.name.toLowerCase() === trimmed.toLowerCase())) next.name = t("errors.duplicate");
    const e164 = phone.trim() ? normalizeSaudiMobile(phone) : "";
    if (phone.trim() && !e164) next.phone = t("errors.phone");
    setErrors(next);
    if (next.name || next.phone) return;
    let id = "";
    dispatch((s) => { const r = addClient(s, plannerId, trimmed, e164 ?? ""); id = r.client.id; return r.state; });
    setName(""); setPhone("");
    onAdded(trimmed, id);
  };

  return (
    <Card>
      <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        <Field label={t("name")} htmlFor="client-name" error={errors.name}>
          <Input id="client-name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!errors.name} autoComplete="off" />
        </Field>
        <Field label={t("phone")} htmlFor="client-phone" hint={t("phoneHint")} error={errors.phone}>
          <Input id="client-phone" type="tel" inputMode="tel" dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="05x xxx xxxx" aria-invalid={!!errors.phone} />
        </Field>
        <div className="sm:col-span-2"><Button type="submit">{t("submit")}</Button></div>
      </form>
    </Card>
  );
}
