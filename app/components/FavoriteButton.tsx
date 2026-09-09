"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function FavoriteButton({ linkId }: { linkId: string }) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (saved || pending) return;
    setPending(true);

    const res = await fetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ linkId }),
    });
    setPending(false);

    if (res.status === 401 || res.status === 403) {
      router.push("/login");
      return;
    }
    if (res.ok) setSaved(true);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending || saved}
      className="self-start text-[11px] uppercase tracking-wide text-stone border border-line px-2.5 py-1.5 hover:border-ink hover:text-ink transition-colors disabled:opacity-60"
    >
      {saved ? "Сохранено" : "Сохранить"}
    </button>
  );
}
