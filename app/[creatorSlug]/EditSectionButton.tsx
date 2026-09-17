"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Owner-only: manage the currently open section right from the
 * storefront tab, instead of always requiring a trip to the
 * dashboard's "Разделы витрины" tab — mirrors ShopMy's per-tab pencil
 * + "Edit Section" pattern.
 */
export function EditSectionButton({
  sectionId,
  name,
  onHidden,
}: {
  sectionId: string;
  name: string;
  onHidden: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(name);
  const [saving, setSaving] = useState(false);

  async function rename() {
    if (!value.trim() || value.trim() === name) return;
    setSaving(true);
    await fetch(`/api/sections/${sectionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: value.trim() }),
    });
    setSaving(false);
    router.refresh();
  }

  async function hide() {
    await fetch(`/api/sections/${sectionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hidden: true }),
    });
    setOpen(false);
    onHidden();
    router.refresh();
  }

  async function remove() {
    const confirmed = window.confirm(`Удалить раздел «${name}»? Товары останутся, изменится только группировка.`);
    if (!confirmed) return;
    await fetch(`/api/sections/${sectionId}`, { method: "DELETE" });
    setOpen(false);
    onHidden();
    router.refresh();
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-label="Управлять разделом"
        className="ml-1 -mr-1 text-stone hover:text-ink transition-colors cursor-pointer align-middle"
      >
        <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="M11.3 2.3a1.4 1.4 0 0 1 2 2L5.4 12.2l-2.8.7.7-2.8L11.3 2.3z"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute z-20 top-full mt-2 left-1/2 -translate-x-1/2 w-56 bg-card border border-line shadow-[0_16px_40px_-16px_rgba(0,0,0,0.3)] p-3 flex flex-col gap-2 text-left normal-case"
        >
          <label className="text-[10px] uppercase tracking-wider text-stone">Название</label>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={rename}
            onKeyDown={(e) => e.key === "Enter" && rename()}
            className="text-[13px] px-2 py-1.5 border border-line bg-transparent outline-none focus:border-ink"
          />
          {saving && <p className="text-stone text-[11px]">Сохраняем…</p>}
          <button
            type="button"
            onClick={hide}
            className="text-[11px] uppercase tracking-wide text-stone hover:text-ink transition-colors cursor-pointer text-left"
          >
            Скрыть с витрины
          </button>
          <button
            type="button"
            onClick={remove}
            className="text-[11px] uppercase tracking-wide text-stone hover:text-error transition-colors cursor-pointer text-left"
          >
            Удалить раздел
          </button>
        </div>
      )}
    </div>
  );
}
