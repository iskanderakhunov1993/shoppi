"use client";

type Step = {
  n: number;
  title: string;
  description: string;
  done: boolean;
  cta: { label: string; onClick: () => void };
  secondaryCta?: { label: string; onClick: () => void };
};

export function OnboardingModal({
  steps,
  onClose,
}: {
  steps: Step[];
  onClose: () => void;
}) {
  const done = steps.filter((s) => s.done).length;

  return (
    <div className="fixed inset-0 bg-ink/40 z-50 flex items-center justify-center p-4">
      <div className="relative bg-card border border-line w-full max-w-lg max-h-[85vh] overflow-y-auto p-8">
        <button
          onClick={onClose}
          aria-label="Закрыть"
          className="absolute top-5 right-5 text-stone hover:text-ink transition-colors text-xl leading-none cursor-pointer"
        >
          ×
        </button>

        <span className="text-[11px] uppercase tracking-widest text-stone">
          {done}/{steps.length} выполнено
        </span>
        <h2 className="font-display text-2xl mt-2">Настройте Shoppi под себя</h2>
        <p className="text-stone text-sm leading-relaxed mt-2">
          Пара шагов — и лента будет собирать находки только тех, кому вы доверяете.
        </p>

        <div className="flex flex-col gap-6 mt-7">
          {steps.map((step) => (
            <div key={step.n} className="flex gap-4">
              <span
                className={`flex-none w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-medium ${
                  step.done ? "bg-ink text-paper" : "border border-line text-stone"
                }`}
              >
                {step.done ? "✓" : step.n}
              </span>
              <div className={step.done ? "opacity-50" : ""}>
                <h3 className="font-display text-lg italic leading-tight">{step.title}</h3>
                <p className="text-stone text-[13px] leading-relaxed mt-1.5">{step.description}</p>
                {!step.done && (
                  <div className="flex gap-2.5 mt-3">
                    <button
                      type="button"
                      onClick={step.cta.onClick}
                      className="text-[12px] uppercase tracking-wide text-paper bg-ink px-4 py-2 hover:opacity-80 transition-opacity cursor-pointer"
                    >
                      {step.cta.label}
                    </button>
                    {step.secondaryCta && (
                      <button
                        type="button"
                        onClick={step.secondaryCta.onClick}
                        className="text-[12px] uppercase tracking-wide text-stone border border-line px-4 py-2 hover:border-ink hover:text-ink transition-colors cursor-pointer"
                      >
                        {step.secondaryCta.label}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
