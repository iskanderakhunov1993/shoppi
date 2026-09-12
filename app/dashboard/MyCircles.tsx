"use client";

import { useCallback, useEffect, useState } from "react";
import { placeholderAvatar } from "@/lib/avatar";
import { CATEGORY_LABEL, type Category } from "@/lib/categories";

type Member = { id: string; slug: string; displayName: string; avatarUrl?: string };
type CircleSummary = { id: string; name: string; createdAt: string; members: Member[] };
type FeedLink = {
  id: string;
  title: string;
  category: Category;
  price?: number;
  wrappedUrl: string;
  creatorName?: string;
  creatorSlug?: string;
};
type CircleDetail = CircleSummary & { feed: FeedLink[] };

export function MyCircles({ availableCreators }: { availableCreators: Member[] }) {
  const [circles, setCircles] = useState<CircleSummary[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [detail, setDetail] = useState<CircleDetail | null>(null);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  const loadCircles = useCallback(async () => {
    const res = await fetch("/api/circles");
    setCircles(res.ok ? (await res.json()).circles : []);
  }, []);

  useEffect(() => {
    loadCircles();
  }, [loadCircles]);

  const loadDetail = useCallback(async (id: string) => {
    const res = await fetch(`/api/circles/${id}`);
    setDetail(res.ok ? await res.json() : null);
  }, []);

  async function createCircle(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    const res = await fetch("/api/circles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    setCreating(false);
    if (res.ok) {
      setNewName("");
      await loadCircles();
    }
  }

  async function deleteCircle(id: string) {
    const confirmed = window.confirm("Удалить этот круг? Кураторов и находки в нём это не затронет.");
    if (!confirmed) return;
    await fetch(`/api/circles/${id}`, { method: "DELETE" });
    if (openId === id) {
      setOpenId(null);
      setDetail(null);
    }
    await loadCircles();
  }

  async function toggleOpen(id: string) {
    if (openId === id) {
      setOpenId(null);
      setDetail(null);
      return;
    }
    setOpenId(id);
    setDetail(null);
    await loadDetail(id);
  }

  async function addMember(circleId: string, creatorId: string) {
    if (!creatorId) return;
    await fetch(`/api/circles/${circleId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creatorId }),
    });
    await loadDetail(circleId);
    await loadCircles();
  }

  async function removeMember(circleId: string, creatorId: string) {
    await fetch(`/api/circles/${circleId}/members?creatorId=${encodeURIComponent(creatorId)}`, {
      method: "DELETE",
    });
    await loadDetail(circleId);
    await loadCircles();
  }

  return (
    <div className="flex flex-col gap-8">
      <form onSubmit={createCircle} className="flex gap-2 max-w-md">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Название круга, например «Уход за кожей»"
          className="flex-1 min-w-0 border border-line px-3 py-2.5 text-[13.5px] bg-transparent outline-none focus:border-ink transition-colors"
        />
        <button
          type="submit"
          disabled={creating || !newName.trim()}
          className="text-[12px] font-semibold uppercase tracking-wide text-paper bg-ink px-4 py-2.5 hover:opacity-80 transition-opacity disabled:opacity-50 cursor-pointer"
        >
          Создать
        </button>
      </form>

      {circles === null ? (
        <p className="text-stone text-sm">Загрузка…</p>
      ) : circles.length === 0 ? (
        <p className="font-display italic text-stone">
          Пока нет ни одного круга — создайте первый, например по категории или поводу.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {circles.map((circle) => (
            <div key={circle.id} className="border border-line">
              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <button
                  type="button"
                  onClick={() => toggleOpen(circle.id)}
                  className="flex items-center gap-3 flex-1 min-w-0 text-left cursor-pointer"
                >
                  <div className="flex -space-x-2 flex-none">
                    {circle.members.slice(0, 4).map((m) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={m.id}
                        src={m.avatarUrl || placeholderAvatar(m.slug)}
                        alt=""
                        className="w-7 h-7 rounded-full object-cover border-2 border-paper bg-raise"
                      />
                    ))}
                    {circle.members.length === 0 && (
                      <div className="w-7 h-7 rounded-full border border-dashed border-line" />
                    )}
                  </div>
                  <span className="text-[13.5px] font-medium truncate">{circle.name}</span>
                  <span className="text-[11.5px] text-stone flex-none">
                    {circle.members.length} {circle.members.length === 1 ? "куратор" : "кураторов"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => deleteCircle(circle.id)}
                  className="text-[11px] uppercase tracking-wide text-stone hover:text-error transition-colors cursor-pointer flex-none"
                >
                  Удалить
                </button>
              </div>

              {openId === circle.id && (
                <div className="border-t border-line px-4 py-4 flex flex-col gap-5">
                  {detail === null ? (
                    <p className="text-stone text-sm">Загрузка…</p>
                  ) : (
                    <>
                      <div className="flex flex-wrap gap-2">
                        {detail.members.map((m) => (
                          <div
                            key={m.id}
                            className="flex items-center gap-2 border border-line pl-1.5 pr-2.5 py-1.5"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={m.avatarUrl || placeholderAvatar(m.slug)}
                              alt=""
                              className="w-6 h-6 rounded-full object-cover bg-raise"
                            />
                            <a href={`/${m.slug}`} className="text-[12.5px] hover:underline">
                              {m.displayName}
                            </a>
                            <button
                              onClick={() => removeMember(circle.id, m.id)}
                              aria-label={`Убрать ${m.displayName} из круга`}
                              className="text-stone hover:text-error transition-colors cursor-pointer text-[13px] leading-none"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        <select
                          value=""
                          onChange={(e) => addMember(circle.id, e.target.value)}
                          className="text-[12.5px] border border-dashed border-line px-2 py-1.5 bg-transparent text-stone cursor-pointer"
                        >
                          <option value="">+ Добавить куратора</option>
                          {availableCreators
                            .filter((c) => !detail.members.some((m) => m.id === c.id))
                            .map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.displayName}
                              </option>
                            ))}
                        </select>
                      </div>

                      <div>
                        <h4 className="text-[11px] uppercase tracking-wider text-stone mb-3">
                          Находки этого круга
                        </h4>
                        {detail.feed.length === 0 ? (
                          <p className="text-stone text-[13px]">
                            Пока пусто — добавьте куратора с товарами на витрине.
                          </p>
                        ) : (
                          <ul className="flex flex-col">
                            {detail.feed.map((link) => (
                              <li
                                key={link.id}
                                className="grid grid-cols-[1fr_auto] items-center gap-4 py-3 border-b border-line last:border-b-0"
                              >
                                <div>
                                  <a href={link.wrappedUrl} className="text-[13px] font-medium hover:underline">
                                    {link.title}
                                  </a>
                                  <span className="block text-[10.5px] uppercase tracking-wide text-stone mt-0.5">
                                    {CATEGORY_LABEL[link.category]}
                                    {link.creatorSlug && (
                                      <>
                                        {" "}
                                        · от{" "}
                                        <a href={`/${link.creatorSlug}`} className="hover:underline">
                                          {link.creatorName}
                                        </a>
                                      </>
                                    )}
                                  </span>
                                </div>
                                {link.price && (
                                  <span className="text-sm text-stone">
                                    {link.price.toLocaleString("ru-RU")} ₽
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
