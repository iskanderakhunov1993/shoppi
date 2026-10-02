export function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={htmlFor} className="text-[11px] font-semibold uppercase tracking-wider text-stone">
        {label}
      </label>
      {children}
    </div>
  );
}

export const inputClass =
  "font-body text-[14.5px] py-3 px-1 border-0 border-b border-line bg-transparent text-ink outline-none focus:border-b-[1.5px] focus:border-ink transition-colors";

// Boxed variant for settings-style forms where the edit affordance must be obvious.
export const boxedInputClass =
  "font-body text-[14.5px] py-2.5 px-3 border border-line bg-transparent text-ink outline-none focus:border-ink focus-visible:ring-1 focus-visible:ring-ink disabled:bg-raise disabled:text-stone disabled:cursor-not-allowed transition-colors w-full";

export const secondaryButtonClass =
  "font-body text-[13px] font-semibold uppercase tracking-wide text-ink border border-ink px-5 py-3.5 hover:bg-ink hover:text-paper transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-ink cursor-pointer";

export const buttonClass =
  "font-body text-[13px] font-semibold uppercase tracking-wide text-paper bg-ink px-5 py-3.5 hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";
