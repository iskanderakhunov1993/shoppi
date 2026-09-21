"use client";

import { useState } from "react";

/** Copies `path` (resolved against the current origin) to the clipboard. */
export function CopyLinkButton({ path, label = "Поделиться", className = "" }: { path: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(new URL(path, window.location.origin).toString());
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }}
      className={
        className ||
        "inline-flex items-center gap-1.5 text-[13px] px-3.5 py-1.5 rounded-full bg-raise text-ink hover:opacity-80 transition-opacity cursor-pointer whitespace-nowrap"
      }
    >
      {copied ? "Ссылка скопирована" : label}
    </button>
  );
}
