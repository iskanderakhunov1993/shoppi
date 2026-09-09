"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { DashboardHeader } from "./DashboardHeader";
import { placeholderAvatar } from "@/lib/avatar";

type FavoriteLink = {
  id: string;
  title: string;
  category: "cosmetics" | "mens" | "clothing";
  price?: number;
  wrappedUrl: string;
};

type FollowedCreator = {
  id: string;
  slug: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
};

type FeedLink = FavoriteLink & { wrappedUrl: string; clicks: number; creatorName?: string; creatorSlug?: string };

const CATEGORY_LABEL: Record<FavoriteLink["category"], string> = {
  cosmetics: "Косметика",
  mens: "Мужские товары",
  clothing: "Одежда",
};

export function ShopperDashboard({ me }: { me: { displayName: string } }) {
  const [tab, setTab] = useState<"saved" | "circle">("saved");
  const [favorites, setFavorites] = useState<FavoriteLink[] | null>(null);
  const [circle, setCircle] = useState<{ creators: FollowedCreator[]; feed: FeedLink[] } | null>(null);

  const loadFavorites = useCallback(async () => {
    const res = await fetch("/api/favorites");
    setFavorites(res.ok ? (await res.json()).favorites : []);
  }, []);

  const loadCircle = useCallback(async () => {
    const res = await fetch("/api/follows");
    setCircle(res.ok ? await res.json() : { creators: [], feed: [] });
  }, []);

  useEffect(() => {
    loadFavorites();
    loadCircle();
  }, [loadFavorites, loadCircle]);

  async function remove(linkId: string) {
    await fetch(`/api/favorites?linkId=${encodeURIComponent(linkId)}`, { method: "DELETE" });
    await loadFavorites();
  }

  async function unfollow(creatorId: string) {
    await fetch(`/api/follows?creatorId=${encodeURIComponent(creatorId)}`, { method: "DELETE" });
    await loadCircle();
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

      <div className="flex gap-6 px-8 pt-6 border-b border-line">
        <button
          onClick={() => setTab("saved")}
          className={`text-[12px] uppercase tracking-wide pb-3 border-b-2 -mb-px transition-colors cursor-pointer ${
            tab === "saved" ? "border-ink text-ink" : "border-transparent text-stone hover:text-ink"
          }`}
        >
          Сохранённое{favorites ? ` · ${favorites.length}` : ""}
        </button>
        <button
          onClick={() => setTab("circle")}
          className={`text-[12px] uppercase tracking-wide pb-3 border-b-2 -mb-px transition-colors cursor-pointer ${
            tab === "circle" ? "border-ink text-ink" : "border-transparent text-stone hover:text-ink"
          }`}
        >
          Мои кураторы{circle ? ` · ${circle.creators.length}` : ""}
        </button>
      </div>

      {tab === "saved" && (
        <div className="px-8 py-8">
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
      )}

      {tab === "circle" && (
        <div className="px-8 py-8">
          {circle === null ? (
            <p className="text-stone text-sm">Загрузка…</p>
          ) : circle.creators.length === 0 ? (
            <div className="max-w-md flex flex-col gap-4 items-start">
              <div className="w-12 h-12 grid grid-cols-2 gap-1 p-2 border border-line">
                <span className="bg-line" />
                <span className="bg-line" />
                <span className="bg-line" />
                <span className="bg-line" />
              </div>
              <div>
                <p className="font-display text-xl mb-2">Пока нет кураторов</p>
                <p className="text-stone text-sm leading-relaxed">
                  Добавьте кураторов, чьему вкусу доверяете — их находки соберутся в одну ленту,
                  вместо того чтобы проверять каждую витрину по отдельности.
                </p>
              </div>
              <Link
                href="/curators"
                className="w-fit text-[12px] font-semibold uppercase tracking-wide text-paper bg-ink px-5 py-3 hover:opacity-80 transition-opacity"
              >
                Найти кураторов
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-10">
              <div>
                <h3 className="text-[11px] uppercase tracking-wider text-stone mb-4">
                  В ваших кураторах
                </h3>
                <div className="flex flex-wrap gap-3">
                  {circle.creators.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center gap-2.5 border border-line pl-2 pr-3 py-2"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={c.avatarUrl || placeholderAvatar(c.slug)}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover bg-raise"
                      />
                      <a href={`/${c.slug}`} className="text-[13px] font-medium hover:underline">
                        {c.displayName}
                      </a>
                      <button
                        onClick={() => unfollow(c.id)}
                        aria-label={`Убрать ${c.displayName} из кураторов`}
                        className="text-stone hover:text-error transition-colors cursor-pointer text-[15px] leading-none"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-[11px] uppercase tracking-wider text-stone mb-4">
                  Их находки
                </h3>
                {circle.feed.length === 0 ? (
                  <p className="font-display italic text-stone">
                    Ваши кураторы пока ничего не добавили.
                  </p>
                ) : (
                  <ul className="flex flex-col">
                    {circle.feed.map((link) => (
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
                            {link.creatorSlug && (
                              <>
                                {" "}
                                · от{" "}
                                <a href={`/${link.creatorSlug}`} className="hover:underline">
                                  {link.creatorName}
                                </a>
                              </>
                            )}
                          </span>
                        </div>
                        {link.price && (
                          <span className="text-sm text-stone">
                            {link.price.toLocaleString("ru-RU")} ₽
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
