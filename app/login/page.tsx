"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Field, inputClass, buttonClass } from "@/app/components/Field";

type Role = "shopper" | "creator" | "brand";

const DEMO_LABEL: Record<Role, string> = {
  shopper: "Демо: Шоппер",
  creator: "Демо: Куратор",
  brand: "Демо: Бренд",
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [quickLoginRole, setQuickLoginRole] = useState<Role | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error ?? "Не удалось войти");
      return;
    }

    router.push("/dashboard");
  }

  async function handleQuickLogin(role: Role) {
    setError(null);
    setQuickLoginRole(role);

    const res = await fetch("/api/dev/quick-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    setQuickLoginRole(null);

    if (!res.ok) {
      setError("Не удалось войти в демо-аккаунт");
      return;
    }
    router.push("/dashboard");
  }

  return (
    <main className="flex-1 flex items-center justify-center px-6">
      <div className="w-full max-w-sm flex flex-col gap-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div>
            <h1 className="font-display text-2xl mb-1">Вход</h1>
            <p className="text-stone text-sm">
              Нет аккаунта?{" "}
              <Link href="/signup" className="text-ink underline underline-offset-4">
                Зарегистрироваться
              </Link>
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
          <Field label="Пароль">
            <input
              type="password"
              required
              className={inputClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          {error && <p className="text-error text-sm">{error}</p>}
          <button type="submit" disabled={submitting} className={buttonClass}>
            {submitting ? "Секунду…" : "Войти"}
          </button>
        </form>

        <div className="flex flex-col gap-3 pt-6 border-t border-line">
          <span className="text-[11px] uppercase tracking-wider text-stone">
            Быстрый вход для демо
          </span>
          <div className="flex gap-2">
            {(Object.keys(DEMO_LABEL) as Role[]).map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => handleQuickLogin(role)}
                disabled={quickLoginRole !== null}
                className="flex-1 text-[12px] border border-line px-3 py-2.5 hover:border-ink transition-colors disabled:opacity-50"
              >
                {quickLoginRole === role ? "…" : DEMO_LABEL[role]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
