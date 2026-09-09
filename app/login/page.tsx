"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Field, inputClass, buttonClass } from "@/app/components/Field";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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

  return (
    <main className="flex-1 flex items-center justify-center px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-6">
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
    </main>
  );
}
