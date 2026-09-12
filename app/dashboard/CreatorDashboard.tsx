"use client";

import { useEffect, useState, useCallback } from "react";
import { inputClass, buttonClass } from "@/app/components/Field";
import { DashboardHeader } from "./DashboardHeader";
import { ProfileEditor } from "./ProfileEditor";
import { EmptyState } from "@/app/components/EmptyState";
import { OnboardingProgress } from "./OnboardingProgress";
import { OpportunitiesFeed } from "./OpportunitiesFeed";

type Category = "cosmetics" | "mens" | "clothing";

type LinkRow = {
  id: string;
  title: string;
  category: Category;
  imageUrl?: string;
  price?: number;
  promoCode?: string;
  clicks: number;
  clicksTotal: number;
  wrappedUrl: string;
};

const CATEGORY_LABEL: Record<Category, string> = {
  cosmetics: "Косметика",
  mens: "Мужские товары",
  clothing: "Одежда",
};

export function CreatorDashboard({
  me,
  onProfileSaved,
}: {
  me: { displayName: string; slug?: string; bio?: string };
  onProfileSaved: () => void;
}) {
  const [links, setLinks] = useState<LinkRow[] | null>(null);
  const [title, setTitle] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [category, setCategory] = useState<Category>("cosmetics");
  const [imageUrl, setImageUrl] = useState("");
  const [price, setPrice] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupNote, setLookupNote] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState<Category>("cosmetics");
  const [editPrice, setEditPrice] = useState("");
  const [editImage, setEditImage] = useState("");
  const [editPromoCode, setEditPromoCode] = useState("");
  const [origin, setOrigin] = useState("");
  const [tab, setTab] = useState<"products" | "earnings" | "profile">("products");
  // Paused while the monetization approach (promo codes / CPA / opportunities)
  // is still being decided — set back to true to bring the tab back.
  const EARNINGS_TAB_ENABLED = false;

  useEffect(() => setOrigin(window.location.origin), []);

  const loadLinks = useCallback(async () => {
    const res = await fetch("/api/links");
    if (res.ok) setLinks((await res.json()).links);
  }, []);

  useEffect(() => {
    loadLinks();
  }, [loadLinks]);

  async function lookupProduct(url: string) {
    if (!url.trim()) return;
    try {
      new URL(url);
    } catch {
      return;
    }

    setLookingUp(true);
    setLookupNote(null);
    const res = await fetch(`/api/marketplace/lookup?url=${encodeURIComponent(url)}`);
    const data = await res.json().catch(() => null);
    setLookingUp(false);

    if (!data?.found) {
      setLookupNote("Не смогли подтянуть данные по этой ссылке — заполните вручную.");
      return;
    }

    if (data.title && !title.trim()) setTitle(data.title);
    if (data.price && !price.trim()) setPrice(String(data.price));
    if (data.imageUrl && !imageUrl.trim()) setImageUrl(data.imageUrl);
    setLookupNote("Подтянули название, фото и цену с Wildberries — можно поправить перед сохранением.");
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const res = await fetch("/api/links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        targetUrl,
        category,
        imageUrl: imageUrl.trim() || undefined,
        price: price.trim() ? Number(price) : undefined,
        promoCode: promoCode.trim() || undefined,
      }),
    });
    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error ?? "Не удалось добавить товар");
      return;
    }

    setTitle("");
    setTargetUrl("");
    setImageUrl("");
    setPrice("");
    setPromoCode("");
    setLookupNote(null);
    await loadLinks();
  }

  function startEditing(link: LinkRow) {
    setEditingId(link.id);
    setEditTitle(link.title);
    setEditCategory(link.category);
    setEditPrice(link.price ? String(link.price) : "");
    setEditImage(link.imageUrl ?? "");
    setEditPromoCode(link.promoCode ?? "");
  }

  async function saveEdit(id: string) {
    const res = await fetch(`/api/links/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editTitle,
        category: editCategory,
        price: editPrice.trim() ? Number(editPrice) : null,
        imageUrl: editImage.trim() || null,
        promoCode: editPromoCode.trim() || null,
      }),
    });
    if (res.ok) {
      setEditingId(null);
      await loadLinks();
    }
  }

  async function handleDelete(link: LinkRow) {
    const confirmed = window.confirm(
      `Удалить «${link.title}»? Ссылка перестанет работать, и товар исчезнет с витрины.`
    );
    if (!confirmed) return;

    const res = await fetch(`/api/links/${link.id}`, { method: "DELETE" });
    if (res.ok) await loadLinks();
  }

  if (links === null) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <p className="text-stone text-sm">Загрузка…</p>
      </main>
    );
  }

  const totalHuman = links.reduce((s, l) => s + l.clicks, 0);
  const totalAll = links.reduce((s, l) => s + l.clicksTotal, 0);

  return (
    <main className="flex-1 flex flex-col">
      <DashboardHeader
        label="Кабинет куратора"
        title={me.displayName}
        action={
          me.slug && (
            <div className="flex items-center gap-2">
              <OnboardingProgress
                steps={[
                  { label: "Заполните описание витрины", done: Boolean(me.bio?.trim()) },
                  { label: "Добавьте первый товар", done: links.length > 0 },
                  { label: "Получите первый живой переход", done: totalHuman > 0 },
                ]}
              />
              <a
                href={`/${me.slug}/stats`}
                className="text-[12px] uppercase tracking-wide text-stone border border-line px-3 py-2 hover:border-ink hover:text-ink transition-colors"
              >
                Медиакит
              </a>
              <a
                href={`/${me.slug}`}
                className="text-[12.5px] text-stone border border-line px-3 py-2 hover:border-ink hover:text-ink transition-colors"
              >
                {origin ? origin.replace(/^https?:\/\//, "") : ""}/{me.slug}
              </a>
            </div>
          )
        }
      />

      <div className="flex gap-6 px-8 pt-6 border-b border-line">
        {(
          [
            ["products", "Товары"],
            ...(EARNINGS_TAB_ENABLED ? ([["earnings", "Заработок"]] as const) : []),
            ["profile", "Профиль и медиакит"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`text-[12px] uppercase tracking-wide pb-3 border-b-2 -mb-px transition-colors cursor-pointer ${
              tab === key ? "border-ink text-ink" : "border-transparent text-stone hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "products" && (
        <div className="grid md:grid-cols-[300px_1fr] flex-1">
          <div className="border-b md:border-b-0 md:border-r border-line px-8 py-8">
            <div className="flex flex-col gap-4">
              <h3 className="text-[11px] uppercase tracking-wider text-stone">Добавить товар</h3>
              <form onSubmit={handleAdd} className="flex flex-col gap-3">
                <input
                  placeholder="Название товара"
                  required
                  className={`${inputClass} border border-line px-3 py-2.5`}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <input
                  placeholder="Ссылка на товар"
                  type="url"
                  required
                  className={`${inputClass} border border-line px-3 py-2.5`}
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  onBlur={(e) => lookupProduct(e.target.value)}
                />
                {lookingUp && (
                  <p className="text-stone text-[12px]">Загружаем данные с Wildberries…</p>
                )}
                {lookupNote && !lookingUp && (
                  <p className="text-stone text-[12px] leading-relaxed">{lookupNote}</p>
                )}
                <select
                  className={`${inputClass} border border-line px-3 py-2.5`}
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Category)}
                >
                  <option value="cosmetics">Косметика</option>
                  <option value="mens">Мужские товары</option>
                  <option value="clothing">Одежда</option>
                </select>
                <input
                  placeholder="Ссылка на фото (необязательно)"
                  type="url"
                  className={`${inputClass} border border-line px-3 py-2.5`}
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
                <input
                  placeholder="Цена в рублях (необязательно)"
                  type="number"
                  min="0"
                  step="1"
                  className={`${inputClass} border border-line px-3 py-2.5`}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
                <input
                  placeholder="Промокод от бренда (необязательно)"
                  className={`${inputClass} border border-line px-3 py-2.5`}
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                />
                {error && <p className="text-error text-sm">{error}</p>}
                <button type="submit" disabled={submitting} className={buttonClass}>
                  {submitting ? "Добавляем…" : "Добавить"}
                </button>
              </form>
            </div>
          </div>

          <div className="px-8 py-8">
            <div className="flex justify-between items-baseline mb-6 flex-wrap gap-2">
              <h3 className="text-[11px] uppercase tracking-wider text-stone">Мои ссылки</h3>
              <span className="text-xs text-stone">
                {links.length} ссылок · <b className="text-ink font-medium">{totalHuman}</b> живых
                переходов из {totalAll}
              </span>
            </div>

            {links.length === 0 ? (
              <EmptyState title="Ваша витрина пока пуста — добавьте первый товар в форме выше." />
            ) : (
              <ul className="flex flex-col">
                {links.map((link) => (
                  <li key={link.id} className="py-4 border-b border-line last:border-b-0">
                    {editingId === link.id ? (
                      <div className="flex flex-col gap-2 max-w-md">
                        <input
                          className={`${inputClass} border border-line px-3 py-2`}
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                        />
                        <select
                          className={`${inputClass} border border-line px-3 py-2`}
                          value={editCategory}
                          onChange={(e) => setEditCategory(e.target.value as Category)}
                        >
                          <option value="cosmetics">Косметика</option>
                          <option value="mens">Мужские товары</option>
                          <option value="clothing">Одежда</option>
                        </select>
                        <input
                          className={`${inputClass} border border-line px-3 py-2`}
                          value={editImage}
                          placeholder="Ссылка на фото"
                          onChange={(e) => setEditImage(e.target.value)}
                        />
                        <input
                          className={`${inputClass} border border-line px-3 py-2`}
                          value={editPrice}
                          type="number"
                          placeholder="Цена"
                          onChange={(e) => setEditPrice(e.target.value)}
                        />
                        <input
                          className={`${inputClass} border border-line px-3 py-2`}
                          value={editPromoCode}
                          placeholder="Промокод"
                          onChange={(e) => setEditPromoCode(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveEdit(link.id)}
                            className="text-[12px] uppercase tracking-wide text-paper bg-ink px-4 py-2 cursor-pointer"
                          >
                            Сохранить
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="text-[12px] uppercase tracking-wide border border-line px-4 py-2 cursor-pointer"
                          >
                            Отмена
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-[1fr_auto] items-start gap-4">
                        <div>
                          <div className="text-[14px] font-medium">{link.title}</div>
                          <span className="text-[10.5px] uppercase tracking-wide text-stone">
                            {CATEGORY_LABEL[link.category]}
                            {link.promoCode && (
                              <span className="ml-2 text-ink border border-line px-1.5 py-0.5 normal-case">
                                промокод {link.promoCode}
                              </span>
                            )}
                          </span>
                          <div className="flex gap-3 mt-2">
                            <button
                              onClick={() => startEditing(link)}
                              className="text-[11px] uppercase tracking-wide text-stone hover:text-ink transition-colors cursor-pointer"
                            >
                              Изменить
                            </button>
                            <button
                              onClick={() => handleDelete(link)}
                              className="text-[11px] uppercase tracking-wide text-stone hover:text-error transition-colors cursor-pointer"
                            >
                              Удалить
                            </button>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[22px] font-medium leading-none">{link.clicks}</div>
                          <div className="text-[11px] text-stone mt-1">живых</div>
                          {link.clicksTotal > link.clicks && (
                            <div className="text-[11px] text-stone">из {link.clicksTotal}</div>
                          )}
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {tab === "earnings" && (
        <div className="px-8 py-8 flex-1">
          <div className="max-w-xl mb-10 flex flex-col gap-2">
            <h3 className="text-[11px] uppercase tracking-wider text-stone">Как вы зарабатываете</h3>
            <p className="text-stone text-[13px] leading-relaxed">
              Три независимых способа, можно использовать любой или все сразу: добавьте{" "}
              <b className="text-ink font-medium">промокод</b> к товару на вкладке «Товары» — он
              появится у вас на витрине рядом с ценой; если бренд подключил{" "}
              <b className="text-ink font-medium">партнёрскую сеть</b>, переходы по его товарам
              будут учитываться автоматически, без каких-либо действий с вашей стороны; а ниже —{" "}
              <b className="text-ink font-medium">прямые предложения</b> от брендов, на которые
              можно откликнуться.
            </p>
          </div>
          <OpportunitiesFeed />
        </div>
      )}

      {tab === "profile" && (
        <div className="px-8 py-8 max-w-md">
          <ProfileEditor me={me} onSaved={onProfileSaved} defaultOpen />
        </div>
      )}
    </main>
  );
}
