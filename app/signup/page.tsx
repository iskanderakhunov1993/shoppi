"use client";

import { useState } from "react";
import Link from "next/link";
import { Field, inputClass, buttonClass } from "@/app/components/Field";

type Role = "shopper" | "creator" | "brand";

const ROLE_CARDS: {
  role: Role;
  title: string;
  tagline: string;
  imageSeed: string;
}[] = [
  {
    role: "shopper",
    title: "Покупатель",
    tagline: "Покупай у своих людей, не у алгоритма.",
    imageSeed: "shoppi-shoppers",
  },
  {
    role: "creator",
    title: "Куратор",
    tagline: "Твой вкус — теперь витрина.",
    imageSeed: "shoppi-creators",
  },
  {
    role: "brand",
    title: "Бренд",
    tagline: "Смотрите, кто вас продвигает.",
    imageSeed: "shoppi-brands",
  },
];

const ROLE_TITLE: Record<Role, string> = {
  shopper: "Покупатель",
  creator: "Куратор",
  brand: "Бренд",
};

export default function SignupPage() {
  const [role, setRole] = useState<Role | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [brandDomain, setBrandDomain] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [verifyUrl, setVerifyUrl] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!role) return;
    setError(null);
    setSubmitting(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        role,
        brandDomain: role === "brand" ? brandDomain : undefined,
      }),
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

  // Step 1: pick a role as a visual choice, not a dropdown buried in a form.
  if (!role) {
    return (
      <main className="flex-1 flex flex-col">
        <div className="text-center pt-14 pb-8 px-6">
          <div className="text-[11px] uppercase tracking-widest text-stone mb-3">Shoppi</div>
          <h1 className="font-display text-3xl md:text-4xl mb-2">Кто вы?</h1>
          <p className="text-stone text-sm">
            Уже есть аккаунт?{" "}
            <Link href="/login" className="text-ink underline underline-offset-4">
              Войти
            </Link>
          </p>
        </div>

        <div className="grid md:grid-cols-3 flex-1">
          {ROLE_CARDS.map((card) => (
            <button
              key={card.role}
              onClick={() => setRole(card.role)}
              className="group relative flex flex-col justify-end min-h-[420px] md:min-h-[520px] p-8 text-left overflow-hidden cursor-pointer border-b md:border-b-0 md:border-r border-line last:border-none"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://picsum.photos/seed/${card.imageSeed}/900/1100`}
                alt=""
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black via-black/45 to-black/10" />
              <div className="relative flex flex-col gap-3">
                <h2 className="font-display text-white text-3xl">{card.title}</h2>
                <p className="text-white/80 text-sm max-w-[22ch]">{card.tagline}</p>
                <span className="mt-2 w-fit text-[12px] font-semibold uppercase tracking-wide text-black bg-white px-5 py-3 group-hover:opacity-85 transition-opacity">
                  Зарегистрироваться
                </span>
              </div>
            </button>
          ))}
        </div>
      </main>
    );
  }

  // Step 2: email/password — the role is already decided, so it's shown
  // as a fact with a way back, not another field to fill in.
  return (
    <main className="grid md:grid-cols-2 flex-1">
      <div className="border-b md:border-b-0 md:border-r border-line flex flex-col justify-center px-8 py-14 md:px-16">
        <div className="text-[11px] uppercase tracking-widest text-stone mb-4">
          Shoppi
        </div>
        <h2 className="font-display text-3xl leading-tight max-w-[12ch]">
          Покупай у своих людей, не у алгоритма.
        </h2>
      </div>
      <div className="flex flex-col justify-center gap-6 px-8 py-14 md:px-16">
        <div>
          <button
            onClick={() => setRole(null)}
            className="text-[11px] uppercase tracking-wide text-stone hover:text-ink transition-colors cursor-pointer mb-3"
          >
            ← другая роль
          </button>
          <h1 className="font-display text-2xl mb-1">
            Создать аккаунт: {ROLE_TITLE[role]}
          </h1>
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
              autoFocus
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
          {role === "brand" && (
            <Field label="Домен бренда">
              <input
                type="text"
                required
                placeholder="wildberries.ru"
                className={inputClass}
                value={brandDomain}
                onChange={(e) => setBrandDomain(e.target.value)}
              />
            </Field>
          )}
          <label className="flex items-start gap-2.5 text-[13px] text-stone leading-relaxed cursor-pointer">
            <input
              type="checkbox"
              required
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 shrink-0"
            />
            Согласен(на) с{" "}
            <Link href="/privacy" className="underline underline-offset-4 text-ink">
              политикой конфиденциальности
            </Link>{" "}
            и обработкой данных, описанных в ней.
          </label>
          {error && <p className="text-error text-sm">{error}</p>}
          <button type="submit" disabled={submitting || !consent} className={buttonClass}>
            {submitting ? "Секунду…" : "Зарегистрироваться"}
          </button>
        </form>
      </div>
    </main>
  );
}
