"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Badge, Card, Field, Input, Select } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { makeFormatters } from "@/lib/admin/format";
import { addInvite, revokeInvite } from "@/lib/demo/actions";
import { dispatch } from "@/lib/demo/store";
import type { DemoState, DemoUser, InviteRole } from "@/lib/demo/types";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Team access: the planner owns the account; coordinators manage events, door staff only run check-in. */
export function TeamSection({ planner, state, onNotice }: { planner: DemoUser; state: DemoState; onNotice: (m: string) => void }) {
  const t = useTranslations("admin.clients.team");
  const f = makeFormatters(useLocale());
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<InviteRole>("coordinator");
  const [error, setError] = useState<string | null>(null);
  const staff = state.users.filter((u) => u.role === "staff");
  const invites = (state.invites ?? []).filter((i) => i.plannerId === planner.id);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = email.trim().toLowerCase();
    if (!EMAIL.test(v)) return setError(t("errors.email"));
    if ([planner.email, ...staff.map((s) => s.email), ...invites.map((i) => i.email)].some((x) => x.toLowerCase() === v)) return setError(t("errors.duplicate"));
    setError(null);
    dispatch((s) => addInvite(s, planner.id, v, role));
    setEmail("");
    onNotice(t("sent", { email: v }));
  };

  return (
    <section className="mt-10" aria-labelledby="team-h">
      <h2 id="team-h" className="font-display text-2xl font-bold text-navy">{t("title")}</h2>
      <p className="mt-1 max-w-2xl text-sm text-oud-soft">{t("lead")}</p>
      <div className="mt-4 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card className="p-0 sm:p-0">
          <ul className="divide-y divide-line">
            <li className="flex flex-wrap items-center gap-3 px-5 py-4">
              <div className="min-w-0 flex-1"><p className="font-semibold text-navy">{planner.name}</p><p className="text-xs text-oud-soft"><bdi dir="ltr">{planner.email}</bdi></p></div>
              <Badge tone="navy">{t("roles.owner")}</Badge>
            </li>
            {staff.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                <div className="min-w-0 flex-1"><p className="font-semibold text-navy">{s.name}</p><p className="text-xs text-oud-soft"><bdi dir="ltr">{s.email}</bdi></p></div>
                <Badge tone="sky">{t("roles.door_staff")}</Badge>
              </li>
            ))}
            {invites.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                <div className="min-w-0 flex-1"><p className="font-semibold text-navy"><bdi dir="ltr">{i.email}</bdi></p><p className="text-xs text-oud-soft">{t("invitedOn", { date: f.date(i.createdAt) })}</p></div>
                <Badge tone="sky">{t(`roles.${i.role}`)}</Badge>
                <Badge tone="gold">{t("pending")}</Badge>
                <button type="button" onClick={() => { dispatch((s) => revokeInvite(s, i.id)); onNotice(t("revoked", { email: i.email })); }} className="inline-flex min-h-11 items-center px-2 text-sm font-semibold text-rose underline underline-offset-4">{t("revoke")}</button>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h3 className="font-display text-lg font-bold text-navy">{t("inviteTitle")}</h3>
          <form onSubmit={submit} noValidate className="mt-3 space-y-4">
            <Field label={t("email")} htmlFor="invite-email" error={error}>
              <Input id="invite-email" type="email" dir="ltr" autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!error} />
            </Field>
            <Field label={t("role")} htmlFor="invite-role" hint={t(`roleHint.${role}`)}>
              <Select id="invite-role" value={role} onChange={(e) => setRole(e.target.value as InviteRole)}>
                <option value="coordinator">{t("roles.coordinator")}</option>
                <option value="door_staff">{t("roles.door_staff")}</option>
              </Select>
            </Field>
            <Button type="submit">{t("submit")}</Button>
          </form>
        </Card>
      </div>
    </section>
  );
}
