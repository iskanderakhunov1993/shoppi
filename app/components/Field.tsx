export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[11px] font-semibold uppercase tracking-wider text-stone">
        {label}
      </label>
      {children}
    </div>
  );
}

export const inputClass =
  "font-body text-[14.5px] py-3 px-1 border-0 border-b border-line bg-transparent text-ink outline-none focus:border-b-[1.5px] focus:border-ink transition-colors";

export const buttonClass =
  "font-body text-[13px] font-semibold uppercase tracking-wide text-paper bg-ink px-5 py-3.5 hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";
