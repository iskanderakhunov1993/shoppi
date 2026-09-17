"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Circle = { id: string; name: string; members: { id: string }[] };

/**
 * Lets a shopper drop this creator straight into one of their circles
 * without leaving the storefront — previously the only way was
 * dashboard → Круги → expand → pick from a dropdown. Also follows the
 * creator if not already followed, since a circle is a group of
 * people you follow, not a separate relationship.
 */
export function AddToCircleButton({ creatorId }: { creatorId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [circles, setCircles] = useState<Circle[] | null>(null);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [addedId, setAddedId] = useState<string | null>(null);

  useEffect(() => {
    if (!open || circles !== null) return;
    fetch("/api/circles")
      .then((res) => (res.ok ? res.json() : { circles: [] }))
      .then((data) => setCircles(data.circles ?? []))
      .catch(() => setCircles([]));
  }, [open, circles]);

  async function addTo(circleId: string) {
    await fetch("/api/follows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creatorId }),
    }).catch(() => {});
    const res = await fetch(`/api/circles/${circleId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creatorId }),
    });
    if (res.ok) {
      setAddedId(circleId);
      router.refresh();
    }
  }

  async function createAndAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    const res = await fetch("/api/circles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    const circle = await res.json().catch(() => null);
    setCreating(false);
    if (res.ok && circle?.id) {
      setNewName("");
      setCircles((prev) => [...(prev ?? []), { ...circle, members: [] }]);
      await addTo(circle.id);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-[12px] uppercase tracking-wide border border-line px-4 py-3 hover:border-ink hover:text-ink transition-colors cursor-pointer"
      >
        В круг
      </button>

      {open && (
        <div className="absolute z-20 top-full mt-2 left-1/2 -translate-x-1/2 w-64 bg-card border border-line shadow-[0_16px_40px_-16px_rgba(0,0,0,0.3)] p-3 flex flex-col gap-1 text-left">
          {circles === null ? (
            <p className="text-stone text-[12.5px] px-1 py-1">Загрузка…</p>
          ) : circles.length === 0 ? (
            <p className="text-stone text-[12.5px] px-1 py-1">Пока нет ни одного круга.</p>
          ) : (
            circles.map((c) => {
              const already = c.members.some((m) => m.id === creatorId) || addedId === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  disabled={already}
                  onClick={() => addTo(c.id)}
                  className="text-left text-[13px] px-2 py-2 hover:bg-raise transition-colors cursor-pointer disabled:cursor-default disabled:text-stone flex items-center justify-between"
                >
                  {c.name}
                  {already && <span className="text-[11px]">добавлено</span>}
                </button>
              );
            })
          )}
          <form onSubmit={createAndAdd} className="flex gap-1.5 mt-1.5 pt-1.5 border-t border-line">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Новый круг"
              className="flex-1 min-w-0 text-[12.5px] px-2 py-1.5 border border-line bg-transparent outline-none focus:border-ink"
            />
            <button
              type="submit"
              disabled={creating || !newName.trim()}
              className="text-[11px] uppercase tracking-wide text-paper bg-ink px-2.5 disabled:opacity-40 cursor-pointer"
            >
              +
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
