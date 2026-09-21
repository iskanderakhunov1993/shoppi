"use client";

import { useState } from "react";
import { inputClass } from "@/app/components/Field";
import type { SocialKey } from "@/app/components/SocialIcons";
import { AvatarUpload } from "./AvatarUpload";
import { SocialFields } from "./SocialFields";

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
    telegramHandle?: string;
    youtubeHandle?: string;
    contactEmail?: string;
    hidePopular?: boolean;
  };
  onSaved: () => void;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [displayName, setDisplayName] = useState(me.displayName);
  const [bio, setBio] = useState(me.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(me.avatarUrl ?? "");
  const [socials, setSocials] = useState<Record<SocialKey, string>>({
    instagramHandle: me.instagramHandle ?? "",
    tiktokHandle: me.tiktokHandle ?? "",
    telegramHandle: me.telegramHandle ?? "",
    youtubeHandle: me.youtubeHandle ?? "",
  });
  const [contactEmail, setContactEmail] = useState(me.contactEmail ?? "");
  const [hidePopular, setHidePopular] = useState(me.hidePopular ?? false);
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
      body: JSON.stringify({ displayName, bio, ...socials, contactEmail, hidePopular }),
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

        <AvatarUpload avatarUrl={avatarUrl} seed={me.slug ?? me.displayName} onChange={setAvatarUrl} size={88} />

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
        <h3 className="text-[11px] uppercase tracking-wider text-stone">Соцсети</h3>
        <SocialFields values={socials} onChange={(key, value) => setSocials((s) => ({ ...s, [key]: value }))} />
        <div className="flex flex-col gap-1.5 pt-2">
          <label className="text-[11px] uppercase tracking-wider text-stone" htmlFor="contact-email">
            Почта для сотрудничества
          </label>
          <input
            id="contact-email"
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder="name@example.com"
            autoCapitalize="none"
            className={`${inputClass} border border-line px-3 py-2.5`}
          />
          <p className="text-stone text-[11.5px] leading-relaxed">
            Необязательно. Будет видна всем на вашей витрине — сюда пишут бренды.
          </p>
        </div>
      </section>

      <section className="flex flex-col gap-3 p-5 border border-line">
        <h3 className="text-[11px] uppercase tracking-wider text-stone">Витрина</h3>
        <label className="flex items-start gap-2.5 text-[13px] leading-relaxed cursor-pointer">
          <input
            type="checkbox"
            checked={hidePopular}
            onChange={(e) => setHidePopular(e.target.checked)}
            className="mt-0.5 shrink-0"
          />
          Скрыть вкладку «Популярное» на витрине — не показывать покупателям, какие товары
          кликают чаще.
        </label>
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
