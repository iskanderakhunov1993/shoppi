"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill={filled ? "currentColor" : "none"} aria-hidden="true">
      <path
        d="M8 13.5s-5.5-3.4-5.5-7.1A2.9 2.9 0 0 1 8 4.6a2.9 2.9 0 0 1 5.5 1.8c0 3.7-5.5 7.1-5.5 7.1z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function FavoriteButton({
  linkId,
  variant = "default",
}: {
  linkId: string;
  variant?: "default" | "overlay";
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  // Without this the button says "Сохранить" on something the shopper
  // already saved, which reads as if the earlier click did nothing.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/favorites")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        setSaved(data.favorites.some((f: { id: string }) => f.id === linkId));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [linkId]);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (pending) return;
    setPending(true);

    const res = saved
      ? await fetch(`/api/favorites?linkId=${encodeURIComponent(linkId)}`, { method: "DELETE" })
      : await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ linkId }),
        });

    setPending(false);

    if (res.status === 401 || res.status === 403) {
      router.push("/login");
      return;
    }
    if (res.ok) setSaved((v) => !v);
  }

  if (variant === "overlay") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        aria-pressed={saved}
        aria-label={saved ? "Убрать из сохранённого" : "Сохранить"}
        className={`w-8 h-8 flex items-center justify-center rounded-full bg-paper/90 backdrop-blur-sm transition-colors disabled:opacity-60 cursor-pointer ${
          saved ? "text-error" : "text-stone hover:text-ink"
        }`}
      >
        <HeartIcon filled={saved} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-pressed={saved}
      className={`self-start text-[11px] uppercase tracking-wide border px-3 py-2.5 transition-colors disabled:opacity-60 cursor-pointer ${
        saved ? "border-ink text-ink" : "border-line text-stone hover:border-ink hover:text-ink"
      }`}
    >
      {saved ? "Сохранено" : "Сохранить"}
    </button>
  );
}
