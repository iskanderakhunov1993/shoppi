"use client";

import { useCallback, useEffect, useState } from "react";
import { inputClass } from "@/app/components/Field";
import { EmptyState } from "@/app/components/EmptyState";
import { CATEGORIES, CATEGORY_LABEL, type Category } from "@/lib/categories";

type Opportunity = {
  id: string;
  title: string;
  description: string;
  compensation?: string;
  category?: Category;
  status: "open" | "closed";
  applicationCount: number;
};

type Application = {
  id: string;
  message?: string;
  status: "pending" | "accepted" | "declined";
  creator?: { id: string; slug: string; displayName: string };
};

const STATUS_LABEL: Record<Application["status"], string> = {
  pending: "Ожидает решения",
  accepted: "Принято",
  declined: "Отклонено",
};

export function BrandOpportunities() {
  const [opportunities, setOpportunities] = useState<Opportunity[] | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [compensation, setCompensation] = useState("");
  const [category, setCategory] = useState<Category>("cosmetics");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [applications, setApplications] = useState<Application[] | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/opportunities/mine");
    if (res.ok) setOpportunities((await res.json()).opportunities);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const res = await fetch("/api/opportunities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, compensation: compensation || undefined, category }),
    });
    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error ?? "Не удалось создать предложение");
      return;
    }

    setTitle("");
    setDescription("");
    setCompensation("");
    await load();
  }

  async function toggleApplications(id: string) {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    setApplications(null);
    const res = await fetch(`/api/opportunities/${id}/applications`);
    if (res.ok) setApplications((await res.json()).applications);
  }

  async function decide(opportunityId: string, appId: string, status: "accepted" | "declined") {
    await fetch(`/api/opportunities/${opportunityId}/applications/${appId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const res = await fetch(`/api/opportunities/${opportunityId}/applications`);
    if (res.ok) setApplications((await res.json()).applications);
    await load();
  }

  return (
    <div className="grid md:grid-cols-[320px_1fr] gap-8">
      <div className="flex flex-col gap-4">
        <h3 className="text-[11px] uppercase tracking-wider text-stone">
          Предложить сотрудничество куратору
        </h3>
        <p className="text-stone text-[13px] leading-relaxed">
          Опубликуйте предложение — кураторы увидят его в своём кабинете и смогут откликнуться.
        </p>
        <form onSubmit={handleCreate} className="flex flex-col gap-3">
          <input
            placeholder="Заголовок предложения"
            required
            className={`${inputClass} border border-line px-3 py-2.5`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            placeholder="Что вы предлагаете и кому это подойдёт"
            required
            rows={4}
            className={`${inputClass} border border-line px-3 py-2.5 resize-y`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <select
            className={`${inputClass} border border-line px-3 py-2.5`}
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABEL[c]}
              </option>
            ))}
          </select>
          <input
            placeholder="Оплата или бартер (необязательно)"
            className={`${inputClass} border border-line px-3 py-2.5`}
            value={compensation}
            onChange={(e) => setCompensation(e.target.value)}
          />
          {error && <p className="text-error text-sm">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="text-[12px] font-semibold uppercase tracking-wide text-paper bg-ink px-4 py-2.5 hover:opacity-80 transition-opacity disabled:opacity-50 cursor-pointer"
          >
            {submitting ? "Публикуем…" : "Опубликовать"}
          </button>
        </form>
      </div>

      <div>
        <h3 className="text-[11px] uppercase tracking-wider text-stone mb-6">Мои предложения</h3>
        {opportunities === null ? (
          <p className="text-stone text-sm">Загрузка…</p>
        ) : opportunities.length === 0 ? (
          <EmptyState title="Вы ещё не публиковали предложения кураторам." />
        ) : (
          <ul className="flex flex-col">
            {opportunities.map((o) => (
              <li key={o.id} className="py-4 border-b border-line last:border-b-0">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <div className="text-[14px] font-medium">{o.title}</div>
                    <span className="text-[10.5px] uppercase tracking-wide text-stone">
                      {o.category && CATEGORY_LABEL[o.category]}
                      {o.status === "closed" && " · закрыто"}
                    </span>
                  </div>
                  <button
                    onClick={() => toggleApplications(o.id)}
                    className="text-[11px] uppercase tracking-wide text-stone hover:text-ink transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Отклики · {o.applicationCount}
                  </button>
                </div>

                {expandedId === o.id && (
                  <div className="mt-3 flex flex-col gap-2">
                    {applications === null ? (
                      <p className="text-stone text-sm">Загрузка…</p>
                    ) : applications.length === 0 ? (
                      <p className="text-stone text-[13px]">Пока никто не откликнулся.</p>
                    ) : (
                      applications.map((a) => (
                        <div key={a.id} className="bg-raise p-3 flex flex-col gap-1.5">
                          <div className="flex justify-between items-center gap-3">
                            <a
                              href={a.creator ? `/${a.creator.slug}` : undefined}
                              className="text-[13px] font-medium hover:underline"
                            >
                              {a.creator?.displayName ?? "Куратор"}
                            </a>
                            {a.status === "pending" ? (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => decide(o.id, a.id, "accepted")}
                                  className="text-[11px] uppercase tracking-wide text-paper bg-ink px-2.5 py-1 cursor-pointer"
                                >
                                  Принять
                                </button>
                                <button
                                  onClick={() => decide(o.id, a.id, "declined")}
                                  className="text-[11px] uppercase tracking-wide border border-line px-2.5 py-1 cursor-pointer"
                                >
                                  Отклонить
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] uppercase tracking-wide text-stone">
                                {STATUS_LABEL[a.status]}
                              </span>
                            )}
                          </div>
                          {a.message && <p className="text-[13px] text-stone">{a.message}</p>}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
