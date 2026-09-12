"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ThemeToggle } from "@/app/components/ThemeToggle";

function AccountMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function handleLogout() {
    setLeaving(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Аккаунт"
        aria-expanded={open}
        className="w-9 h-9 flex items-center justify-center rounded-full border border-line text-stone hover:text-ink hover:border-ink transition-colors cursor-pointer"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="8" cy="5.2" r="2.6" stroke="currentColor" strokeWidth="1.3" />
          <path
            d="M2.6 13.5c.9-2.6 2.9-4 5.4-4s4.5 1.4 5.4 4"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 bg-card border border-line shadow-[0_16px_40px_-16px_rgba(0,0,0,0.3)] py-1.5 z-20 flex flex-col">
          <Link
            href="/dashboard/settings"
            onClick={() => setOpen(false)}
            className="text-[13px] text-ink px-4 py-2.5 hover:bg-raise transition-colors"
          >
            Настройки
          </Link>
          <div className="flex items-center justify-between px-4 py-2.5 text-[13px] text-ink">
            <span>Тема</span>
            <ThemeToggle className="text-stone hover:text-ink" />
          </div>
          <button
            type="button"
            onClick={handleLogout}
            disabled={leaving}
            className="text-[13px] text-left text-ink px-4 py-2.5 hover:bg-raise transition-colors disabled:opacity-50 cursor-pointer"
          >
            {leaving ? "Выходим…" : "Выйти"}
          </button>
        </div>
      )}
    </div>
  );
}

export function DashboardHeader({
  label,
  title,
  action,
}: {
  label: string;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap justify-between items-center gap-4 px-8 py-6 border-b border-line">
      <div>
        <div className="text-[11px] uppercase tracking-wider text-stone">{label}</div>
        <Link href="/dashboard" className="font-display text-xl hover:opacity-80 transition-opacity">
          {title}
        </Link>
      </div>
      <div className="flex items-center gap-3">
        {action}
        <AccountMenu />
      </div>
    </div>
  );
}
