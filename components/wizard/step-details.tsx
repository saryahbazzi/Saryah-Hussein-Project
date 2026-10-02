"use client";

import { useTranslations } from "next-intl";
import clsx from "clsx";
import { Field, Input, Select } from "@/components/ui/primitives";
import { OCCASIONS, type Occasion } from "@/lib/templates/catalog";
import { useDemo, useDemoUser } from "@/lib/demo/store";
import type { City } from "@/lib/demo/types";
import { StepShell, type StepProps } from "./step-shell";
import type { DetailsField } from "./model";

const CITIES: City[] = ["riyadh", "jeddah"];

export function StepDetails({ state, update, errors }: StepProps<DetailsField>) {
  const t = useTranslations("wizard.details");
  const e = useTranslations("wizard.errors");
  const occ = useTranslations("occasions");
  const { user } = useDemoUser();
  const { state: demo } = useDemo();
  const d = state.details;
  const clients = user?.role === "planner" ? demo.clients.filter((c) => c.plannerId === user.id) : [];
  const set = <K extends keyof typeof d>(k: K, v: (typeof d)[K]) => update((s) => ({ ...s, details: { ...s.details, [k]: v } }));
  const err = (k: DetailsField) => (errors[k] ? e(errors[k]!) : null);
  const today = new Date(Date.now() + 3 * 3600_000).toISOString().slice(0, 10);

  return (
    <StepShell title={t("title")} lead={t("lead")}>
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field label={t("fields.title.label")} hint={t("fields.title.hint")} error={err("title")} htmlFor="ev-title">
            <Input id="ev-title" value={d.title} maxLength={80} placeholder={t("fields.title.placeholder")} aria-invalid={!!errors.title} onChange={(x) => set("title", x.target.value)} />
          </Field>
        </div>
        <Field label={t("fields.occasion")} htmlFor="ev-occasion">
          <Select id="ev-occasion" value={d.occasion} onChange={(x) => set("occasion", x.target.value as Occasion)}>
            {OCCASIONS.map((o) => <option key={o} value={o}>{occ(`items.${o}`)}</option>)}
          </Select>
        </Field>
        <fieldset>
          <legend className="mb-1.5 text-sm font-semibold text-navy">{t("fields.city")}</legend>
          <div className="grid grid-cols-2 gap-3">
            {CITIES.map((c) => (
              <label key={c} className={clsx("flex min-h-12 cursor-pointer items-center justify-center rounded-2xl border px-4 text-base font-semibold transition focus-within:outline focus-within:outline-[3px] focus-within:outline-offset-2 focus-within:outline-gold", d.city === c ? "border-navy bg-navy text-ivory" : "border-line bg-white hover:border-gold")}>
                <input type="radio" name="ev-city" className="sr-only" checked={d.city === c} onChange={() => set("city", c)} />
                {t(`fields.cities.${c}`)}
              </label>
            ))}
          </div>
        </fieldset>
        <Field label={t("fields.date")} error={err("date")} htmlFor="ev-date">
          <Input id="ev-date" type="date" min={today} value={d.date} aria-invalid={!!errors.date} onChange={(x) => set("date", x.target.value)} />
        </Field>
        <Field label={t("fields.time")} hint={t("fields.timeHint")} error={err("time")} htmlFor="ev-time">
          <Input id="ev-time" type="time" value={d.time} aria-invalid={!!errors.time} onChange={(x) => set("time", x.target.value)} />
        </Field>
        <div className="sm:col-span-2">
          <Field label={t("fields.venue.label")} error={err("venue")} htmlFor="ev-venue">
            <Input id="ev-venue" value={d.venue} maxLength={100} placeholder={t("fields.venue.placeholder")} aria-invalid={!!errors.venue} onChange={(x) => set("venue", x.target.value)} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label={t("fields.mapsUrl.label")} hint={t("fields.mapsUrl.hint")} error={err("mapsUrl")} htmlFor="ev-maps">
            <Input id="ev-maps" type="url" dir="ltr" inputMode="url" value={d.mapsUrl} placeholder="https://maps.app.goo.gl/…" aria-invalid={!!errors.mapsUrl} onChange={(x) => set("mapsUrl", x.target.value)} />
          </Field>
        </div>
        {user?.role === "planner" && (
          <div className="sm:col-span-2">
            <Field label={t("fields.client.label")} hint={t("fields.client.hint")} htmlFor="ev-client">
              <Select id="ev-client" value={d.clientId} onChange={(x) => set("clientId", x.target.value)}>
                <option value="">{t("fields.client.none")}</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </Field>
          </div>
        )}
      </div>
    </StepShell>
  );
}
