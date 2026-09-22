"use client";

import { useEffect, useState } from "react";
import { placeholderAvatar } from "@/lib/avatar";

type Follower = { userId: string; displayName?: string; avatarUrl?: string; addedAt: string };

/**
 * The creator's-eye view of "Круги": shoppers who've put this creator in
 * one of their own circles, not just followed — a step up from the plain
 * follower count on the storefront header.
 */
export function CircleFollowers() {
  const [followers, setFollowers] = useState<Follower[] | null>(null);

  useEffect(() => {
    fetch("/api/me/circle-followers")
      .then((res) => (res.ok ? res.json() : { followers: [] }))
      .then((data) => setFollowers(data.followers ?? []));
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-[11px] uppercase tracking-wider text-stone mb-1">Круги</h3>
        <p className="text-stone text-[13px] leading-relaxed">
          Покупатели, которые добавили вас в свой личный круг — более тесная связь, чем просто
          подписка. Они видят ваши товары в своей общей ленте среди других избранных кураторов.
        </p>
      </div>

      {followers === null ? (
        <p className="text-stone text-sm">Загрузка…</p>
      ) : followers.length === 0 ? (
        <p className="font-display italic text-stone text-sm">
          Пока никто не добавил вас в свой круг.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {followers.map((f) => (
            <li key={f.userId} className="flex items-center gap-3 px-4 py-3 border border-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={f.avatarUrl || placeholderAvatar(f.userId)}
                alt=""
                className="w-9 h-9 rounded-full object-cover bg-raise flex-none"
              />
              <span className="text-[13px] font-medium flex-1">{f.displayName || "Покупатель"}</span>
              <span className="text-stone text-[11.5px]">
                {new Date(f.addedAt).toLocaleDateString("ru-RU")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
