"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { buttonClass } from "@/app/components/Field";

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <main className="flex-1 flex items-center justify-center px-6">
          <p className="text-stone text-sm">Проверяем…</p>
        </main>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}

function VerifyContent() {
  const params = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState<"pending" | "ok" | "error">("pending");
  const requested = useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }
    // Guard against React StrictMode's double-invoke in dev: the
    // verification token is single-use, so a second request would
    // otherwise see it already consumed and report a false error.
    if (requested.current) return;
    requested.current = true;

    fetch(`/api/auth/verify?token=${encodeURIComponent(token)}`)
      .then((res) => setStatus(res.ok ? "ok" : "error"))
      .catch(() => setStatus("error"));
  }, [token]);

  return (
    <main className="flex-1 flex items-center justify-center px-6">
      <div className="max-w-md text-center flex flex-col gap-4">
        {status === "pending" && <p className="text-stone text-sm">Проверяем…</p>}
        {status === "ok" && (
          <>
            <h1 className="font-display text-2xl">Email подтверждён</h1>
            <Link href="/login" className={`${buttonClass} inline-block w-fit mx-auto`}>
              Войти
            </Link>
          </>
        )}
        {status === "error" && (
          <>
            <h1 className="font-display text-2xl">Ссылка недействительна</h1>
            <p className="text-stone text-sm">
              Токен неверный или уже использован.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
