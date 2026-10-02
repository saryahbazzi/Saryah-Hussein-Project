"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import clsx from "clsx";
import { useRouter } from "@/i18n/navigation";
import { normalizeSaudiMobile } from "@/lib/phone/saudi";
import { homeFor, SIGNUP_ROLES } from "@/lib/auth/roles";
import { dispatch, getDemoState, signInAs, useDemo } from "@/lib/demo/store";
import { Button } from "@/components/ui/button";

export const DEMO_OTP = "123456";

/** Demo sign-in: one-tap role cards plus a working OTP form (code 123456). */
export function DemoLogin({ next, defaultRole }: { next: string | null; defaultRole: "host" | "planner" }) {
  const t = useTranslations("auth");
  const tr = useTranslations("app.roles");
  const router = useRouter();
  const id = useId();
  const { ready, state } = useDemo();
  const [method, setMethod] = useState<"phone" | "email">("phone");
  const [identifier, setIdentifier] = useState("");
  const [role, setRole] = useState<(typeof SIGNUP_ROLES)[number]>(defaultRole);
  const [target, setTarget] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  function enter(userId: string) {
    signInAs(userId);
    const user = getDemoState().users.find((u) => u.id === userId)!;
    router.replace(next ?? homeFor(user.role));
  }

  function send(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (method === "phone") {
      const p = normalizeSaudiMobile(identifier);
      if (!p) return setError(t("errors.invalidPhone"));
      setTarget(p);
    } else {
      const v = identifier.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return setError(t("errors.invalidEmail"));
      setTarget(v);
    }
  }

  function verify(e: React.FormEvent) {
    e.preventDefault();
    if (code !== DEMO_OTP || !target) return setError(t("errors.invalidCode"));
    const s = getDemoState();
    const existing = s.users.find((u) => (method === "phone" ? u.phone === target : u.email === target));
    if (existing) return enter(existing.id);
    const nu = {
      id: `u-new-${Date.now().toString(36)}`, name: target, role, createdAt: new Date().toISOString(),
      email: method === "email" ? target : "", phone: method === "phone" ? target : "",
    };
    dispatch((st) => ({ ...st, users: [...st.users, nu] }));
    enter(nu.id);
  }

  return (
    <div className="mt-8 space-y-8">
      <div>
        <p className="mb-3 text-sm font-semibold text-navy">{t("demo.quick")}</p>
        <div className="grid grid-cols-2 gap-3">
          {state.users.slice(0, 4).map((u) => (
            <button
              key={u.id}
              type="button"
              disabled={!ready}
              onClick={() => enter(u.id)}
              className="min-h-14 rounded-2xl border border-line bg-white px-3 py-2 text-start transition hover:border-navy hover:shadow-card disabled:opacity-50"
            >
              <span className="block text-sm font-semibold text-navy">{tr(u.role)}</span>
              <span className="block truncate text-xs text-oud-soft">{u.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs text-oud-soft" aria-hidden="true">
        <span className="h-px flex-1 bg-line" />{t("demo.or")}<span className="h-px flex-1 bg-line" />
      </div>

      {!target ? (
        <form onSubmit={send} className="space-y-4" noValidate>
          <div role="tablist" aria-label={t("methodLabel")} className="grid grid-cols-2 rounded-full bg-sand p-1">
            {(["phone", "email"] as const).map((m) => (
              <button key={m} type="button" role="tab" aria-selected={method === m}
                onClick={() => { setMethod(m); setIdentifier(""); setError(null); }}
                className={clsx("min-h-11 rounded-full text-sm font-semibold transition", method === m ? "bg-navy text-ivory shadow-card" : "text-oud-soft")}>
                {t(`methods.${m}`)}
              </button>
            ))}
          </div>
          <div>
            <label htmlFor={`${id}-id`} className="mb-2 block text-sm font-semibold text-navy">{t(method === "phone" ? "phoneLabel" : "emailLabel")}</label>
            <input id={`${id}-id`} dir="ltr" type={method === "phone" ? "tel" : "email"} inputMode={method === "phone" ? "tel" : "email"}
              placeholder={method === "phone" ? "05X XXX XXXX" : "name@example.com"} value={identifier}
              onChange={(e) => setIdentifier(e.target.value)} aria-invalid={!!error}
              className="w-full min-h-12 rounded-2xl border border-line bg-white px-4 py-3 text-start text-lg" />
          </div>
          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-navy">{t("roleLabel")}</legend>
            <div className="grid grid-cols-2 gap-3">
              {SIGNUP_ROLES.map((r) => (
                <label key={r} className={clsx("cursor-pointer rounded-2xl border px-4 py-3 text-center text-sm font-semibold focus-within:outline focus-within:outline-[3px] focus-within:outline-gold", role === r ? "border-navy bg-navy/5 text-navy" : "border-line text-oud-soft")}>
                  <input type="radio" name={`${id}-role`} className="sr-only" checked={role === r} onChange={() => setRole(r)} />
                  {t(`roles.${r}`)}
                </label>
              ))}
            </div>
          </fieldset>
          {error && <p role="alert" className="text-sm font-medium text-rose">{error}</p>}
          <Button type="submit" className="w-full">{t("sendCode")}</Button>
        </form>
      ) : (
        <form onSubmit={verify} className="space-y-4" noValidate>
          <p className="text-sm text-oud-soft">{t("codeSentTo")} <bdi dir="ltr" className="font-semibold text-navy">{target}</bdi></p>
          <p className="rounded-2xl bg-sand p-3 text-sm text-oud">{t("demo.codeHint", { code: DEMO_OTP })}</p>
          <label htmlFor={`${id}-code`} className="block text-sm font-semibold text-navy">{t("code")}</label>
          <input id={`${id}-code`} dir="ltr" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} autoFocus aria-invalid={!!error}
            className="w-full min-h-12 rounded-2xl border border-line bg-white px-4 py-3 text-center text-2xl tracking-[0.5em]" />
          {error && <p role="alert" className="text-sm font-medium text-rose">{error}</p>}
          <Button type="submit" className="w-full">{t("verify")}</Button>
          <button type="button" className="min-h-11 w-full text-sm font-medium text-gold-ink underline" onClick={() => { setTarget(null); setCode(""); setError(null); }}>{t("changeNumber")}</button>
        </form>
      )}
    </div>
  );
}
