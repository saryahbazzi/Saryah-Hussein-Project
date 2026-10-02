import clsx from "clsx";
import { Link } from "@/i18n/navigation";
import type { ComponentProps } from "react";

type Variant = "primary" | "gold" | "ghost" | "light";

const base =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-7 text-[0.95rem] font-semibold transition duration-300 ease-[var(--ease-soft)] active:scale-[0.98]";
const variants: Record<Variant, string> = {
  primary: "bg-navy text-ivory hover:bg-navy-soft shadow-card",
  gold: "bg-gold-bright text-oud hover:bg-gold hover:text-ivory shadow-card",
  ghost: "border border-oud/25 text-oud hover:border-oud hover:bg-oud/5",
  light: "bg-ivory text-navy hover:bg-sand",
};

export function ButtonLink({
  variant = "primary",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={clsx(base, variants[variant], className)} {...props} />;
}

export function Button({
  variant = "primary",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: Variant }) {
  return <button className={clsx(base, variants[variant], className)} {...props} />;
}
