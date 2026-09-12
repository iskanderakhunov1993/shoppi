"use client";

import { useCallback, useEffect, useState } from "react";
import { EmptyState } from "@/app/components/EmptyState";
import { CATEGORY_LABEL, type Category } from "@/lib/categories";

type Opportunity = {
  id: string;
  title: string;
  description: string;
  compensation?: string;
  category?: Category;
  myStatus?: "pending" | "accepted" | "declined" | null;
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Отклик отправлен",
  accepted: "Приняли",
  declined: "Отклонили",
};

export function OpportunitiesFeed() {
  const [opportunities, setOpportunities] = useState<Opportunity[] | null>(null);
  const [messageDrafts, setMessageDrafts] = useState<Record<string, string>>({});
  const [applyingId, setApplyingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/opportunities");
    if (res.ok) setOpportunities((await res.json()).opportunities);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function apply(id: string) {
    setApplyingId(id);
    const res = await fetch(`/api/opportunities/${id}/apply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: messageDrafts[id] ?? "" }),
    });
    setApplyingId(null);
    if (res.ok) await load();
  }

  return (
    <div>
      <h3 className="text-[11px] uppercase tracking-wider text-stone mb-6">Предложения от брендов</h3>
      {opportunities === null ? (
        <p className="text-stone text-sm">Загрузка…</p>
      ) : opportunities.length === 0 ? (
        <EmptyState title="Пока нет открытых предложений — загляните позже." />
      ) : (
        <ul className="flex flex-col gap-6 max-w-xl">
          {opportunities.map((o) => (
            <li key={o.id} className="border border-line p-5 flex flex-col gap-2">
              <div className="flex justify-between items-start gap-3">
                <h4 className="font-display text-lg">{o.title}</h4>
                {o.category && (
                  <span className="text-[10.5px] uppercase tracking-wide text-stone whitespace-nowrap">
                    {CATEGORY_LABEL[o.category]}
                  </span>
                )}
              </div>
              <p className="text-stone text-[13.5px] leading-relaxed">{o.description}</p>
              {o.compensation && (
                <p className="text-[12.5px] text-ink">Оплата/бартер: {o.compensation}</p>
              )}

              {o.myStatus ? (
                <span className="text-[12px] uppercase tracking-wide text-stone mt-2">
                  {STATUS_LABEL[o.myStatus]}
                </span>
              ) : (
                <div className="flex flex-col gap-2 mt-2">
                  <textarea
                    placeholder="Сообщение бренду (необязательно)"
                    rows={2}
                    className="text-[13px] px-3 py-2 border border-line bg-transparent outline-none focus:border-ink transition-colors resize-none"
                    value={messageDrafts[o.id] ?? ""}
                    onChange={(e) => setMessageDrafts((d) => ({ ...d, [o.id]: e.target.value }))}
                  />
                  <button
                    onClick={() => apply(o.id)}
                    disabled={applyingId === o.id}
                    className="w-fit text-[12px] font-semibold uppercase tracking-wide text-paper bg-ink px-4 py-2 hover:opacity-80 transition-opacity disabled:opacity-50 cursor-pointer"
                  >
                    {applyingId === o.id ? "Отправляем…" : "Откликнуться"}
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
