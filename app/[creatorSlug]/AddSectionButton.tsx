"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Owner-only "+ раздел" at the end of the tab row: name it, press Enter. */
export function AddSectionButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || busy) return;
    setBusy(true);
    const res = await fetch("/api/sections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    setBusy(false);
    if (res.ok) {
      setName("");
      setOpen(false);
      router.refresh();
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex-none text-[13px] px-3 py-1.5 rounded-full whitespace-nowrap border border-dashed border-line text-stone hover:text-ink hover:border-ink transition-colors cursor-pointer"
      >
        + Раздел
      </button>
    );
  }

  return (
    <form onSubmit={create} className="flex-none">
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => !name && setOpen(false)}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        placeholder="Название раздела"
        maxLength={60}
        disabled={busy}
        className="w-40 text-[13px] py-1 border-b border-ink bg-transparent outline-none"
      />
    </form>
  );
}
