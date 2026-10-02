import clsx from "clsx";

export function Container({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return <div className={clsx("mx-auto w-full max-w-6xl px-5 sm:px-8", className)} {...props} />;
}

export function Section({
  id,
  className,
  children,
  tone = "ivory",
}: {
  id?: string;
  className?: string;
  children: React.ReactNode;
  tone?: "ivory" | "sand" | "navy";
}) {
  return (
    <section
      id={id}
      className={clsx(
        "scroll-mt-20 py-20 sm:py-28",
        tone === "sand" && "bg-sand",
        tone === "navy" && "bg-navy text-ivory",
        className,
      )}
    >
      <Container>{children}</Container>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  lead,
  align = "start",
  invert = false,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  align?: "start" | "center";
  invert?: boolean;
}) {
  return (
    <div className={clsx("max-w-2xl", align === "center" && "mx-auto text-center")}>
      {eyebrow && (
        <p
          className={clsx(
            "mb-4 text-sm font-semibold tracking-wide",
            invert ? "text-gold-bright" : "text-gold-ink",
          )}
        >
          {eyebrow}
        </p>
      )}
      <h2 className="font-display text-4xl font-bold sm:text-5xl">{title}</h2>
      {lead && (
        <p className={clsx("mt-5 text-lg", invert ? "text-ivory/80" : "text-oud-soft")}>{lead}</p>
      )}
    </div>
  );
}
