"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { inputClass, buttonClass } from "@/app/components/Field";
import { placeholderAvatar } from "@/lib/avatar";
import { CATEGORIES, CATEGORY_LABEL, type Category } from "@/lib/categories";
import type { SocialKey } from "@/app/components/SocialIcons";
import { AvatarUpload } from "./AvatarUpload";
import { SocialFields } from "./SocialFields";

/**
 * Shown once, right after registration, instead of the full tabbed
 * dashboard: welcome → profile → what the storefront is about. Then the
 * creator lands on their own storefront (where the "+" button adds the
 * first product) rather than in a form-heavy dashboard. Completion is
 * stored on the server (`onboarded`), so skipping any field never brings
 * the wizard back.
 */
export function CreatorOnboardingWizard({
  me,
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
    categories?: Category[];
  };
}) {
  const router = useRouter();
  const [step, setStep] = useState<0 | 1 | 2>(0);

  const [displayName, setDisplayName] = useState(me.displayName);
  const [bio, setBio] = useState(me.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(me.avatarUrl ?? "");
  const [socials, setSocials] = useState<Record<SocialKey, string>>({
    instagramHandle: me.instagramHandle ?? "",
    tiktokHandle: me.tiktokHandle ?? "",
    telegramHandle: me.telegramHandle ?? "",
    youtubeHandle: me.youtubeHandle ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [niche, setNiche] = useState<Category[]>(me.categories ?? []);

  function toggleNiche(c: Category) {
    setNiche((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  }

  async function put(body: Record<string, unknown>) {
    return fetch("/api/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const res = await put({ displayName, bio, ...socials });
    setSaving(false);
    if (!res.ok) {
      setError((await res.json()).error ?? "Не удалось сохранить");
      return;
    }
    setStep(2);
  }

  async function finish(withNiche: boolean) {
    setError(null);
    setSaving(true);
    const res = await put({ onboarded: true, ...(withNiche ? { categories: niche } : {}) });
    if (!res.ok) {
      setSaving(false);
      setError((await res.json()).error ?? "Не удалось сохранить");
      return;
    }
    router.push(me.slug ? `/${me.slug}` : "/dashboard");
  }

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm flex flex-col gap-8">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`h-[3px] flex-1 rounded-full transition-colors ${i <= step ? "bg-ink" : "bg-line"}`}
            />
          ))}
        </div>

        {step === 0 && (
          <div className="flex flex-col gap-5 items-start">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={avatarUrl || placeholderAvatar(me.slug ?? me.displayName)}
              alt=""
              className="w-16 h-16 rounded-full object-cover bg-raise border border-line"
            />
            <div>
              <h1 className="font-display text-2xl mb-2">Привет, {me.displayName}!</h1>
              <p className="text-stone text-sm leading-relaxed">
                Ведите витрину с товарами, которые правда советуете, и видите честную
                статистику переходов — без чужого алгоритма между вами и аудиторией.
              </p>
            </div>
            <button onClick={() => setStep(1)} className={`${buttonClass} w-fit`}>
              Начать
            </button>
          </div>
        )}

        {step === 1 && (
          <form onSubmit={saveProfile} className="flex flex-col gap-6">
            <h1 className="font-display text-2xl text-center">Расскажите о себе</h1>

            <AvatarUpload avatarUrl={avatarUrl} seed={me.slug ?? me.displayName} onChange={setAvatarUrl} />

            <div className="flex flex-col gap-3">
              <input
                className={inputClass}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Имя на витрине"
                aria-label="Имя на витрине"
                required
              />
              <input
                className={inputClass}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Пара слов о том, что вы советуете"
                aria-label="О себе"
                maxLength={140}
              />
            </div>

            <SocialFields values={socials} onChange={(key, value) => setSocials((s) => ({ ...s, [key]: value }))} />

            {error && <p className="text-error text-sm">{error}</p>}
            <button type="submit" disabled={saving} className={buttonClass}>
              {saving ? "Сохраняем…" : "Далее"}
            </button>
          </form>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="font-display text-2xl mb-1">О чём ваша витрина?</h1>
              <p className="text-stone text-sm leading-relaxed">
                Выберите категории — покупатели сразу поймут, чего от вас ждать. Можно изменить позже.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleNiche(c)}
                  aria-pressed={niche.includes(c)}
                  className={`text-[13px] px-4 py-2 rounded-full border transition-colors cursor-pointer ${
                    niche.includes(c) ? "border-ink bg-ink text-paper" : "border-line hover:border-ink"
                  }`}
                >
                  {CATEGORY_LABEL[c]}
                </button>
              ))}
            </div>

            {error && <p className="text-error text-sm">{error}</p>}
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => finish(true)}
                disabled={saving || niche.length === 0}
                className={`${buttonClass} disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                {saving ? "Открываем…" : "Открыть витрину"}
              </button>
              <button
                type="button"
                onClick={() => finish(false)}
                disabled={saving}
                className="text-[12px] uppercase tracking-wide text-stone hover:text-ink transition-colors cursor-pointer"
              >
                Пропустить
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
