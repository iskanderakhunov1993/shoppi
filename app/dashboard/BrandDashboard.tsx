"use client";

import { useCallback, useEffect, useState } from "react";
import { inputClass } from "@/app/components/Field";
import { DashboardHeader } from "./DashboardHeader";
import { EmptyState } from "@/app/components/EmptyState";
import { BrandOpportunities } from "./BrandOpportunities";
import { OnboardingProgress } from "./OnboardingProgress";

type BrandLink = {
  id: string;
  title: string;
  category: "cosmetics" | "mens" | "clothing";
  targetUrl: string;
  articleId?: string;
  createdAt: string;
  clicks: number;
  clicksTotal: number;
  creatorName?: string;
  creatorSlug?: string;
};

const LAST_SEEN_KEY = "shoppi:brand:linksLastSeen";

const CATEGORY_LABEL: Record<BrandLink["category"], string> = {
  cosmetics: "Косметика",
  mens: "Мужские товары",
  clothing: "Одежда",
};

export function BrandDashboard({
  me,
  onProfileSaved,
}: {
  me: {
    displayName: string;
    brandDomain?: string;
    brandArticles?: string[];
    affiliateTemplate?: string;
  };
  onProfileSaved: () => void;
}) {
  const [links, setLinks] = useState<BrandLink[] | null>(null);
  const [articlesInput, setArticlesInput] = useState((me.brandArticles ?? []).join("\n"));
  const [affiliateTemplate, setAffiliateTemplate] = useState(me.affiliateTemplate ?? "");
  const [saving, setSaving] = useState(false);
  const [unrecognized, setUnrecognized] = useState<string[]>([]);
  const [affiliateError, setAffiliateError] = useState<string | null>(null);
  const [newSinceLastVisit, setNewSinceLastVisit] = useState(0);
  const [hasOpportunity, setHasOpportunity] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/brand/links");
    if (!res.ok) return;
    const data = (await res.json()).links as BrandLink[];
    setLinks(data);

    // Per-viewer convenience only, so it lives in localStorage rather than
    // the database: "new since I last looked" has no meaning shared across
    // devices or people.
    try {
      const lastSeen = localStorage.getItem(LAST_SEEN_KEY);
      if (lastSeen) {
        setNewSinceLastVisit(data.filter((l) => l.createdAt > lastSeen).length);
      }
      localStorage.setItem(LAST_SEEN_KEY, new Date().toISOString());
    } catch {
      // localStorage unavailable (private mode, blocked) — skip the banner
    }
  }, []);

  useEffect(() => {
    load();
    fetch("/api/opportunities/mine")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setHasOpportunity(Boolean(data?.opportunities?.length)));
  }, [load]);

  async function saveArticles(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setAffiliateError(null);

    const res = await fetch("/api/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ articles: articlesInput, affiliateTemplate }),
    });
    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setAffiliateError(data.error ?? "Не удалось сохранить");
      return;
    }

    setUnrecognized(data.unrecognized ?? []);
    onProfileSaved();
    await load();
  }

  const totalHuman = links?.reduce((s, l) => s + l.clicks, 0) ?? 0;
  const totalAll = links?.reduce((s, l) => s + l.clicksTotal, 0) ?? 0;
  const hasArticles = (me.brandArticles ?? []).length > 0;

  return (
    <main className="flex-1 flex flex-col">
      <DashboardHeader
        label="Кабинет бренда"
        title={me.brandDomain ?? me.displayName}
        action={
          <OnboardingProgress
            steps={[
              { label: "Укажите свои товары", done: hasArticles },
              { label: "Получите первую ссылку от куратора", done: Boolean(links && links.length > 0) },
              { label: "Опубликуйте предложение куратору", done: hasOpportunity },
            ]}
          />
        }
      />

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
            <div className="flex flex-col gap-2 pt-2 border-t border-line">
              <label className="text-[11px] uppercase tracking-wider text-stone">
                Партнёрская ссылка (CPA-сеть, необязательно)
              </label>
              <input
                className={`${inputClass} border border-line px-3 py-2.5 font-mono text-[12.5px]`}
                placeholder="https://ad.admitad.com/g/xxx/?ulp={url}"
                value={affiliateTemplate}
                onChange={(e) => setAffiliateTemplate(e.target.value)}
              />
              <p className="text-stone text-[12px] leading-relaxed">
                Если у вас есть партнёрская ссылка из CPA-сети (Admitad, ePN и т.п.), вставьте её
                шаблон с плейсхолдером <code>{"{url}"}</code> вместо адреса товара — переходы по
                вашим товарам пойдут через неё вместо прямой ссылки на маркетплейс.
              </p>
            </div>
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
          {affiliateError && <p className="text-[12.5px] text-error leading-relaxed">{affiliateError}</p>}
        </div>

        <div className="px-8 py-8">
          {newSinceLastVisit > 0 && (
            <p className="text-[12.5px] text-ink bg-raise border border-line px-4 py-3 mb-6">
              {newSinceLastVisit === 1
                ? "Появилась 1 новая ссылка"
                : `Появилось новых ссылок: ${newSinceLastVisit}`}{" "}
              на ваши товары с прошлого визита.
            </p>
          )}
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
            <EmptyState
              title="Пока не указано ни одного товара."
              description="Добавьте артикулы слева — и здесь появятся кураторы, которые уже ссылаются на ваши карточки, вместе с числом переходов по каждой."
            />
          ) : links.length === 0 ? (
            <EmptyState
              title="На эти товары пока никто не ссылается."
              description={`Данные появятся, как только куратор добавит один из ваших артикулов к себе на витрину. Проверьте, что артикулы указаны верно — сейчас отслеживается ${(me.brandArticles ?? []).length}.`}
            />
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

      <div className="px-8 py-8 border-t border-line">
        <BrandOpportunities />
      </div>
    </main>
  );
}
