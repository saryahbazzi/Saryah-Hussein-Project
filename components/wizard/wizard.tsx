"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useCatalog } from "@/components/templates/use-catalog";
import { getTemplate, type CardSpec } from "@/lib/templates/catalog";
import { isUsable, reviewGuests } from "@/lib/guests/parse";
import { addEvent, placeOrder, setGuests } from "@/lib/demo/actions";
import { dispatch, useDemoUser } from "@/lib/demo/store";
import { sendInvites } from "@/lib/demo/services";
import { tierOf } from "@/lib/templates/catalog";
import { Stepper } from "./stepper";
import { StepDetails } from "./step-details";
import { StepTemplate } from "./step-template";
import { StepCustomize } from "./step-customize";
import { StepGuests } from "./step-guests";
import { StepPreview } from "./step-preview";
import { StepSummary } from "./step-summary";
import { StepCheckout } from "./step-checkout";
import { Success } from "./success";
import { STEPS, initialState, validateCustomize, validateDetails, type Errors, type WizardState } from "./model";
import { startsAtIso } from "./card";

const KEY = "dawati-wizard-v1";

function load(): WizardState | null {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as WizardState;
    return p && typeof p.step === "number" && p.details && p.custom && Array.isArray(p.guests) ? p : null;
  } catch { return null; }
}
const save = (s: WizardState | null) => {
  try { if (s) window.sessionStorage.setItem(KEY, JSON.stringify(s)); else window.sessionStorage.removeItem(KEY); } catch { /* storage unavailable */ }
};

export function Wizard() {
  const t = useTranslations("wizard");
  const locale = useLocale();
  const sp = useSearchParams();
  const { user } = useDemoUser();
  const { templates } = useCatalog();
  const [state, setState] = useState<WizardState>(initialState);
  const [hydrated, setHydrated] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<{ id: string; state: WizardState } | null>(null);
  const submitting = useRef(false);
  const firstRender = useRef(true);

  // Restore progress (sessionStorage), then apply ?template=
  useEffect(() => {
    const stored = load();
    let s = stored ?? { ...initialState(), custom: { ...initialState().custom, language: locale === "en" ? "en" : "ar" } };
    const slug = sp.get("template");
    const spec = slug ? getTemplate(slug) : undefined;
    if (spec) s = { ...s, templateSlug: spec.slug, details: { ...s.details, occasion: s.details.title ? s.details.occasion : spec.occasion }, custom: { ...s.custom, palette: stored?.templateSlug === spec.slug ? s.custom.palette : null } };
    setState(s);
    setHydrated(true);
  }, []);

  useEffect(() => { if (hydrated && !created) save(state); }, [state, hydrated, created]);

  const spec: CardSpec | undefined = useMemo(
    () => templates.find((x) => x.slug === state.templateSlug) ?? getTemplate(state.templateSlug ?? ""),
    [templates, state.templateSlug],
  );
  const usable = useMemo(() => reviewGuests(state.guests).filter(isUsable), [state.guests]);

  const check = useCallback((s: WizardState): Errors<string> => {
    switch (STEPS[s.step]) {
      case "details": return validateDetails(s.details);
      case "template": return s.templateSlug && (templates.some((x) => x.slug === s.templateSlug) || getTemplate(s.templateSlug)) ? {} : { template: "templateRequired" };
      case "customize": return validateCustomize(s.custom, spec?.palette ?? { bg: "#fbf7ef", ink: "#14213d", accent: "#b8893b", frame: "#b8893b" });
      case "guests": {
        const e: Errors<string> = {};
        if (usable.length < 1) e.guests = "noGuests";
        if (!s.consent) e.consent = "consentRequired";
        return e;
      }
      default: return {};
    }
  }, [templates, spec, usable.length]);

  const errors = attempted ? check(state) : {};
  const update = useCallback((fn: (s: WizardState) => WizardState) => setState(fn), []);

  // Focus the step heading on step change (not on first paint).
  useEffect(() => {
    if (!hydrated) return;
    if (firstRender.current) { firstRender.current = false; return; }
    document.getElementById("step-title")?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [state.step, hydrated]);

  const go = (step: number) => { setAttempted(false); setState((s) => ({ ...s, step })); };

  function next() {
    const e = check(state);
    if (Object.keys(e).length) {
      setAttempted(true);
      requestAnimationFrame(() => (document.querySelector('[aria-invalid="true"]') as HTMLElement | null)?.focus() ?? document.getElementById("step-title")?.focus());
      return;
    }
    setAttempted(false);
    setState((s) => {
      let custom = s.custom;
      if (STEPS[s.step] === "template" && !s.custom.headline.trim()) custom = { ...custom, headline: t("customize.headlineDefault") };
      return { ...s, custom, step: Math.min(s.step + 1, STEPS.length - 1) };
    });
  }

  async function pay() {
    if (submitting.current || !user || !spec) return;
    submitting.current = true;
    setBusy(true);
    await new Promise((r) => setTimeout(r, 1400)); // demo: pretend to talk to a payment provider
    const { details: d, custom: c } = state;
    const now = new Date().toISOString();
    let eventId = "";
    dispatch((s) => {
      const r = addEvent(s, {
        ownerId: user.id,
        clientId: user.role === "planner" && d.clientId ? d.clientId : undefined,
        title: d.title.trim(), occasion: d.occasion, startsAt: startsAtIso(d) ?? now,
        venue: d.venue.trim(), city: d.city, mapsUrl: d.mapsUrl.trim() || undefined,
        templateSlug: spec.slug,
        customization: { hosts: c.hosts.trim(), headline: c.headline.trim(), message: c.message.trim(), palette: c.palette ?? spec.palette, language: c.language },
        consentAttestedAt: now,
      });
      eventId = r.event.id;
      return r.state;
    });
    dispatch((s) => setGuests(s, eventId, usable.map((g) => ({ name: g.name, phone: g.e164!, partySize: g.partySize })), now));
    dispatch((s) => placeOrder(s, eventId, tierOf(spec.kind)).state);
    save(null);
    setCreated({ id: eventId, state });
    setBusy(false);
    void sendInvites(eventId); // runs in the background; the success screen shows live progress
  }

  function another() {
    submitting.current = false;
    setCreated(null);
    setAttempted(false);
    setState({ ...initialState(), custom: { ...initialState().custom, language: locale === "en" ? "en" : "ar" } });
  }

  if (!hydrated) return <div className="min-h-[60vh]" role="status" aria-label={t("loading")} />;
  if (created && spec) return <Success eventId={created.id} state={created.state} spec={spec} onAnother={another} />;

  const stepId = STEPS[state.step];
  const props = { state, update, errors };
  const last = state.step === STEPS.length - 1;

  return (
    <div>
      <header className="mb-8">
        <h1 className="font-display text-3xl font-bold text-navy sm:text-4xl">{t("title")}</h1>
        <p className="mt-1 text-oud-soft">{t("lead")}</p>
      </header>
      <div className="mb-10"><Stepper current={state.step} onJump={go} /></div>

      <div className="pb-28 md:pb-0">
        {stepId === "details" && <StepDetails {...props} />}
        {stepId === "template" && <StepTemplate {...props} />}
        {stepId === "customize" && <StepCustomize {...props} />}
        {stepId === "guests" && <StepGuests {...props} />}
        {stepId === "preview" && <StepPreview {...props} />}
        {stepId === "summary" && <StepSummary {...props} />}
        {stepId === "checkout" && <StepCheckout {...props} busy={busy} onPay={pay} />}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-ivory/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur md:static md:mt-10 md:border-0 md:bg-transparent md:p-0 md:pb-0 md:backdrop-blur-none">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <Button type="button" variant="ghost" disabled={state.step === 0 || busy} onClick={() => go(state.step - 1)}>
            <span aria-hidden="true" className="rtl:rotate-180">‹</span>{t("nav.back")}
          </Button>
          {Object.keys(errors).length > 0 && <p role="alert" className="hidden text-sm font-medium text-rose sm:block">{t("errors.fixErrors")}</p>}
          {!last && (
            <Button type="button" variant="primary" onClick={next} className="min-w-36">
              {t("nav.next")}<span aria-hidden="true" className="rtl:rotate-180">›</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
