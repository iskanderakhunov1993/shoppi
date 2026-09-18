"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Field, inputClass, buttonClass } from "@/app/components/Field";
import { BRANDS_ENABLED } from "@/lib/featureFlags";

type Role = "shopper" | "creator" | "brand";

const ROLE_TABS: { role: Role; label: string; tagline: string }[] = [
  { role: "shopper", label: "Покупатель", tagline: "Покупай у своих людей, не у алгоритма." },
  { role: "creator", label: "Куратор", tagline: "Твой вкус — теперь витрина." },
  { role: "brand", label: "Бренд", tagline: "Смотрите, кто вас продвигает." },
];

function roleFromParam(value: string | null): Role {
  return value === "creator" || value === "brand" ? value : "shopper";
}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupForm />
    </Suspense>
  );
}

function SignupForm() {
  const searchParams = useSearchParams();
  const [role, setRole] = useState<Role>(() => roleFromParam(searchParams.get("role")));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [brandDomain, setBrandDomain] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [verifyUrl, setVerifyUrl] = useState<string | null>(null);
  const [emailed, setEmailed] = useState(false);
  const [consent, setConsent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const [resendNote, setResendNote] = useState<string | null>(null);

  const tabs = ROLE_TABS.filter((t) => BRANDS_ENABLED || t.role !== "brand");
  const activeTagline = tabs.find((t) => t.role === role)?.tagline;

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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

    setEmailed(Boolean(data.emailed));
    // Falls back to the link directly only when no email provider is
    // configured (RESEND_API_KEY missing) — real sends never expose it.
    setVerifyUrl(data.verificationToken ? `/verify?token=${data.verificationToken}` : null);
    if (data.emailed) setResendCooldown(30);
  }

  async function handleResend() {
    setResending(true);
    setResendNote(null);
    const res = await fetch("/api/auth/resend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setResending(false);
    setResendCooldown(30);
    setResendNote(
      data.emailed ? "Письмо отправлено ещё раз." : "Не смогли отправить письмо — попробуйте позже."
    );
  }

  if (emailed || verifyUrl) {
    return (
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-md text-center flex flex-col gap-4">
          <h1 className="font-display text-2xl">Проверьте почту</h1>
          {emailed ? (
            <p className="text-stone text-sm">
              Мы отправили письмо со ссылкой подтверждения на <strong>{email}</strong>.
              Если не видите его через пару минут — проверьте папку "Спам".
            </p>
          ) : (
            <p className="text-stone text-sm">
              Мы бы отправили письмо со ссылкой подтверждения — в MVP без настроенной
              почты её можно открыть прямо здесь.
            </p>
          )}
          {verifyUrl && (
            <a href={verifyUrl} className="underline underline-offset-4 text-sm">
              Подтвердить email
            </a>
          )}
          {emailed && (
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={handleResend}
                disabled={resending || resendCooldown > 0}
                className="text-[12px] uppercase tracking-wide text-stone underline underline-offset-4 disabled:no-underline disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              >
                {resending
                  ? "Отправляем…"
                  : resendCooldown > 0
                    ? `Отправить снова через ${resendCooldown}с`
                    : "Письмо не пришло? Отправить снова"}
              </button>
              {resendNote && <p className="text-stone text-[12px]">{resendNote}</p>}
            </div>
          )}
        </div>
      </main>
    );
  }

  // One continuous form — the role is a segmented control at the top,
  // not a separate screen. Switching roles never re-renders the whole
  // page, so email/password typed so far never gets lost either.
  return (
    <main className="flex-1 flex items-center justify-center px-6 py-14">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-stone mb-3">Shoppi</div>
          <h1 className="font-display text-2xl mb-1">Создать аккаунт</h1>
          <p className="text-stone text-sm">
            Уже есть аккаунт?{" "}
            <Link href="/login" className="text-ink underline underline-offset-4">
              Войти
            </Link>
          </p>
        </div>

        <div>
          <div className={`grid gap-px bg-line border border-line ${tabs.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
            {tabs.map((t) => (
              <button
                key={t.role}
                type="button"
                onClick={() => setRole(t.role)}
                aria-pressed={role === t.role}
                className={`text-[13px] py-3 transition-colors cursor-pointer ${
                  role === t.role ? "bg-ink text-paper font-medium" : "bg-paper text-stone hover:text-ink"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          {activeTagline && <p className="text-stone text-[12.5px] mt-2.5">{activeTagline}</p>}
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
