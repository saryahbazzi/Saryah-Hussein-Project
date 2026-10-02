export function StepShell({ title, lead, children }: { title: string; lead?: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby="step-title">
      <h2 id="step-title" tabIndex={-1} className="font-display text-3xl font-bold text-navy outline-none sm:text-4xl">{title}</h2>
      {lead && <p className="mt-2 max-w-2xl text-oud-soft">{lead}</p>}
      <div className="mt-8">{children}</div>
    </section>
  );
}

export type StepProps<E extends string = string> = {
  state: import("./model").WizardState;
  update: (fn: (s: import("./model").WizardState) => import("./model").WizardState) => void;
  errors: import("./model").Errors<E>;
};
