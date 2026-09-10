import Link from "next/link";

export function EmptyState({
  icon,
  title,
  description,
  cta,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  cta?: { label: string; href: string };
}) {
  return (
    <div className="max-w-md flex flex-col gap-4 items-start">
      {icon}
      <p className="font-display italic text-base text-stone">{title}</p>
      {description && (
        <p className="text-stone text-sm leading-relaxed">{description}</p>
      )}
      {cta && (
        <Link
          href={cta.href}
          className="w-fit text-[12px] font-semibold uppercase tracking-wide text-paper bg-ink px-5 py-3 hover:opacity-80 transition-opacity"
        >
          {cta.label}
        </Link>
      )}
    </div>
  );
}
