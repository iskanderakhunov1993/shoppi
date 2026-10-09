"use client";

import { useRef, useState } from "react";

/** "Сообщить о проблеме" — a small corner button on every page. Feeds the nightly support agent. */
export function FeedbackWidget() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  function open() {
    setState("idle");
    setError(null);
    dialog.current?.showModal();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setState("sending");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, email, page: location.pathname + location.search }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Не получилось отправить. Попробуйте ещё раз.");
      setState("sent");
      setMessage("");
    } catch (err) {
      setState("idle");
      setError(err instanceof Error ? err.message : "Не получилось отправить. Попробуйте ещё раз.");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={open}
        aria-label="Сообщить о проблеме"
        className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full border border-line bg-card text-ink shadow-sm px-3.5 py-2.5 text-[13px] hover:border-ink transition-colors cursor-pointer"
      >
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M2.5 3.5h11v7h-6l-3 2.5v-2.5h-2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
        <span className="hidden sm:inline">Сообщить о проблеме</span>
      </button>

      <dialog
        ref={dialog}
        className="m-auto w-[min(92vw,440px)] rounded-2xl border border-line bg-card text-ink p-0 backdrop:bg-black/40"
        onClick={(e) => e.target === dialog.current && dialog.current?.close()}
      >
        {state === "sent" ? (
          <div className="p-6 flex flex-col gap-4">
            <h2 className="font-display text-xl">Спасибо, получили</h2>
            <p className="text-stone text-[14px] leading-relaxed">
              Разберёмся и починим. Если оставили email, напишем, когда будет готово.
            </p>
            <button type="button" onClick={() => dialog.current?.close()} className="self-start text-[14px] underline underline-offset-4 cursor-pointer">
              Закрыть
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="p-6 flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
              <h2 className="font-display text-xl">Что пошло не так?</h2>
              <button type="button" onClick={() => dialog.current?.close()} aria-label="Закрыть" className="text-stone hover:text-ink text-xl leading-none cursor-pointer">
                ×
              </button>
            </div>
            <label className="flex flex-col gap-1.5 text-[13px] text-stone">
              Опишите проблему или идею
              <textarea
                required
                minLength={5}
                maxLength={2000}
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Например: не открывается товар на витрине"
                className="rounded-lg border border-line bg-paper text-ink px-3 py-2.5 text-[14px] resize-y outline-none focus:border-ink"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-[13px] text-stone">
              Email, если хотите получить ответ
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-lg border border-line bg-paper text-ink px-3 py-2.5 text-[14px] outline-none focus:border-ink"
              />
            </label>
            <p role="alert" className="text-error text-[13px] empty:hidden">{error}</p>
            <button
              type="submit"
              disabled={state === "sending"}
              className="self-start rounded-full bg-ink text-paper px-5 py-2.5 text-[14px] font-medium hover:opacity-85 disabled:opacity-60 cursor-pointer"
            >
              {state === "sending" ? "Отправляем…" : "Отправить"}
            </button>
          </form>
        )}
      </dialog>
    </>
  );
}
