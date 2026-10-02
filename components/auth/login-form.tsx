"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import clsx from "clsx";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { normalizeSaudiMobile } from "@/lib/phone/saudi";
import { homeFor, SIGNUP_ROLES, type Role } from "@/lib/auth/roles";
import { Button } from "@/components/ui/button";

type Method = "email" | "phone";
type ErrorKey = "invalidEmail" | "invalidPhone" | "invalidCode" | "sendFailed" | "tooMany";

export function LoginForm({ next, defaultRole }: { next: string | null; defaultRole: "host" | "planner" }) {
  const t = useTranslations("auth");
  const router = useRouter();
  const id = useId();
  const [method, setMethod] = useState<Method>("phone");
  const [identifier, setIdentifier] = useState("");
  const [role, setRole] = useState<(typeof SIGNUP_ROLES)[number]>(defaultRole);
  const [code, setCode] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<ErrorKey | null>(null);
  const [busy, setBusy] = useState(false);

  const supabase = createClient();

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const locale = document.documentElement.lang === "en" ? "en" : "ar";
    const data = { role, locale };

    let target: string;
    if (method === "phone") {
      const phone = normalizeSaudiMobile(identifier);
      if (!phone) return setError("invalidPhone");
      target = phone;
    } else {
      target = identifier.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target)) return setError("invalidEmail");
    }

    setBusy(true);
    const { error: err } =
      method === "phone"
        ? await supabase.auth.signInWithOtp({ phone: target, options: { data } })
        : await supabase.auth.signInWithOtp({ email: target, options: { data } });
    setBusy(false);
    if (err) return setError(err.status === 429 ? "tooMany" : "sendFailed");
    setSentTo(target);
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    if (!sentTo) return;
    setError(null);
    if (!/^\d{6}$/.test(code)) return setError("invalidCode");
    setBusy(true);
    const { data, error: err } =
      method === "phone"
        ? await supabase.auth.verifyOtp({ phone: sentTo, token: code, type: "sms" })
        : await supabase.auth.verifyOtp({ email: sentTo, token: code, type: "email" });
    if (err || !data.user) {
      setBusy(false);
      return setError("invalidCode");
    }
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
    router.replace(next ?? homeFor((profile?.role as Role) ?? "host"));
    router.refresh();
  }

  const errorText = error && t(`errors.${error}`);

  if (sentTo) {
    return (
      <form onSubmit={verify} className="mt-8 space-y-5" noValidate>
        <p className="text-sm text-oud-soft">
          {t("codeSentTo")} <bdi dir="ltr" className="font-semibold text-navy">{sentTo}</bdi>
        </p>
        <div>
          <label htmlFor={`${id}-code`} className="mb-2 block text-sm font-semibold text-navy">{t("code")}</label>
          <input
            id={`${id}-code`}
            dir="ltr"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            aria-invalid={error === "invalidCode"}
            aria-describedby={error ? `${id}-err` : undefined}
            className="w-full rounded-2xl border border-line bg-white px-4 py-3.5 text-center text-2xl tracking-[0.5em]"
            autoFocus
          />
        </div>
        <Alert id={`${id}-err`} text={errorText} />
        <Button type="submit" className="w-full" disabled={busy}>{busy ? t("verifying") : t("verify")}</Button>
        <button type="button" className="min-h-11 w-full text-sm font-medium text-gold-ink underline" onClick={() => { setSentTo(null); setCode(""); setError(null); }}>
          {t("changeNumber")}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={sendCode} className="mt-8 space-y-5" noValidate>
      <div role="tablist" aria-label={t("methodLabel")} className="grid grid-cols-2 rounded-full bg-sand p-1">
        {(["phone", "email"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={method === m}
            onClick={() => { setMethod(m); setIdentifier(""); setError(null); }}
            className={clsx(
              "min-h-11 rounded-full text-sm font-semibold transition",
              method === m ? "bg-navy text-ivory shadow-card" : "text-oud-soft hover:text-navy",
            )}
          >
            {t(`methods.${m}`)}
          </button>
        ))}
      </div>

      <div>
        <label htmlFor={`${id}-id`} className="mb-2 block text-sm font-semibold text-navy">
          {t(method === "phone" ? "phoneLabel" : "emailLabel")}
        </label>
        <input
          id={`${id}-id`}
          dir="ltr"
          type={method === "phone" ? "tel" : "email"}
          inputMode={method === "phone" ? "tel" : "email"}
          autoComplete={method === "phone" ? "tel" : "email"}
          placeholder={method === "phone" ? "05X XXX XXXX" : "name@example.com"}
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          aria-invalid={error === "invalidPhone" || error === "invalidEmail"}
          aria-describedby={error ? `${id}-err` : undefined}
          className="w-full rounded-2xl border border-line bg-white px-4 py-3.5 text-start text-lg"
        />
        {method === "phone" && <p className="mt-2 text-xs text-oud-soft">{t.rich("phoneHint", { ltr: (c) => <bdi dir="ltr">{c}</bdi> })}</p>}
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-navy">{t("roleLabel")}</legend>
        <div className="grid grid-cols-2 gap-3">
          {SIGNUP_ROLES.map((r) => (
            <label
              key={r}
              className={clsx(
                "cursor-pointer rounded-2xl border px-4 py-3 text-center text-sm font-semibold transition focus-within:outline focus-within:outline-[3px] focus-within:outline-gold",
                role === r ? "border-navy bg-navy/5 text-navy" : "border-line text-oud-soft",
              )}
            >
              <input type="radio" name={`${id}-role`} className="sr-only" checked={role === r} onChange={() => setRole(r)} />
              {t(`roles.${r}`)}
            </label>
          ))}
        </div>
        <p className="mt-2 text-xs text-oud-soft">{t("roleHint")}</p>
      </fieldset>

      <Alert id={`${id}-err`} text={errorText} />
      <Button type="submit" className="w-full" disabled={busy}>{busy ? t("sending") : t("sendCode")}</Button>
      <p className="text-center text-xs text-oud-soft">{t("terms")}</p>
    </form>
  );
}

function Alert({ id, text }: { id: string; text: string | null }) {
  return (
    <p id={id} role="alert" className={clsx("text-sm font-medium text-rose", !text && "hidden")}>
      {text}
    </p>
  );
}
