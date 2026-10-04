"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AvatarUpload } from "@/app/dashboard/AvatarUpload";
import { Field, boxedInputClass, buttonClass, secondaryButtonClass } from "@/app/components/Field";

const ROLE_LABEL: Record<string, string> = {
  shopper: "Покупатель",
  creator: "Креатор",
  brand: "Бренд",
};

type Me = {
  role: "shopper" | "creator" | "brand";
  email: string;
  displayName: string;
  slug?: string;
  wishlistPublic?: boolean;
  avatarUrl?: string;
  bio?: string;
};

export default function SettingsPage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [savedName, setSavedName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");
  const [savedBio, setSavedBio] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [wishlistPublic, setWishlistPublic] = useState(false);
  const [wishlistError, setWishlistError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const loadMe = useCallback(async () => {
    const res = await fetch("/api/me");
    if (res.status === 401) {
      router.replace("/login");
      return;
    }
    const data = await res.json();
    setMe(data);
    setDisplayName(data.displayName ?? "");
    setSavedName(data.displayName ?? "");
    setAvatarUrl(data.avatarUrl ?? "");
    setBio(data.bio ?? "");
    setSavedBio(data.bio ?? "");
    setWishlistPublic(Boolean(data.wishlistPublic));
  }, [router]);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  async function saveName(e: React.FormEvent) {
    const isShopperRole = me?.role === "shopper";
    e.preventDefault();
    setNameError(null);
    setSavingName(true);

    let res: Response;
    let data: { error?: string } = {};
    try {
      res = await fetch("/api/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isShopperRole ? { displayName: displayName.trim(), bio } : { displayName: displayName.trim() }),
      });
      data = await res.json().catch(() => ({}));
    } catch {
      setSavingName(false);
      setNameError("Нет соединения. Попробуйте ещё раз.");
      return;
    }
    setSavingName(false);

    if (!res.ok) {
      setNameError(data.error ?? "Не удалось сохранить");
      return;
    }
    setDisplayName(displayName.trim());
    setSavedName(displayName.trim());
    setSavedBio(bio.trim());
    setNameSaved(true);
    setTimeout(() => setNameSaved(false), 2500);
  }

  async function toggleWishlist(next: boolean) {
    setWishlistError(null);
    setWishlistPublic(next);
    try {
      const res = await fetch("/api/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wishlistPublic: next }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setWishlistPublic(!next);
      setWishlistError("Не удалось сохранить. Попробуйте ещё раз.");
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setSavingPassword(true);

    let res: Response;
    let data: { error?: string } = {};
    try {
      res = await fetch("/api/me/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      data = await res.json().catch(() => ({}));
    } catch {
      setSavingPassword(false);
      setPasswordError("Нет соединения. Попробуйте ещё раз.");
      return;
    }
    setSavingPassword(false);

    if (!res.ok) {
      setPasswordError(data.error ?? "Не удалось сохранить");
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setPasswordSaved(true);
    setPasswordOpen(false);
    setTimeout(() => setPasswordSaved(false), 2500);
  }

  if (!me) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <p className="text-stone text-sm">Загрузка…</p>
      </main>
    );
  }

  const isShopper = me.role === "shopper";
  const nameDirty =
    displayName.trim().length > 0 && (displayName.trim() !== savedName || (isShopper && bio.trim() !== savedBio));

  return (
    <main className="flex-1 flex flex-col">
      <div className="flex items-center justify-between px-8 py-6 border-b border-line">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-stone">{ROLE_LABEL[me.role]}</div>
          <h1 className="font-display text-xl">Настройки</h1>
        </div>
        <Link
          href="/dashboard"
          className="text-[12px] uppercase tracking-wide text-stone hover:text-ink transition-colors"
        >
          ← В кабинет
        </Link>
      </div>

      <div className="px-8 py-10 max-w-3xl w-full mx-auto md:mx-0 md:ml-8 lg:ml-16 grid md:grid-cols-[160px_1fr] gap-x-12 gap-y-8">
        <nav aria-label="Разделы настроек" className="hidden md:block">
          <ul className="sticky top-8 flex flex-col gap-3 text-[13px]">
            <li><a href="#profile" className="text-ink">Профиль</a></li>
            {isShopper && (
              <li><a href="#privacy" className="text-stone hover:text-ink transition-colors">Вишлист</a></li>
            )}
            <li><a href="#password" className="text-stone hover:text-ink transition-colors">Пароль</a></li>
          </ul>
        </nav>

        <div className="flex flex-col gap-12 max-w-md">
          <form id="profile" onSubmit={saveName} className="flex flex-col gap-4 scroll-mt-8">
            <h2 className="font-display text-2xl">Профиль</h2>

            {isShopper && (
              <div className="flex items-center gap-5">
                <AvatarUpload avatarUrl={avatarUrl} seed={me.slug ?? me.email} onChange={setAvatarUrl} size={80} />
                <p className="text-stone text-[12px] max-w-[220px]">
                  Фото видно на вашем вишлисте, если вы откроете его по ссылке.
                </p>
              </div>
            )}

            <Field label={isShopper ? "Имя" : "Имя на витрине"} htmlFor="displayName">
              <input
                id="displayName"
                name="displayName"
                autoComplete="name"
                maxLength={60}
                className={boxedInputClass}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </Field>

            {isShopper && (
              <Field label="О себе" htmlFor="bio">
                <textarea
                  id="bio"
                  name="bio"
                  rows={2}
                  maxLength={160}
                  placeholder="Например: собираю уход для чувствительной кожи"
                  className={`${boxedInputClass} resize-none`}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </Field>
            )}

            <Field label="Email" htmlFor="email">
              <input
                id="email"
                name="email"
                aria-describedby="email-hint"
                className={boxedInputClass}
                value={me.email}
                disabled
                readOnly
              />
            </Field>
            <p id="email-hint" className="text-stone text-[12px] -mt-2">
              Email изменить нельзя. Если нужно, напишите в поддержку.
            </p>

            <p role="alert" className="text-error text-sm empty:hidden">{nameError}</p>
            <div className="flex items-center gap-4">
              <button type="submit" disabled={savingName || !nameDirty} className={`${secondaryButtonClass} w-fit`}>
                {savingName ? "Сохраняем…" : "Сохранить"}
              </button>
              <span role="status" aria-live="polite" className="text-[13px] text-stone">
                {nameSaved ? "✓ Сохранено" : ""}
              </span>
            </div>
          </form>

          {isShopper && (
            <section id="privacy" className="flex flex-col gap-3 pt-8 border-t border-line scroll-mt-8">
              <h2 className="font-display text-2xl">Вишлист</h2>
              <label className="flex items-start gap-3 cursor-pointer w-fit">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={wishlistPublic}
                  onChange={(e) => toggleWishlist(e.target.checked)}
                />
                <span className="text-[14px]">
                  Доступен по ссылке
                  <span className="block text-stone text-[12px] mt-0.5">
                    {wishlistPublic
                      ? "Любой, у кого есть ссылка, увидит сохранённые товары."
                      : "Сейчас вишлист виден только вам."}
                  </span>
                </span>
              </label>
              {wishlistPublic && me.slug && (
                <a href={`/wishlist/${me.slug}`} target="_blank" rel="noopener noreferrer" className="text-[13px] text-stone underline underline-offset-4 hover:text-ink w-fit">
                  Открыть вишлист
                </a>
              )}
              <p role="alert" className="text-error text-sm empty:hidden">{wishlistError}</p>
            </section>
          )}

          <section id="password" className="flex flex-col gap-4 pt-8 border-t border-line scroll-mt-8">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-display text-2xl">Пароль</h2>
              {!passwordOpen && (
                <button
                  type="button"
                  onClick={() => setPasswordOpen(true)}
                  aria-expanded={false}
                  aria-controls="password-form"
                  className="text-[12px] uppercase tracking-wide text-stone border-b border-line hover:text-ink hover:border-ink transition-colors cursor-pointer"
                >
                  Сменить
                </button>
              )}
            </div>
            <span role="status" aria-live="polite" className="text-[13px] text-stone empty:hidden">
              {passwordSaved ? "✓ Пароль изменён" : ""}
            </span>

            {passwordOpen && (
              <form id="password-form" onSubmit={savePassword} className="flex flex-col gap-4">
                <Field label="Текущий пароль" htmlFor="currentPassword">
                  <input
                    id="currentPassword"
                    name="currentPassword"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    className={boxedInputClass}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </Field>

                <Field label="Новый пароль" htmlFor="newPassword">
                  <input
                    id="newPassword"
                    name="newPassword"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    aria-describedby="password-hint"
                    className={boxedInputClass}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    minLength={8}
                    required
                  />
                </Field>
                <p id="password-hint" className="text-stone text-[12px] -mt-2">Не менее 8 символов.</p>

                <label className="flex items-center gap-2 text-[13px] text-stone cursor-pointer w-fit">
                  <input
                    type="checkbox"
                    checked={showPassword}
                    onChange={(e) => setShowPassword(e.target.checked)}
                  />
                  Показать пароли
                </label>

                <p role="alert" className="text-error text-sm empty:hidden">{passwordError}</p>
                <div className="flex items-center gap-4">
                  <button type="submit" disabled={savingPassword} className={`${buttonClass} w-fit`}>
                    {savingPassword ? "Сохраняем…" : "Сменить пароль"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPasswordOpen(false);
                      setCurrentPassword("");
                      setNewPassword("");
                      setPasswordError(null);
                    }}
                    className="text-[12px] uppercase tracking-wide text-stone hover:text-ink transition-colors cursor-pointer"
                  >
                    Отмена
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
