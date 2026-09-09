"use client";

import { useState } from "react";
import Link from "next/link";
import { Field, inputClass, buttonClass } from "@/app/components/Field";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [verifyUrl, setVerifyUrl] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error ?? "Не удалось зарегистрироваться");
      return;
    }

    // MVP has no email provider wired up: show the verify link directly
    // instead of sending it by mail.
    setVerifyUrl(`/verify?token=${data.verificationToken}`);
  }

  if (verifyUrl) {
    return (
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-md text-center flex flex-col gap-4">
          <h1 className="font-display text-2xl">Проверьте почту</h1>
          <p className="text-stone text-sm">
            Мы бы отправили письмо со ссылкой подтверждения — в MVP её можно
            открыть прямо здесь.
          </p>
          <a href={verifyUrl} className="underline underline-offset-4 text-sm">
            Подтвердить email
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="grid md:grid-cols-2 flex-1">
      <div className="border-b md:border-b-0 md:border-r border-line flex flex-col justify-center px-8 py-14 md:px-16">
        <div className="text-[11px] uppercase tracking-widest text-stone mb-4">
          MyShop
        </div>
        <h2 className="font-display text-3xl leading-tight max-w-[12ch]">
          Покупай у своих людей, не у алгоритма.
        </h2>
      </div>
      <div className="flex flex-col justify-center gap-6 px-8 py-14 md:px-16">
        <div>
          <h1 className="font-display text-2xl mb-1">Создать витрину</h1>
          <p className="text-stone text-sm">
            Уже есть аккаунт?{" "}
            <Link href="/login" className="text-ink underline underline-offset-4">
              Войти
            </Link>
          </p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <Field label="Email">
            <input
              type="email"
              required
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field label="Пароль">
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
            {submitting ? "Секунду…" : "Зарегистрироваться"}
          </button>
        </form>
      </div>
    </main>
  );
}
