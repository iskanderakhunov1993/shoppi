"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { DashboardHeader } from "./DashboardHeader";

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

  const load = useCallback(async () => {
    const res = await fetch("/api/favorites");
    setFavorites(res.ok ? (await res.json()).favorites : []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(linkId: string) {
    await fetch(`/api/favorites?linkId=${encodeURIComponent(linkId)}`, { method: "DELETE" });
    await load();
  }

  return (
    <main className="flex-1 flex flex-col">
      <DashboardHeader
        label="Мой вкус"
        title={me.displayName}
        action={
          <Link
            href="/curators"
            className="text-[12px] uppercase tracking-wide text-stone border border-line px-3 py-2 hover:border-ink hover:text-ink transition-colors"
          >
            Все кураторы
          </Link>
        }
      />

      <div className="px-8 py-8">
        <div className="flex justify-between items-baseline mb-6">
          <h3 className="text-[11px] uppercase tracking-wider text-stone">Сохранённые товары</h3>
          {favorites && <span className="text-xs text-stone">{favorites.length}</span>}
        </div>

        {favorites === null ? (
          <p className="text-stone text-sm">Загрузка…</p>
        ) : favorites.length === 0 ? (
          <div className="max-w-md flex flex-col gap-3">
            <p className="font-display italic text-base text-stone">Пока пусто.</p>
            <p className="text-stone text-sm leading-relaxed">
              Откройте витрину куратора и нажмите «Сохранить» на товаре — он появится здесь, и
              к нему можно будет вернуться позже.
            </p>
            <Link
              href="/curators"
              className="w-fit text-[12px] font-semibold uppercase tracking-wide text-paper bg-ink px-5 py-3 hover:opacity-80 transition-opacity"
            >
              Смотреть кураторов
            </Link>
          </div>
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
                <div className="flex items-center gap-4">
                  {link.price && (
                    <span className="text-sm text-stone">
                      {link.price.toLocaleString("ru-RU")} ₽
                    </span>
                  )}
                  <button
                    onClick={() => remove(link.id)}
                    className="text-[11px] uppercase tracking-wide text-stone hover:text-error transition-colors cursor-pointer"
                  >
                    Убрать
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
