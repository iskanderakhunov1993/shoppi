"use client";

import { useState } from "react";
import { inputClass } from "@/app/components/Field";

export function ProfileEditor({
  me,
  onSaved,
}: {
  me: { displayName: string; bio?: string };
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [displayName, setDisplayName] = useState(me.displayName);
  const [bio, setBio] = useState(me.bio ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const res = await fetch("/api/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName, bio }),
    });
    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(data.error ?? "Не удалось сохранить");
      return;
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    onSaved();
  }

  return (
    <div className="flex flex-col gap-3 pt-6 border-t border-line">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-[11px] uppercase tracking-wider text-stone hover:text-ink transition-colors text-left cursor-pointer"
      >
        {open ? "Скрыть профиль" : "Профиль витрины"}
      </button>

      {open && (
        <form onSubmit={handleSave} className="flex flex-col gap-3">
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

          {error && <p className="text-error text-sm">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="text-[12px] font-semibold uppercase tracking-wide border border-ink px-4 py-2.5 hover:bg-ink hover:text-paper transition-colors disabled:opacity-50 cursor-pointer"
          >
            {saving ? "Сохраняем…" : saved ? "Сохранено" : "Сохранить профиль"}
          </button>
        </form>
      )}
    </div>
  );
}
