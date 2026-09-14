"use client";

import { useState } from "react";

/**
 * Only rendered for the creator viewing their own live storefront —
 * a quick way to copy the link without switching to the dashboard.
 * Mirrors the copy-link pattern already used for the shopper wishlist
 * link and the creator dashboard's own storefront-link box.
 */
export function ShareButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }}
      className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-stone border border-line rounded-full px-3 py-1.5 hover:border-ink hover:text-ink transition-colors cursor-pointer"
    >
      {copied ? (
        <>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M3 8.5l3.2 3.2L13 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Скопировано
        </>
      ) : (
        <>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <rect x="5.5" y="5.5" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.3" />
            <path d="M3 10.5V3.5a1 1 0 0 1 1-1H10.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          Поделиться
        </>
      )}
    </button>
  );
}
