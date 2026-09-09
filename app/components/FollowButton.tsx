"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function FollowButton({
  creatorId,
  initialFollowers = 0,
}: {
  creatorId: string;
  initialFollowers?: number;
}) {
  const router = useRouter();
  const [following, setFollowing] = useState(false);
  const [followers, setFollowers] = useState(initialFollowers);
  const [pending, setPending] = useState(false);
  const [known, setKnown] = useState(false);

  // Mirrors FavoriteButton's pattern: check the real state once mounted,
  // so the button never claims "Добавить" on someone already followed.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/follows")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        setFollowing(data.creators.some((c: { id: string }) => c.id === creatorId));
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

    if (res.status === 401 || res.status === 403) {
      router.push("/login");
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
      className={`text-[12px] uppercase tracking-wide px-5 py-2.5 transition-colors cursor-pointer disabled:opacity-60 ${
        following
          ? "border border-ink text-ink hover:bg-ink hover:text-paper"
          : "bg-ink text-paper hover:opacity-80"
      }`}
    >
      {following ? "В ваших кураторах" : "Добавить в моих"}
      {followers > 0 && <span className="opacity-70 ml-2 normal-case">· {followers}</span>}
    </button>
  );
}
