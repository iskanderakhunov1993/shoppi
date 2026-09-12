"use client";

import { useState } from "react";
import { placeholderAvatar } from "@/lib/avatar";

type Category = "cosmetics" | "mens" | "clothing";

const CATEGORY_LABEL: Record<Category, string> = {
  cosmetics: "Косметика",
  mens: "Мужские товары",
  clothing: "Одежда",
};

const CATEGORIES = Object.keys(CATEGORY_LABEL) as Category[];

type RecommendedCreator = {
  id: string;
  slug: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  followers: number;
};

export function CircleOnboarding({
  onClose,
  onDone,
}: {
  onClose: () => void;
  onDone: () => void;
}) {
  const [step, setStep] = useState<"categories" | "creators">("categories");
  const [categories, setCategories] = useState<Category[]>([]);
  const [creators, setCreators] = useState<RecommendedCreator[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  function toggleCategory(c: Category) {
    setCategories((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  }

  async function goToCreators() {
    setStep("creators");
    const res = await fetch(`/api/creators/recommended?categories=${categories.join(",")}`);
    const data = await res.json();
    setCreators(data.creators ?? []);
  }

  function toggleCreator(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function finish() {
    setSaving(true);
    await Promise.all(
      [...selected].map((creatorId) =>
        fetch("/api/follows", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ creatorId }),
        })
      )
    );
    setSaving(false);
    onDone();
  }

  return (
    <div className="fixed inset-0 bg-ink/40 z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-line w-full max-w-lg max-h-[85vh] overflow-y-auto p-8 flex flex-col gap-6">
        <div className="flex items-start justify-between">
          <h2 className="font-display text-2xl">
            {step === "categories" ? "Что вам интересно?" : "Кого добавим в круг?"}
          </h2>
          <button
            onClick={onClose}
            aria-label="Закрыть"
            className="text-stone hover:text-ink transition-colors text-xl leading-none cursor-pointer"
          >
            ×
          </button>
        </div>

        {step === "categories" && (
          <>
            <p className="text-stone text-sm leading-relaxed -mt-4">
              Выберите категории — покажем реальных кураторов, которые уже добавляют в них товары.
            </p>
            <div className="grid grid-cols-1 gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleCategory(c)}
                  className={`text-left px-4 py-3 border transition-colors cursor-pointer ${
                    categories.includes(c)
                      ? "border-ink bg-ink text-paper"
                      : "border-line hover:border-ink"
                  }`}
                >
                  {CATEGORY_LABEL[c]}
                </button>
              ))}
            </div>
            <button
              type="button"
              disabled={categories.length === 0}
              onClick={goToCreators}
              className="text-[12px] font-semibold uppercase tracking-wide text-paper bg-ink px-5 py-3 hover:opacity-80 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer w-fit"
            >
              Далее
            </button>
          </>
        )}

        {step === "creators" && (
          <>
            <p className="text-stone text-sm leading-relaxed -mt-4">
              Добавьте кого-то из них в круг — их находки соберутся у вас в одной ленте. Можно изменить позже.
            </p>
            {creators === null ? (
              <p className="text-stone text-sm">Загрузка…</p>
            ) : creators.length === 0 ? (
              <p className="text-stone text-sm">
                Пока нет кураторов в этих категориях — загляните позже или посмотрите{" "}
                <a href="/curators" className="underline">
                  весь список
                </a>
                .
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {creators.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleCreator(c.id)}
                    className={`flex flex-col items-start gap-2 p-3 border text-left transition-colors cursor-pointer ${
                      selected.has(c.id) ? "border-ink" : "border-line hover:border-stone"
                    }`}
                  >
                    <div className="flex items-center gap-2 w-full">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={c.avatarUrl || placeholderAvatar(c.slug)}
                        alt=""
                        className="w-9 h-9 rounded-full object-cover bg-raise flex-none"
                      />
                      <span className="text-[13px] font-medium leading-tight">{c.displayName}</span>
                      <span
                        className={`ml-auto w-5 h-5 flex-none rounded-full border flex items-center justify-center text-[11px] ${
                          selected.has(c.id) ? "bg-ink border-ink text-paper" : "border-line text-transparent"
                        }`}
                      >
                        ✓
                      </span>
                    </div>
                    {c.bio && (
                      <span className="text-[11.5px] text-stone leading-snug line-clamp-2">{c.bio}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep("categories")}
                className="text-[12px] uppercase tracking-wide text-stone border border-line px-4 py-2.5 hover:border-ink hover:text-ink transition-colors cursor-pointer"
              >
                Назад
              </button>
              <button
                type="button"
                disabled={selected.size === 0 || saving}
                onClick={finish}
                className="text-[12px] font-semibold uppercase tracking-wide text-paper bg-ink px-5 py-2.5 hover:opacity-80 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {saving ? "Добавляем…" : `Добавить ${selected.size || ""}`.trim()}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
