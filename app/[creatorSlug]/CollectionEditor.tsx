"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Product = { id: string; title: string; imageUrl?: string };

/**
 * Owner-only dialog for creating or editing a collection: a name plus a
 * checklist of the creator's own products. Opens from "Добавить коллекцию"
 * (new, inside the section that's currently open) or from a collection card.
 */
export function CollectionEditor({
  products,
  collection,
  onClose,
}: {
  products: Product[];
  collection?: { id: string; name: string; linkIds: string[] };
  onClose: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(collection?.name ?? "");
  const [picked, setPicked] = useState<string[]>(collection?.linkIds ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(id: string) {
    setPicked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Дайте коллекции название");
      return;
    }
    setSaving(true);
    setError(null);
    const res = await fetch(collection ? `/api/collections/${collection.id}` : "/api/collections", {
      method: collection ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), linkIds: picked }),
    });
    setSaving(false);
    if (!res.ok) {
      setError((await res.json().catch(() => ({}))).error ?? "Не удалось сохранить");
      return;
    }
    router.refresh();
    onClose();
  }

  async function remove() {
    if (!collection || !window.confirm(`Удалить коллекцию «${collection.name}»? Товары останутся на витрине.`)) return;
    await fetch(`/api/collections/${collection.id}`, { method: "DELETE" });
    router.refresh();
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={collection ? "Изменить коллекцию" : "Новая коллекция"}
    >
      <form
        onSubmit={save}
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md max-h-[90vh] flex flex-col gap-4 bg-card border border-line p-5"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl">{collection ? "Изменить коллекцию" : "Новая коллекция"}</h2>
          <button type="button" onClick={onClose} aria-label="Закрыть" className="text-stone hover:text-ink text-xl leading-none cursor-pointer">
            ×
          </button>
        </div>

        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Название, например «Осенний гардероб»"
          maxLength={80}
          className="border-b border-line bg-transparent py-2 text-[15px] outline-none focus:border-ink"
        />

        <p className="text-[11px] uppercase tracking-wider text-stone">Товары · выбрано {picked.length}</p>
        <ul className="flex-1 overflow-y-auto flex flex-col divide-y divide-line border-y border-line -mt-2">
          {products.map((p) => (
            <li key={p.id}>
              <label className="flex items-center gap-3 py-2.5 cursor-pointer">
                <input type="checkbox" checked={picked.includes(p.id)} onChange={() => toggle(p.id)} />
                <span className="w-9 h-9 flex-none bg-line overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {p.imageUrl && <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />}
                </span>
                <span className="text-[13.5px] leading-snug">{p.title}</span>
              </label>
            </li>
          ))}
        </ul>

        {error && <p className="text-error text-sm">{error}</p>}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="text-[12px] font-semibold uppercase tracking-wide text-paper bg-ink px-5 py-2.5 hover:opacity-85 transition-opacity disabled:opacity-50 cursor-pointer"
          >
            {saving ? "Сохраняем…" : "Сохранить"}
          </button>
          {collection && (
            <button
              type="button"
              onClick={remove}
              className="text-[12px] uppercase tracking-wide text-stone hover:text-error transition-colors cursor-pointer"
            >
              Удалить
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
