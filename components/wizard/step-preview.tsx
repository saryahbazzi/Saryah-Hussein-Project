"use client";

import { useTranslations } from "next-intl";
import { useCatalog } from "@/components/templates/use-catalog";
import { getTemplate } from "@/lib/templates/catalog";
import { StepShell, type StepProps } from "./step-shell";
import { WhatsAppPreview } from "./whatsapp-mock";

export function StepPreview({ state, update }: StepProps) {
  void update;
  const t = useTranslations("wizard.preview");
  const { templates } = useCatalog();
  const spec = templates.find((x) => x.slug === state.templateSlug) ?? getTemplate(state.templateSlug ?? "");
  if (!spec) return null;
  return (
    <StepShell title={t("title")} lead={t("lead")}>
      <WhatsAppPreview state={state} spec={spec} palette={state.custom.palette ?? spec.palette} />
    </StepShell>
  );
}
