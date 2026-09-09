"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Field, inputClass, buttonClass } from "@/app/components/Field";

type LinkRow = {
  id: string;
  title: string;
  category: "cosmetics" | "mens" | "clothing";
  imageUrl?: string;
  price?: number;
  clicks: number;
  wrappedUrl: string;
};

const CATEGORY_LABEL: Record<LinkRow["category"], string> = {
  cosmetics: "Косметика",
  mens: "Мужские товары",
  clothing: "Одежда",
};

export default function DashboardPage() {
  const router = useRouter();
  const [me, setMe] = useState<{ slug: string; displayName: string } | null>(null);
  const [links, setLinks] = useState<LinkRow[] | null>(null);
  const [title, setTitle] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [category, setCategory] = useState<LinkRow["category"]>("cosmetics");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadLinks = useCallback(async () => {
    const res = await fetch("/api/links");
    if (res.status === 401) {
      router.push("/login");
      return;
    }
    const data = await res.json();
    setLinks(data.links);
  }, [router]);

  useEffect(() => {
    fetch("/api/me")
      .then((res) => (res.ok ? res.json() : null))
      .then(setMe);
    loadLinks();
  }, [loadLinks]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const res = await fetch("/api/links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, targetUrl, category }),
    });
    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error ?? "Не удалось добавить товар");
      return;
    }

    setTitle("");
    setTargetUrl("");
    await loadLinks();
  }

  if (links === null) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <p className="text-stone text-sm">Загрузка…</p>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col">
      <div className="flex justify-between items-center px-8 py-6 border-b border-line">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-stone">Кабинет</div>
          <div className="font-display text-xl">{me?.displayName}</div>
        </div>
        {me && (
          <a href={`/${me.slug}`} className="text-[12.5px] text-stone border border-line px-3 py-2">
            myshop.ru/{me.slug}
          </a>
        )}
      </div>
      <div className="grid md:grid-cols-[300px_1fr] flex-1">
        <div className="border-r border-line px-8 py-8 flex flex-col gap-4">
          <h3 className="text-[11px] uppercase tracking-wider text-stone">
            Добавить товар
          </h3>
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
            />
            <select
              className={`${inputClass} border border-line px-3 py-2.5`}
              value={category}
              onChange={(e) => setCategory(e.target.value as LinkRow["category"])}
            >
              <option value="cosmetics">Косметика</option>
              <option value="mens">Мужские товары</option>
              <option value="clothing">Одежда</option>
            </select>
            {error && <p className="text-error text-sm">{error}</p>}
            <button type="submit" disabled={submitting} className={buttonClass}>
              {submitting ? "Добавляем…" : "Добавить"}
            </button>
          </form>
        </div>

        <div className="px-8 py-8">
          <div className="flex justify-between items-baseline mb-4">
            <h3 className="text-[11px] uppercase tracking-wider text-stone">
              Мои ссылки
            </h3>
            <span className="text-xs text-stone">{links.length} ссылок</span>
          </div>

          {links.length === 0 ? (
            <p className="font-display italic text-base text-stone">
              Ваша витрина пока пуста — добавьте первый товар слева.
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
      </div>
    </main>
  );
}
