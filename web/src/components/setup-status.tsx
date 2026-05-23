import type { SetupStep } from "@/lib/navigation";

const statusLabel: Record<SetupStep["status"], string> = {
  ready: "準備済み",
  next: "次に実施",
  later: "後続"
};

type SetupStatusProps = {
  steps: SetupStep[];
};

export function SetupStatus({ steps }: SetupStatusProps) {
  return (
    <section className="status-panel" aria-labelledby="setup-heading">
      <div className="section-heading">
        <p className="eyebrow">Migration plan</p>
        <h2 id="setup-heading">Web版の準備状況</h2>
      </div>
      <div className="step-list">
        {steps.map((step) => (
          <article className="step-card" data-status={step.status} key={step.title}>
            <span>{statusLabel[step.status]}</span>
            <h3>{step.title}</h3>
            <p>{step.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
