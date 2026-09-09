"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";

export function DashboardHeader({
  label,
  title,
  action,
}: {
  label: string;
  title: string;
  action?: React.ReactNode;
}) {
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);

  async function handleLogout() {
    setLeaving(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

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
        <button
          type="button"
          onClick={handleLogout}
          disabled={leaving}
          className="text-[12px] uppercase tracking-wide text-stone border border-line px-3 py-2 hover:border-ink hover:text-ink transition-colors disabled:opacity-50 cursor-pointer"
        >
          {leaving ? "…" : "Выйти"}
        </button>
      </div>
    </div>
  );
}
