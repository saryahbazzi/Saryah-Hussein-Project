import { useTranslations } from "next-intl";
import { Section, SectionHeading } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";

const FEATURES = ["whatsapp", "rsvp", "qr", "reminders", "bilingual", "privacy"] as const;

const ICONS: Record<(typeof FEATURES)[number], string> = {
  whatsapp: "M4 20l1.4-4.2A8 8 0 1112 20a8 8 0 01-3.8-1L4 20z",
  rsvp: "M5 13l4 4L19 7",
  qr: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 18h2v2h-2zM14 18h2",
  reminders: "M12 7v5l3 2M12 3a9 9 0 100 18 9 9 0 000-18z",
  bilingual: "M3 5h8M7 3v2m0 0c0 4-2 7-4 8m4-8c0 3 2 6 5 7M13 21l4-10 4 10m-6.5-3h5",
  privacy: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z",
};

export function Features() {
  const t = useTranslations("features");
  return (
    <Section tone="sand">
      <SectionHeading eyebrow={t("eyebrow")} title={t("title")} align="center" />
      <ul className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f, i) => (
          <Reveal as="li" key={f} delay={(i % 3) * 100}>
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-navy text-gold-bright">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d={ICONS[f]} />
              </svg>
            </span>
            <h3 className="mt-5 text-lg font-semibold text-navy">{t(`items.${f}.title`)}</h3>
            <p className="mt-2 text-oud-soft">{t(`items.${f}.body`)}</p>
          </Reveal>
        ))}
      </ul>
    </Section>
  );
}
