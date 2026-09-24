"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES, CATEGORY_LABEL, guessCategory, type Category } from "@/lib/categories";

/**
 * Lets a creator add a product without leaving their own storefront —
 * the full form with brand/type/promo still lives in the dashboard;
 * this is the fast path for the common case (paste a link, save).
 */
export function QuickAddProductButton({ variant = "icon" }: { variant?: "icon" | "pill" }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [category, setCategory] = useState<Category>("face_care");
  const [submitting, setSubmitting] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function lookupProduct(url: string) {
    if (!url.trim()) return;
    try {
      new URL(url);
    } catch {
      return;
    }
    setLookingUp(true);
    const res = await fetch(`/api/marketplace/lookup?url=${encodeURIComponent(url)}`);
    const data = await res.json().catch(() => null);
    setLookingUp(false);
    if (data?.found && data.title && !title.trim()) {
      setTitle(data.title);
      const guessed = guessCategory(data.title);
      if (guessed) setCategory(guessed);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const res = await fetch("/api/links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, targetUrl, category }),
    });
    const data = await res.json().catch(() => null);
    setSubmitting(false);
    if (!res.ok) {
      setError(data?.error ?? "Не удалось добавить товар");
      return;
    }
    setTitle("");
    setTargetUrl("");
    setOpen(false);
    router.refresh();
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Добавить товар"
        title="Добавить товар"
        className={
          variant === "pill"
            ? "inline-flex items-center gap-1.5 text-[13px] px-3.5 py-1.5 rounded-full bg-ink text-paper hover:opacity-85 transition-opacity cursor-pointer whitespace-nowrap"
            : "w-8 h-8 flex items-center justify-center border border-line rounded-full text-stone hover:text-ink hover:border-ink transition-colors cursor-pointer"
        }
      >
        {variant === "pill" ? (
          "Добавить товар +"
        ) : (
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        )}
      </button>

      {open && (
        <form
          onSubmit={handleSubmit}
          className={`absolute z-20 top-full mt-2 ${variant === "pill" ? "left-0" : "right-0"} w-72 max-w-[calc(100vw-2rem)] bg-card border border-line shadow-[0_16px_40px_-16px_rgba(0,0,0,0.3)] p-4 flex flex-col gap-2.5 text-left`}
        >
          <h3 className="text-[11px] uppercase tracking-wider text-stone">Добавить товар</h3>
          <input
            placeholder="Ссылка на товар"
            type="url"
            required
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            onBlur={(e) => lookupProduct(e.target.value)}
            onPaste={(e) => {
              const pasted = e.clipboardData.getData("text");
              if (pasted) lookupProduct(pasted);
            }}
            className="text-[13px] px-2.5 py-2 border border-line bg-transparent outline-none focus:border-ink"
          />
          {lookingUp && <p className="text-stone text-[11.5px]">Загружаем данные…</p>}
          <input
            placeholder="Название товара"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-[13px] px-2.5 py-2 border border-line bg-transparent outline-none focus:border-ink"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            className="text-[13px] px-2.5 py-2 border border-line bg-transparent outline-none focus:border-ink"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABEL[c]}
              </option>
            ))}
          </select>
          {error && <p className="text-error text-[12px]">{error}</p>}
          <button
            type="submit"
            disabled={submitting || lookingUp}
            className="text-[12px] font-semibold uppercase tracking-wide text-paper bg-ink px-4 py-2.5 hover:opacity-80 transition-opacity disabled:opacity-40 cursor-pointer"
          >
            {submitting ? "Добавляем…" : lookingUp ? "Секунду…" : "Добавить"}
          </button>
        </form>
      )}
    </div>
  );
}
