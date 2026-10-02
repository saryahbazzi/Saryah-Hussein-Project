import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";

export function FinalCta() {
  const t = useTranslations("finalCta");
  return (
    <section className="pattern-star bg-sand py-20 sm:py-28">
      <Container className="text-center">
        <h2 className="font-display mx-auto max-w-2xl text-4xl font-bold text-navy sm:text-5xl">{t("title")}</h2>
        <p className="mx-auto mt-5 max-w-xl text-lg text-oud-soft">{t("lead")}</p>
        <ButtonLink href="/events/new" className="mt-9">{t("cta")}</ButtonLink>
      </Container>
    </section>
  );
}
