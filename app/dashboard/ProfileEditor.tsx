"use client";

import { useState } from "react";
import { inputClass } from "@/app/components/Field";
import { placeholderAvatar } from "@/lib/avatar";

export function ProfileEditor({
  me,
  onSaved,
  defaultOpen = false,
}: {
  me: {
    displayName: string;
    bio?: string;
    avatarUrl?: string;
    slug?: string;
    instagramHandle?: string;
    tiktokHandle?: string;
  };
  onSaved: () => void;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [displayName, setDisplayName] = useState(me.displayName);
  const [bio, setBio] = useState(me.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(me.avatarUrl ?? "");
  const [instagramHandle, setInstagramHandle] = useState(me.instagramHandle ?? "");
  const [tiktokHandle, setTiktokHandle] = useState(me.tiktokHandle ?? "");
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
      body: JSON.stringify({ displayName, bio, avatarUrl, instagramHandle, tiktokHandle }),
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

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-[11px] uppercase tracking-wider text-stone hover:text-ink transition-colors text-left cursor-pointer"
      >
        Профиль витрины
      </button>
    );
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl">Профиль витрины</h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-[11px] uppercase tracking-wider text-stone hover:text-ink transition-colors cursor-pointer"
        >
          Скрыть
        </button>
      </div>

      <section className="flex flex-col gap-4 p-5 border border-line">
        <h3 className="text-[11px] uppercase tracking-wider text-stone">Основное</h3>

        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={avatarUrl || placeholderAvatar(me.slug ?? me.displayName)}
            alt=""
            className="w-14 h-14 rounded-full object-cover bg-raise flex-none border border-line"
          />
          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
            <input
              className={`${inputClass} border border-line px-3 py-2`}
              value={avatarUrl}
              placeholder="Ссылка на фото профиля"
              onChange={(e) => setAvatarUrl(e.target.value)}
            />
            <p className="text-stone text-[11.5px] leading-relaxed">
              Пусто — покажем нарисованный портрет, одинаковый при каждом заходе.
            </p>
          </div>
        </div>

        <label className="text-[11px] uppercase tracking-wider text-stone -mb-2">Имя на витрине</label>
        <input
          className={`${inputClass} border border-line px-3 py-2.5`}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
        />

        <label className="text-[11px] uppercase tracking-wider text-stone -mb-2">О себе</label>
        <textarea
          className={`${inputClass} border border-line px-3 py-2.5 resize-y min-h-20`}
          value={bio}
          placeholder="Одна строка о том, что вы советуете"
          onChange={(e) => setBio(e.target.value)}
        />
      </section>

      <section className="flex flex-col gap-4 p-5 border border-line">
        <div>
          <h3 className="text-[11px] uppercase tracking-wider text-stone">Соцсети</h3>
          <p className="text-stone text-[11.5px] leading-relaxed mt-1">
            Необязательно. Появятся значками на витрине рядом с именем.
          </p>
        </div>
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
      </section>

      {error && <p className="text-error text-sm">{error}</p>}
      <button
        type="submit"
        disabled={saving}
        className="text-[12px] font-semibold uppercase tracking-wide border border-ink px-4 py-2.5 hover:bg-ink hover:text-paper transition-colors disabled:opacity-50 cursor-pointer w-fit"
      >
        {saving ? "Сохраняем…" : saved ? "Сохранено" : "Сохранить профиль"}
      </button>
    </form>
  );
}
