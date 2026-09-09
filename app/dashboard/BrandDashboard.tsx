"use client";

import { useCallback, useEffect, useState } from "react";
import { inputClass } from "@/app/components/Field";
import { DashboardHeader } from "./DashboardHeader";

type BrandLink = {
  id: string;
  title: string;
  category: "cosmetics" | "mens" | "clothing";
  targetUrl: string;
  articleId?: string;
  clicks: number;
  clicksTotal: number;
  creatorName?: string;
  creatorSlug?: string;
};

const CATEGORY_LABEL: Record<BrandLink["category"], string> = {
  cosmetics: "Косметика",
  mens: "Мужские товары",
  clothing: "Одежда",
};

export function BrandDashboard({
  me,
  onProfileSaved,
}: {
  me: { displayName: string; brandDomain?: string; brandArticles?: string[] };
  onProfileSaved: () => void;
}) {
  const [links, setLinks] = useState<BrandLink[] | null>(null);
  const [articlesInput, setArticlesInput] = useState((me.brandArticles ?? []).join("\n"));
  const [saving, setSaving] = useState(false);
  const [unrecognized, setUnrecognized] = useState<string[]>([]);

  const load = useCallback(async () => {
    const res = await fetch("/api/brand/links");
    if (res.ok) setLinks((await res.json()).links);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function saveArticles(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const res = await fetch("/api/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ articles: articlesInput }),
    });
    const data = await res.json();
    setSaving(false);

    if (res.ok) {
      setUnrecognized(data.unrecognized ?? []);
      onProfileSaved();
      await load();
    }
  }

  const totalHuman = links?.reduce((s, l) => s + l.clicks, 0) ?? 0;
  const totalAll = links?.reduce((s, l) => s + l.clicksTotal, 0) ?? 0;
  const hasArticles = (me.brandArticles ?? []).length > 0;

  return (
    <main className="flex-1 flex flex-col">
      <DashboardHeader label="Кабинет бренда" title={me.brandDomain ?? me.displayName} />

      <div className="grid md:grid-cols-[320px_1fr] flex-1">
        <div className="border-b md:border-b-0 md:border-r border-line px-8 py-8 flex flex-col gap-4">
          <h3 className="text-[11px] uppercase tracking-wider text-stone">Мои товары</h3>
          <p className="text-stone text-[13px] leading-relaxed">
            Артикулы или ссылки на ваши карточки — по одной в строке. На маркетплейсе домен
            общий для всех продавцов, поэтому товары определяются по артикулу.
          </p>
          <form onSubmit={saveArticles} className="flex flex-col gap-3">
            <textarea
              className={`${inputClass} border border-line px-3 py-2.5 resize-y min-h-32 font-mono text-[13px]`}
              placeholder={"172247725\nhttps://www.ozon.ru/product/tovar-1284900733/"}
              value={articlesInput}
              onChange={(e) => setArticlesInput(e.target.value)}
            />
            <button
              type="submit"
              disabled={saving}
              className="text-[12px] font-semibold uppercase tracking-wide text-paper bg-ink px-4 py-2.5 hover:opacity-80 transition-opacity disabled:opacity-50 cursor-pointer"
            >
              {saving ? "Сохраняем…" : "Сохранить"}
            </button>
          </form>

          {unrecognized.length > 0 && (
            <p className="text-[12.5px] text-error leading-relaxed">
              Не удалось разобрать: {unrecognized.join(", ")}. Нужен артикул или ссылка на
              карточку WB либо Ozon.
            </p>
          )}
        </div>

        <div className="px-8 py-8">
          <div className="flex justify-between items-baseline mb-6 flex-wrap gap-2">
            <h3 className="text-[11px] uppercase tracking-wider text-stone">
              Кто ссылается на ваши товары
            </h3>
            {links && links.length > 0 && (
              <span className="text-xs text-stone">
                {links.length} ссылок · <b className="text-ink font-medium">{totalHuman}</b> живых
                переходов из {totalAll}
              </span>
            )}
          </div>

          {links === null ? (
            <p className="text-stone text-sm">Загрузка…</p>
          ) : !hasArticles ? (
            <div className="max-w-md flex flex-col gap-3">
              <p className="font-display italic text-base text-stone">
                Пока не указано ни одного товара.
              </p>
              <p className="text-stone text-sm leading-relaxed">
                Добавьте артикулы слева — и здесь появятся кураторы, которые уже ссылаются на
                ваши карточки, вместе с числом переходов по каждой.
              </p>
            </div>
          ) : links.length === 0 ? (
            <div className="max-w-md flex flex-col gap-3">
              <p className="font-display italic text-base text-stone">
                На эти товары пока никто не ссылается.
              </p>
              <p className="text-stone text-sm leading-relaxed">
                Данные появятся, как только куратор добавит один из ваших артикулов к себе на
                витрину. Проверьте, что артикулы указаны верно — сейчас отслеживается{" "}
                {(me.brandArticles ?? []).length}.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col">
              {links.map((link) => (
                <li
                  key={link.id}
                  className="grid grid-cols-[1fr_auto] items-start gap-4 py-4 border-b border-line last:border-b-0"
                >
                  <div>
                    <div className="text-[14px] font-medium">{link.title}</div>
                    <div className="text-[11px] text-stone mt-0.5">
                      {CATEGORY_LABEL[link.category]}
                      {link.articleId && ` · артикул ${link.articleId}`}
                    </div>
                    {link.creatorSlug && (
                      <a
                        href={`/${link.creatorSlug}`}
                        className="text-[12px] mt-1.5 inline-block underline underline-offset-4 hover:opacity-70"
                      >
                        {link.creatorName}
                      </a>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-[22px] font-medium leading-none">{link.clicks}</div>
                    <div className="text-[11px] text-stone mt-1">живых</div>
                    {link.clicksTotal > link.clicks && (
                      <div className="text-[11px] text-stone">из {link.clicksTotal}</div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
