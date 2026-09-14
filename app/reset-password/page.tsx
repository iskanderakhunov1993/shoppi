"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Field, inputClass, buttonClass } from "@/app/components/Field";

function ResetPasswordForm() {
  const router = useRouter();
  const token = useSearchParams().get("token");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json().catch(() => ({}));
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error ?? "Не удалось сбросить пароль");
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/login"), 1500);
  }

  if (!token) {
    return (
      <div className="w-full max-w-sm flex flex-col gap-4">
        <h1 className="font-display text-2xl">Ссылка недействительна</h1>
        <p className="text-stone text-sm leading-relaxed">
          В ссылке нет токена сброса. Запросите новую.
        </p>
        <Link href="/forgot-password" className="text-ink underline underline-offset-4 text-sm w-fit">
          Забыли пароль?
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="w-full max-w-sm flex flex-col gap-4">
        <h1 className="font-display text-2xl">Пароль обновлён</h1>
        <p className="text-stone text-sm leading-relaxed">Переносим вас на страницу входа…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl mb-1">Новый пароль</h1>
        <p className="text-stone text-sm">Минимум 6 символов.</p>
      </div>
      <Field label="Новый пароль">
        <input
          type="password"
          required
          minLength={6}
          className={inputClass}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Field>
      {error && <p className="text-error text-sm">{error}</p>}
      <button type="submit" disabled={submitting} className={buttonClass}>
        {submitting ? "Секунду…" : "Сохранить пароль"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="flex-1 flex items-center justify-center px-6">
      <Suspense fallback={<p className="text-stone text-sm">Загрузка…</p>}>
        <ResetPasswordForm />
      </Suspense>
    </main>
  );
}
