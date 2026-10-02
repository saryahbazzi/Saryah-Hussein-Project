"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { useLocale, useTranslations } from "next-intl";
import { PageHeader } from "@/components/ui/primitives";
import { useDemo } from "@/lib/demo/store";
import { CustomersTab } from "./customers-tab";
import { EventsTab } from "./events-tab";
import { MessagesTab } from "./messages-tab";
import { OverviewTab } from "./overview-tab";
import { TemplatesTab } from "./templates-tab";

const TABS = ["overview", "customers", "events", "messages", "templates"] as const;
type Tab = (typeof TABS)[number];
const isTab = (v: string | null): v is Tab => !!v && (TABS as readonly string[]).includes(v);

/** Admin dashboard: ARIA tabs (arrow keys, Home/End), URL-synced through ?tab= without navigation. */
export function AdminDashboard() {
  const t = useTranslations("admin");
  const dir = useLocale() === "ar" ? "rtl" : "ltr";
  const { state } = useDemo();
  const [tab, setTab] = useState<Tab>("overview");
  const [now] = useState(() => Date.now());
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("tab");
    if (isTab(q)) setTab(q);
  }, []);

  const select = (next: Tab, focus = false) => {
    setTab(next);
    const url = new URL(window.location.href);
    if (next === "overview") url.searchParams.delete("tab"); else url.searchParams.set("tab", next);
    window.history.replaceState(null, "", url);
    if (focus) refs.current[next]?.focus();
  };

  const onKey = (e: React.KeyboardEvent) => {
    const i = TABS.indexOf(tab);
    const fwd = dir === "rtl" ? "ArrowLeft" : "ArrowRight";
    const back = dir === "rtl" ? "ArrowRight" : "ArrowLeft";
    let n = -1;
    if (e.key === fwd) n = (i + 1) % TABS.length;
    else if (e.key === back) n = (i - 1 + TABS.length) % TABS.length;
    else if (e.key === "Home") n = 0;
    else if (e.key === "End") n = TABS.length - 1;
    if (n >= 0) { e.preventDefault(); select(TABS[n], true); }
  };

  return (
    <div>
      <PageHeader title={t("title")} lead={t("lead")} />
      <div className="overflow-x-auto">
        <div role="tablist" aria-label={t("tabsLabel")} onKeyDown={onKey} className="inline-flex min-w-full gap-1 rounded-full border border-line bg-sand/60 p-1 sm:min-w-0">
          {TABS.map((id) => (
            <button
              key={id}
              ref={(el) => { refs.current[id] = el; }}
              role="tab"
              id={`admin-tab-${id}`}
              type="button"
              aria-selected={tab === id}
              aria-controls={`admin-panel-${id}`}
              tabIndex={tab === id ? 0 : -1}
              onClick={() => select(id)}
              className={clsx("min-h-11 whitespace-nowrap rounded-full px-5 text-sm font-semibold transition-colors motion-reduce:transition-none", tab === id ? "bg-navy text-ivory shadow-card" : "text-oud hover:bg-white/70")}
            >
              {t(`tabs.${id}`)}
            </button>
          ))}
        </div>
      </div>

      <div role="tabpanel" id={`admin-panel-${tab}`} aria-labelledby={`admin-tab-${tab}`} tabIndex={0} className="mt-6 outline-offset-8">
        {tab === "overview" && <OverviewTab state={state} now={now} onGoto={(x) => select(x, false)} />}
        {tab === "customers" && <CustomersTab state={state} />}
        {tab === "events" && <EventsTab state={state} />}
        {tab === "messages" && <MessagesTab state={state} />}
        {tab === "templates" && <TemplatesTab state={state} />}
      </div>
    </div>
  );
}
