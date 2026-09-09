"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function FavoriteButton({ linkId }: { linkId: string }) {
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
