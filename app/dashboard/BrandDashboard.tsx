"use client";

import { useEffect, useState } from "react";

type BrandLink = {
  id: string;
  title: string;
  category: "cosmetics" | "mens" | "clothing";
  targetUrl: string;
  clicks: number;
};

const CATEGORY_LABEL: Record<BrandLink["category"], string> = {
  cosmetics: "Косметика",
  mens: "Мужские товары",
  clothing: "Одежда",
};

export function BrandDashboard({
  me,
}: {
  me: { displayName: string; brandDomain?: string };
}) {
  const [links, setLinks] = useState<BrandLink[] | null>(null);

  useEffect(() => {
    fetch("/api/brand/links")
      .then((res) => (res.ok ? res.json() : { links: [] }))
      .then((data) => setLinks(data.links));
  }, []);

  const totalClicks = links?.reduce((sum, l) => sum + l.clicks, 0) ?? 0;

  return (
    <main className="flex-1 flex flex-col">
      <div className="px-8 py-6 border-b border-line">
        <div className="text-[11px] uppercase tracking-wider text-stone">Кабинет бренда</div>
        <div className="font-display text-xl">{me.brandDomain}</div>
      </div>

      <div className="px-8 py-8">
        <div className="flex justify-between items-baseline mb-4">
          <h3 className="text-[11px] uppercase tracking-wider text-stone">
            Ссылки кураторов на ваш домен
          </h3>
          {links && (
            <span className="text-xs text-stone">
              {links.length} ссылок · {totalClicks} кликов всего
            </span>
          )}
        </div>

        {links === null ? (
          <p className="text-stone text-sm">Загрузка…</p>
        ) : links.length === 0 ? (
          <p className="font-display italic text-base text-stone">
            Пока ни один куратор не добавил ссылку на {me.brandDomain}.
          </p>
        ) : (
          <ul className="flex flex-col">
            {links.map((link) => (
              <li
                key={link.id}
                className="grid grid-cols-[1fr_auto] items-center gap-4 py-3.5 border-b border-line last:border-b-0"
              >
                <div>
                  <div className="text-[13.5px] font-medium">{link.title}</div>
                  <span className="text-[10.5px] uppercase tracking-wide text-stone">
                    {CATEGORY_LABEL[link.category]}
                  </span>
                </div>
                <div className="text-sm text-stone text-right">
                  <b className="text-ink text-[15px] font-medium">{link.clicks}</b>
                  <br />
                  кликов
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
