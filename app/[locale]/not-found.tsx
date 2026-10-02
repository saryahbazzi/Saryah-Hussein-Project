import { useTranslations } from "next-intl";
import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  const t = useTranslations("common");
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-5 text-center">
      <h1 className="font-display text-5xl font-bold text-navy">{t("notFound")}</h1>
      <ButtonLink href="/">{t("backHome")}</ButtonLink>
    </main>
  );
}
