"use client";

import { useState } from "react";

type Step = { label: string; done: boolean };

export function OnboardingProgress({ steps }: { steps: Step[] }) {
  const [open, setOpen] = useState(false);
  const done = steps.filter((s) => s.done).length;

  if (done === steps.length) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-[12px] uppercase tracking-wide text-stone border border-line px-3 py-2 hover:border-ink hover:text-ink transition-colors cursor-pointer"
      >
        Начало работы · {done}/{steps.length}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-card border border-line shadow-[0_16px_40px_-16px_rgba(0,0,0,0.3)] p-4 z-10 flex flex-col gap-3">
          {steps.map((step) => (
            <div key={step.label} className="flex items-center gap-2.5">
              <span
                className={`w-4 h-4 flex-none rounded-full border flex items-center justify-center text-[10px] ${
                  step.done ? "bg-ink border-ink text-paper" : "border-line text-transparent"
                }`}
              >
                ✓
              </span>
              <span className={`text-[13px] ${step.done ? "text-stone line-through" : "text-ink"}`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
