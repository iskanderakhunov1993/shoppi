"use client";

import { useState } from "react";
import { CATEGORIES, CATEGORY_LABEL, type Category } from "@/lib/categories";

/** Shopper's interest picks; each toggle saves right away. */
export function InterestsEditor({
  interests,
  onChange,
}: {
  interests: Category[];
  onChange: (next: Category[]) => void;
}) {
  const [saved, setSaved] = useState(false);

  async function toggle(c: Category) {
    const next = interests.includes(c) ? interests.filter((x) => x !== c) : [...interests, c];
    onChange(next);
    const res = await fetch("/api/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ interests: next }),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    }
  }

  return (
    <section>
      <div className="flex items-baseline justify-between mb-1">
        <h3 className="text-[11px] uppercase tracking-wider text-stone">Мои интересы</h3>
        <span className="text-[11px] text-stone" role="status">
          {saved ? "Сохранено" : ""}
        </span>
      </div>
      <p className="text-[13px] text-stone mb-4">
        Товары из этих категорий показываются первыми во вкладке «Для вас» на витринах креаторов.
      </p>
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={interests.includes(c)}
            onClick={() => toggle(c)}
            className={`text-[13px] px-3.5 py-2 rounded-full border transition-colors cursor-pointer ${
              interests.includes(c) ? "border-ink bg-ink text-paper" : "border-line hover:border-ink"
            }`}
          >
            {CATEGORY_LABEL[c]}
          </button>
        ))}
      </div>
    </section>
  );
}
