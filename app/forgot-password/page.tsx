"use client";

import { useState } from "react";
import Link from "next/link";
import { Field, inputClass, buttonClass } from "@/app/components/Field";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);
  const [mailOff, setMailOff] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json().catch(() => ({}));
    setSubmitting(false);
    setSent(true);
    // Only ever populated when RESEND_API_KEY isn't configured (local
    // dev) — never rely on this in production, where it's always undefined.
    if (data.resetUrl) setDevResetUrl(data.resetUrl);
    if (data.emailed === false && !data.resetUrl) setMailOff(true);
  }

  if (sent && mailOff) {
    return (
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm flex flex-col gap-4">
          <h1 className="font-display text-2xl">Письмо не отправлено</h1>
          <p className="text-stone text-sm leading-relaxed">
            Аккаунта с адресом <strong className="text-ink">{email}</strong> может не быть, либо
            почта сервиса пока не доставляет письма на этот адрес. Обратитесь к администратору
            сервиса — он поможет восстановить доступ.
          </p>
          <Link href="/login" className="text-ink underline underline-offset-4 text-sm w-fit">
            Вернуться ко входу
          </Link>
        </div>
      </main>
    );
  }

  if (sent) {
    return (
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm flex flex-col gap-4">
          <h1 className="font-display text-2xl">Проверьте почту</h1>
          <p className="text-stone text-sm leading-relaxed">
            Если аккаунт с адресом <strong className="text-ink">{email}</strong> существует, мы
            отправили на него ссылку для сброса пароля. Она действует час.
          </p>
          {devResetUrl && (
            <p className="text-stone text-sm leading-relaxed border border-line p-3">
              Почта не настроена (только для разработки) —{" "}
              <a href={devResetUrl} className="text-ink underline underline-offset-4">
                вот прямая ссылка
              </a>
              .
            </p>
          )}
          <Link href="/login" className="text-ink underline underline-offset-4 text-sm w-fit">
            Вернуться ко входу
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex items-center justify-center px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-6">
        <div>
          <h1 className="font-display text-2xl mb-1">Забыли пароль?</h1>
          <p className="text-stone text-sm">
            Укажите email — пришлём ссылку для сброса пароля. Подходит для любой роли: покупателя
            и креатора.
          </p>
        </div>
        <Field label="Email">
          <input
            type="email"
            required
            className={inputClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <button type="submit" disabled={submitting} className={buttonClass}>
          {submitting ? "Секунду…" : "Отправить ссылку"}
        </button>
        <Link href="/login" className="text-stone hover:text-ink underline underline-offset-4 text-sm w-fit">
          Вернуться ко входу
        </Link>
      </form>
    </main>
  );
}
