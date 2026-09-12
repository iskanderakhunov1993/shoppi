"use client";

import { useMemo, useState } from "react";
import { FavoriteButton } from "@/app/components/FavoriteButton";
import { EmptyState } from "@/app/components/EmptyState";

type StorefrontLink = {
  id: string;
  title: string;
  imageUrl?: string;
  price?: number;
  category: string;
  promoCode?: string;
  wrappedUrl: string;
  clicks: number;
};

const CATEGORY_LABEL: Record<string, string> = {
  cosmetics: "Косметика",
  mens: "Мужские товары",
  clothing: "Одежда",
};

type Tab = "latest" | "popular" | string;

export function StorefrontGrid({ links }: { links: StorefrontLink[] }) {
  const [tab, setTab] = useState<Tab>("latest");

  const categories = useMemo(
    () => [...new Set(links.map((l) => l.category))],
    [links]
  );

  const visible = useMemo(() => {
    if (tab === "latest") return links;
    if (tab === "popular") return [...links].sort((a, b) => b.clicks - a.clicks);
    return links.filter((l) => l.category === tab);
  }, [links, tab]);

  if (links.length === 0) {
    return (
      <div className="py-16 flex justify-center">
        <EmptyState title="Куратор пока не добавил товары." />
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-6 px-8 pt-6 overflow-x-auto border-b border-line">
        <button
          onClick={() => setTab("latest")}
          className={`text-[12px] uppercase tracking-wide pb-3 border-b-2 -mb-px whitespace-nowrap transition-colors cursor-pointer ${
            tab === "latest" ? "border-ink text-ink" : "border-transparent text-stone hover:text-ink"
          }`}
        >
          Последние
        </button>
        <button
          onClick={() => setTab("popular")}
          className={`text-[12px] uppercase tracking-wide pb-3 border-b-2 -mb-px whitespace-nowrap transition-colors cursor-pointer ${
            tab === "popular" ? "border-ink text-ink" : "border-transparent text-stone hover:text-ink"
          }`}
        >
          Популярное
        </button>
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setTab(c)}
            className={`text-[12px] uppercase tracking-wide pb-3 border-b-2 -mb-px whitespace-nowrap transition-colors cursor-pointer ${
              tab === c ? "border-ink text-ink" : "border-transparent text-stone hover:text-ink"
            }`}
          >
            {CATEGORY_LABEL[c] ?? c}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="py-16 flex justify-center">
          <EmptyState title="В этой категории пока пусто." />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3">
          {visible.map((link, i) => (
            <div
              key={link.id}
              className={`flex flex-col gap-2 p-5 border-b border-line ${
                (i + 1) % 3 !== 0 ? "md:border-r" : ""
              } ${(i + 1) % 2 !== 0 ? "sm:border-r md:border-r-0" : ""}`}
            >
              <a href={link.wrappedUrl} className="flex flex-col gap-2 hover:opacity-85 transition-opacity">
                {link.imageUrl && (
                  <div className="aspect-[4/3] bg-line overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={link.imageUrl}
                      alt={link.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <span className="text-[10px] uppercase tracking-wide text-stone">
                  {CATEGORY_LABEL[link.category] ?? link.category}
                </span>
                <div className="text-sm font-medium leading-snug">{link.title}</div>
                {link.price && (
                  <div className="text-[13.5px] text-stone">
                    {link.price.toLocaleString("ru-RU")} ₽
                  </div>
                )}
                {link.promoCode && (
                  <div className="text-[11.5px] text-ink border border-line w-fit px-2 py-0.5">
                    Промокод: {link.promoCode}
                  </div>
                )}
              </a>
              <FavoriteButton linkId={link.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
