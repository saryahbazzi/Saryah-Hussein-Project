import { Link } from "@/i18n/navigation";

export function Logo({ name, invert = false }: { name: string; invert?: boolean }) {
  return (
    <Link href="/" className="inline-flex items-center gap-2.5" aria-label={name}>
      <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
        <path
          d="M16 2l3.6 6.2 7-2.6-2.6 7 6.2 3.6-6.2 3.6 2.6 7-7-2.6L16 30l-3.6-6.2-7 2.6 2.6-7L1.8 19.8l6.2-3.6-2.6-7 7 2.6z"
          fill="#d9b061"
        />
        <circle cx="16" cy="16" r="4" fill={invert ? "#fbf7ef" : "#14213d"} />
      </svg>
      <span className={`font-display text-2xl font-bold ${invert ? "text-ivory" : "text-navy"}`}>
        {name}
      </span>
    </Link>
  );
}
