"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loginUrlFor, takePendingAction } from "@/lib/pendingAction";

export function FollowButton({
  creatorId,
  initialFollowers = 0,
  compact = false,
}: {
  creatorId: string;
  initialFollowers?: number;
  compact?: boolean;
}) {
  const router = useRouter();
  const [following, setFollowing] = useState(false);
  const [followers, setFollowers] = useState(initialFollowers);
  const [pending, setPending] = useState(false);
  const [known, setKnown] = useState(false);
  const [shopperOnly, setShopperOnly] = useState(false);

  // Mirrors FavoriteButton's pattern: check the real state once mounted,
  // so the button never claims "Добавить" on someone already followed.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/follows")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        const isFollowing = data.creators.some((c: { id: string }) => c.id === creatorId);
        setFollowing(isFollowing);
        // Back from login after clicking "Подписаться" while signed out.
        // Consume it either way, so it can't fire later.
        if (takePendingAction("follow", creatorId) && !isFollowing) {
          fetch("/api/follows", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ creatorId }),
          })
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => {
              if (cancelled || !d) return;
              setFollowing(true);
              setFollowers(d.followers);
            })
            .catch(() => {});
        }
      })
      .finally(() => !cancelled && setKnown(true));
    return () => {
      cancelled = true;
    };
  }, [creatorId]);

  async function handleClick() {
    if (pending) return;
    setPending(true);

    const res = following
      ? await fetch(`/api/follows?creatorId=${encodeURIComponent(creatorId)}`, { method: "DELETE" })
      : await fetch("/api/follows", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ creatorId }),
        });

    setPending(false);

    if (res.status === 401) {
      router.push(loginUrlFor("follow", creatorId));
      return;
    }
    if (res.status === 403) {
      setShopperOnly(true);
      setTimeout(() => setShopperOnly(false), 2500);
      return;
    }
    if (res.ok) {
      const data = await res.json();
      setFollowing((v) => !v);
      setFollowers(data.followers);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending || !known}
      aria-pressed={following}
      className={`text-[12px] uppercase tracking-wide transition-colors cursor-pointer disabled:opacity-60 whitespace-nowrap ${
        compact ? "px-3 py-1.5" : "px-5 py-2.5 w-full sm:w-auto"
      } ${
        following
          ? compact
            ? "bg-paper text-ink hover:bg-ink hover:text-paper"
            : "border border-ink text-ink hover:bg-ink hover:text-paper"
          : "bg-ink text-paper hover:opacity-80"
      }`}
    >
      {shopperOnly ? "Только для покупателей" : following ? (compact ? "Подписан" : "В ваших креаторах") : compact ? "Подписаться" : "Добавить в моих креаторов"}
      {!compact && followers > 0 && <span className="opacity-70 ml-2 normal-case">· {followers}</span>}
    </button>
  );
}
