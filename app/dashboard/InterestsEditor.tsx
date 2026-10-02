"use client";

import { useState } from "react";
import { VISIBLE_CATEGORIES, CATEGORY_LABEL, type Category } from "@/lib/categories";

/** Shopper's interest picks; each toggle saves right away. */
export function InterestsEditor({
  interests,
  onChange,
}: {
  interests: Category[];
  onChange: (next: Category[]) => void;
}) {
  const [saved, setSaved] = useState(false);
  const [open, setOpen] = useState(false);

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

  const picked = VISIBLE_CATEGORIES.filter((c) => interests.includes(c));

  return (
    <section>
      <div className="flex items-baseline justify-between mb-1 gap-4">
        <h3 className="text-[11px] uppercase tracking-wider text-stone">Мои интересы</h3>
        <span className="text-[11px] text-stone" role="status">
          {saved ? "Сохранено" : ""}
        </span>
      </div>
      <p className="text-[13px] text-stone mb-3">
        Товары из этих категорий показываются первыми во вкладке «Для вас» на витринах креаторов.
      </p>

      {!open && (
        <p className="text-[14px]">
          {picked.length > 0 ? picked.map((c) => CATEGORY_LABEL[c]).join(", ") : "Пока ничего не выбрано"}
          {" · "}
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-expanded={false}
            className="text-stone underline underline-offset-4 hover:text-ink transition-colors cursor-pointer"
          >
            Изменить
          </button>
        </p>
      )}

      {open && (
        <>
          <div className="flex flex-wrap gap-2">
            {VISIBLE_CATEGORIES.map((c) => {
              const on = interests.includes(c);
              return (
                <button
                  key={c}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(c)}
                  className={`text-[13px] px-3.5 py-2 border transition-colors cursor-pointer ${
                    on ? "border-ink bg-ink text-paper" : "border-line hover:border-ink"
                  }`}
                >
                  {on ? "✓ " : ""}
                  {CATEGORY_LABEL[c]}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-expanded
            className="mt-4 text-[12px] uppercase tracking-wide text-stone hover:text-ink transition-colors cursor-pointer"
          >
            Готово
          </button>
        </>
      )}
    </section>
  );
}
