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
      className={`transition-colors cursor-pointer disabled:opacity-60 whitespace-nowrap ${
        compact
          ? `text-[12px] uppercase tracking-wide px-3 py-1.5 ${
              following ? "bg-paper text-ink hover:bg-ink hover:text-paper" : "bg-ink text-paper hover:opacity-80"
            }`
          : // Storefront: an outlined pill, like ShopMy's "Add to Favorites".
            `text-[14px] px-7 py-2.5 rounded-full border border-ink w-full sm:w-auto ${
              following ? "bg-ink text-paper hover:opacity-85" : "text-ink hover:bg-ink hover:text-paper"
            }`
      }`}
    >
      {shopperOnly ? "Только для покупателей" : following ? (compact ? "Подписан" : "Вы подписаны") : "Подписаться"}
      {!compact && followers > 0 && <span className="opacity-60 ml-2">· {followers}</span>}
    </button>
  );
}
