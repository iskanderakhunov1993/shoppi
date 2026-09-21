"use client";

import { SOCIALS, type SocialKey } from "@/app/components/SocialIcons";

/** One row per network: the icon says which, the field takes only the nickname. */
export function SocialFields({
  values,
  onChange,
  boxed = false,
}: {
  values: Record<SocialKey, string>;
  onChange: (key: SocialKey, value: string) => void;
  boxed?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      {SOCIALS.map(({ key, label, Icon }) => (
        <label
          key={key}
          className={`flex items-center gap-3 text-stone focus-within:text-ink transition-colors ${
            boxed ? "border border-line px-3" : "border-b border-line"
          }`}
        >
          <Icon size={20} />
          <span className="sr-only">{label}</span>
          <input
            value={values[key]}
            onChange={(e) => onChange(key, e.target.value)}
            placeholder="никнейм"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            aria-label={`${label}: никнейм`}
            className="flex-1 min-w-0 bg-transparent py-2.5 text-[14px] text-ink placeholder:text-stone outline-none"
          />
        </label>
      ))}
    </div>
  );
}
