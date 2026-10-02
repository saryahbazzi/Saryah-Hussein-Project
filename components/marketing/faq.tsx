import { useTranslations } from "next-intl";
import { Section, SectionHeading } from "@/components/ui/container";

const ITEMS = ["whatsapp", "guests", "qr", "reminders", "privacy", "planners"] as const;

export function Faq() {
  const t = useTranslations("faq");
  return (
    <Section id="faq">
      <SectionHeading eyebrow={t("eyebrow")} title={t("title")} align="center" />
      <div className="mx-auto mt-12 max-w-3xl divide-y divide-line border-y border-line">
        {ITEMS.map((k) => (
          <details key={k} className="group py-5">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold text-navy [&::-webkit-details-marker]:hidden">
              {t(`items.${k}.q`)}
              <span aria-hidden="true" className="text-2xl text-gold transition group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 pe-8 text-oud-soft">{t(`items.${k}.a`)}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}
