"use client";

import { useEffect, useState } from "react";

type FavoriteLink = {
  id: string;
  title: string;
  category: "cosmetics" | "mens" | "clothing";
  price?: number;
  wrappedUrl: string;
};

const CATEGORY_LABEL: Record<FavoriteLink["category"], string> = {
  cosmetics: "Косметика",
  mens: "Мужские товары",
  clothing: "Одежда",
};

export function ShopperDashboard({ me }: { me: { displayName: string } }) {
  const [favorites, setFavorites] = useState<FavoriteLink[] | null>(null);

  useEffect(() => {
    fetch("/api/favorites")
      .then((res) => (res.ok ? res.json() : { favorites: [] }))
      .then((data) => setFavorites(data.favorites));
  }, []);

  return (
    <main className="flex-1 flex flex-col">
      <div className="px-8 py-6 border-b border-line">
        <div className="text-[11px] uppercase tracking-wider text-stone">Мой вкус</div>
        <div className="font-display text-xl">{me.displayName}</div>
      </div>

      <div className="px-8 py-8">
        <div className="flex justify-between items-baseline mb-4">
          <h3 className="text-[11px] uppercase tracking-wider text-stone">
            Сохранённые товары
          </h3>
          {favorites && <span className="text-xs text-stone">{favorites.length}</span>}
        </div>

        {favorites === null ? (
          <p className="text-stone text-sm">Загрузка…</p>
        ) : favorites.length === 0 ? (
          <p className="font-display italic text-base text-stone">
            Пока пусто — сохраняйте товары на витринах куратора кнопкой «Сохранить».
          </p>
        ) : (
          <ul className="flex flex-col">
            {favorites.map((link) => (
              <li
                key={link.id}
                className="grid grid-cols-[1fr_auto] items-center gap-4 py-3.5 border-b border-line last:border-b-0"
              >
                <div>
                  <a href={link.wrappedUrl} className="text-[13.5px] font-medium hover:underline">
                    {link.title}
                  </a>
                  <span className="block text-[10.5px] uppercase tracking-wide text-stone mt-0.5">
                    {CATEGORY_LABEL[link.category]}
                  </span>
                </div>
                {link.price && (
                  <div className="text-sm text-stone">{link.price.toLocaleString("ru-RU")} ₽</div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
