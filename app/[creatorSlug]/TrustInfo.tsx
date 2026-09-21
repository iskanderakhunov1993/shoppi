"use client";

import { useState } from "react";

/** "Доверяют N покупателей ⓘ" — the ⓘ explains what the number is. */
export function TrustInfo({ text }: { text: string }) {
  const [open, setOpen] = useState(false);

  return (
    <span className="inline-flex flex-col items-center">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Что значит это число"
        className="ml-1.5 inline-flex items-center justify-center w-[15px] h-[15px] rounded-full border border-stone text-stone text-[10px] not-italic leading-none hover:text-ink hover:border-ink transition-colors cursor-pointer"
      >
        i
      </button>
      {open && (
        <span className="block max-w-xs text-[12px] not-italic font-body text-stone leading-relaxed mt-2">{text}</span>
      )}
    </span>
  );
}
