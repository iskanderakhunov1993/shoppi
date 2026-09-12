"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Field, inputClass, buttonClass } from "@/app/components/Field";

const ROLE_LABEL: Record<string, string> = {
  shopper: "Шоппер",
  creator: "Куратор",
  brand: "Бренд",
};

type Me = {
  role: "shopper" | "creator" | "brand";
  email: string;
  displayName: string;
};

export default function SettingsPage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const loadMe = useCallback(async () => {
    const res = await fetch("/api/me");
    if (res.status === 401) {
      router.push("/login");
      return;
    }
    const data = await res.json();
    setMe(data);
    setDisplayName(data.displayName ?? "");
  }, [router]);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    setNameError(null);
    setSavingName(true);

    const res = await fetch("/api/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName }),
    });
    const data = await res.json();
    setSavingName(false);

    if (!res.ok) {
      setNameError(data.error ?? "Не удалось сохранить");
      return;
    }
    setNameSaved(true);
    setTimeout(() => setNameSaved(false), 2500);
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setSavingPassword(true);

    const res = await fetch("/api/me/password", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    setSavingPassword(false);

    if (!res.ok) {
      setPasswordError(data.error ?? "Не удалось сохранить");
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setPasswordSaved(true);
    setTimeout(() => setPasswordSaved(false), 2500);
  }

  if (!me) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <p className="text-stone text-sm">Загрузка…</p>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col">
      <div className="flex items-center justify-between px-8 py-6 border-b border-line">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-stone">Настройки</div>
          <h1 className="font-display text-xl">{ROLE_LABEL[me.role]}</h1>
        </div>
        <Link
          href="/dashboard"
          className="text-[12px] uppercase tracking-wide text-stone border border-line px-3 py-2 hover:border-ink hover:text-ink transition-colors"
        >
          Назад в кабинет
        </Link>
      </div>

      <div className="px-8 py-10 max-w-md flex flex-col gap-12">
        <form onSubmit={saveName} className="flex flex-col gap-4">
          <h2 className="font-display text-lg">Профиль</h2>

          <Field label="Имя на витрине">
            <input
              className={`${inputClass} border border-line px-3 py-2.5`}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
          </Field>

          <Field label="Email">
            <input
              className={`${inputClass} border border-line px-3 py-2.5 opacity-60`}
              value={me.email}
              disabled
              readOnly
            />
          </Field>
          <p className="text-stone text-[12px] -mt-2">
            Смену email пока не поддерживаем — обратитесь в поддержку, если это нужно.
          </p>

          {nameError && <p className="text-error text-sm">{nameError}</p>}
          <button type="submit" disabled={savingName} className={`${buttonClass} w-fit`}>
            {savingName ? "Сохраняем…" : nameSaved ? "Сохранено" : "Сохранить имя"}
          </button>
        </form>

        <form onSubmit={savePassword} className="flex flex-col gap-4 pt-8 border-t border-line">
          <h2 className="font-display text-lg">Пароль</h2>

          <Field label="Текущий пароль">
            <input
              type="password"
              className={`${inputClass} border border-line px-3 py-2.5`}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </Field>

          <Field label="Новый пароль">
            <input
              type="password"
              className={`${inputClass} border border-line px-3 py-2.5`}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={8}
              required
            />
          </Field>

          {passwordError && <p className="text-error text-sm">{passwordError}</p>}
          <button type="submit" disabled={savingPassword} className={`${buttonClass} w-fit`}>
            {savingPassword ? "Сохраняем…" : passwordSaved ? "Сохранено" : "Сменить пароль"}
          </button>
        </form>
      </div>
    </main>
  );
}
