"use client";

import { useState } from "react";

/**
 * Only rendered for the creator viewing their own live storefront —
 * a quick icon-only way to copy the link without switching to the
 * dashboard. Mirrors the copy-link pattern already used for the
 * shopper wishlist link and the creator dashboard's storefront box.
 */
export function ShareButtonIcon({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }}
      aria-label="Скопировать ссылку на витрину"
      title="Поделиться"
      className="w-8 h-8 flex items-center justify-center border border-line rounded-full text-stone hover:text-ink hover:border-ink transition-colors cursor-pointer"
    >
      {copied ? (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M3 8.5l3.2 3.2L13 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="M8 10V2.5M8 2.5L5.2 5.3M8 2.5l2.8 2.8"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M3.5 8.5v3.3c0 .66.54 1.2 1.2 1.2h6.6c.66 0 1.2-.54 1.2-1.2V8.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}
