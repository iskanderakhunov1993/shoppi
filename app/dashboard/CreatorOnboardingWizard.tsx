"use client";

import { useState } from "react";
import { inputClass, buttonClass } from "@/app/components/Field";
import { placeholderAvatar } from "@/lib/avatar";
import { CATEGORIES, CATEGORY_LABEL, type Category } from "@/lib/categories";

/**
 * Shown once, right after registration, instead of the full tabbed
 * dashboard: welcome → fill in the profile → add the first product.
 * Modeled on the reference onboarding flow, minus the parts that don't
 * apply here — no discoverability tags or trust tiers (nothing to back
 * them with yet), no product-catalog search (WB/Ozon block server-side
 * scraping, see the PRD) — just the steps that are actually real for us.
 * Instagram/TikTok handles are optional here since a creator may not
 * have them at hand yet — they can always add them later from Профиль
 * и медиакит.
 */
export function CreatorOnboardingWizard({
  me,
  onDone,
}: {
  me: {
    displayName: string;
    bio?: string;
    avatarUrl?: string;
    slug?: string;
    instagramHandle?: string;
    tiktokHandle?: string;
  };
  onDone: () => void;
}) {
  const [step, setStep] = useState<0 | 1 | 2>(0);

  const [displayName, setDisplayName] = useState(me.displayName);
  const [bio, setBio] = useState(me.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(me.avatarUrl ?? "");
  const [instagramHandle, setInstagramHandle] = useState(me.instagramHandle ?? "");
  const [tiktokHandle, setTiktokHandle] = useState(me.tiktokHandle ?? "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [category, setCategory] = useState<Category>("cosmetics");
  const [savingProduct, setSavingProduct] = useState(false);
  const [productError, setProductError] = useState<string | null>(null);
  const [addedCount, setAddedCount] = useState(0);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileError(null);
    setSavingProfile(true);

    const res = await fetch("/api/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName, bio, avatarUrl, instagramHandle, tiktokHandle }),
    });
    setSavingProfile(false);

    if (!res.ok) {
      setProfileError((await res.json()).error ?? "Не удалось сохранить");
      return;
    }
    setStep(2);
  }

  async function addProduct(e: React.FormEvent) {
    e.preventDefault();
    setProductError(null);
    setSavingProduct(true);

    const res = await fetch("/api/links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, targetUrl, category }),
    });
    setSavingProduct(false);

    if (!res.ok) {
      setProductError((await res.json()).error ?? "Не удалось добавить товар");
      return;
    }

    // A single product leaves an almost-empty storefront, so the flow
    // pauses here instead of exiting straight to the dashboard — the
    // creator explicitly chooses to add another or wrap up.
    setAddedCount((n) => n + 1);
    setTitle("");
    setTargetUrl("");
    setProductError(null);
  }

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm flex flex-col gap-8">
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`h-1 flex-1 ${i <= step ? "bg-ink" : "bg-line"}`}
            />
          ))}
        </div>

        {step === 0 && (
          <div className="flex flex-col gap-5 items-start">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={avatarUrl || placeholderAvatar(me.slug ?? me.displayName)}
              alt=""
              className="w-16 h-16 rounded-full object-cover bg-raise border border-line"
            />
            <div>
              <h1 className="font-display text-2xl mb-2">Привет, {me.displayName}!</h1>
              <p className="text-stone text-sm leading-relaxed">
                Добро пожаловать в Shoppi. Здесь вы ведёте витрину с товарами, которые
                действительно советуете, и видите честную статистику переходов — без
                чужого алгоритма между вами и вашей аудиторией. Пара шагов — и витрина
                готова.
              </p>
            </div>
            <button onClick={() => setStep(1)} className={`${buttonClass} w-fit`}>
              Начать
            </button>
          </div>
        )}

        {step === 1 && (
          <form onSubmit={saveProfile} className="flex flex-col gap-4">
            <div>
              <h1 className="font-display text-2xl mb-1">Расскажите о себе</h1>
              <p className="text-stone text-sm">Это увидят на вашей витрине.</p>
            </div>

            <label className="text-[11px] uppercase tracking-wider text-stone">Имя на витрине</label>
            <input
              className={`${inputClass} border border-line px-3 py-2.5`}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />

            <label className="text-[11px] uppercase tracking-wider text-stone">О себе</label>
            <textarea
              className={`${inputClass} border border-line px-3 py-2.5 resize-y min-h-20`}
              value={bio}
              placeholder="Одна строка о том, что вы советуете"
              onChange={(e) => setBio(e.target.value)}
            />

            <label className="text-[11px] uppercase tracking-wider text-stone">
              Фото профиля (необязательно)
            </label>
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={avatarUrl || placeholderAvatar(me.slug ?? me.displayName)}
                alt=""
                className="w-12 h-12 rounded-full object-cover bg-raise flex-none border border-line"
              />
              <input
                className={`${inputClass} border border-line px-3 py-2.5 flex-1 min-w-0`}
                value={avatarUrl}
                placeholder="Ссылка на фото"
                onChange={(e) => setAvatarUrl(e.target.value)}
              />
            </div>

            <label className="text-[11px] uppercase tracking-wider text-stone pt-2 border-t border-line">
              Соцсети (необязательно)
            </label>
            <p className="text-stone text-[12px] leading-relaxed -mt-2">
              Появятся значками на витрине рядом с именем.
            </p>
            <input
              className={`${inputClass} border border-line px-3 py-2.5`}
              value={instagramHandle}
              placeholder="Instagram: имя_аккаунта"
              onChange={(e) => setInstagramHandle(e.target.value)}
            />
            <input
              className={`${inputClass} border border-line px-3 py-2.5`}
              value={tiktokHandle}
              placeholder="TikTok: имя_аккаунта"
              onChange={(e) => setTiktokHandle(e.target.value)}
            />

            {profileError && <p className="text-error text-sm">{profileError}</p>}
            <button type="submit" disabled={savingProfile} className={buttonClass}>
              {savingProfile ? "Сохраняем…" : "Далее"}
            </button>
          </form>
        )}

        {step === 2 && addedCount === 0 && (
          <form onSubmit={addProduct} className="flex flex-col gap-4">
            <div>
              <h1 className="font-display text-2xl mb-1">Добавьте первый товар</h1>
              <p className="text-stone text-sm">
                Вставьте ссылку на товар, который сами купили бы снова.
              </p>
            </div>

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
            />
            <select
              className={`${inputClass} border border-line px-3 py-2.5`}
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABEL[c]}
                </option>
              ))}
            </select>

            {productError && <p className="text-error text-sm">{productError}</p>}
            <button type="submit" disabled={savingProduct} className={buttonClass}>
              {savingProduct ? "Добавляем…" : "Добавить товар"}
            </button>
            <button
              type="button"
              onClick={onDone}
              className="text-[12px] uppercase tracking-wide text-stone hover:text-ink transition-colors cursor-pointer"
            >
              Пропустить, заполню позже
            </button>
          </form>
        )}

        {step === 2 && addedCount > 0 && (
          <div className="flex flex-col gap-5">
            <div>
              <h1 className="font-display text-2xl mb-1">
                {addedCount === 1 ? "Товар добавлен" : `Добавлено товаров: ${addedCount}`}
              </h1>
              <p className="text-stone text-sm leading-relaxed">
                {addedCount === 1
                  ? "Одного товара достаточно для старта, но витрина выглядит убедительнее с 3–5. Добавите ещё?"
                  : "Отличная витрина складывается. Можно продолжить или перейти в кабинет прямо сейчас."}
              </p>
            </div>

            <form onSubmit={addProduct} className="flex flex-col gap-4">
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
              />
              <select
                className={`${inputClass} border border-line px-3 py-2.5`}
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABEL[c]}
                  </option>
                ))}
              </select>
              {productError && <p className="text-error text-sm">{productError}</p>}
              <button type="submit" disabled={savingProduct} className={buttonClass}>
                {savingProduct ? "Добавляем…" : "Добавить ещё один"}
              </button>
            </form>

            <button
              type="button"
              onClick={onDone}
              className="text-[12px] uppercase tracking-wide text-stone hover:text-ink transition-colors cursor-pointer"
            >
              Готово, перейти в кабинет
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
