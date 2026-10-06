"use client";

import { useCallback, useEffect, useState } from "react";
import { placeholderAvatar } from "@/lib/avatar";
import { CATEGORY_LABEL, type Category } from "@/lib/categories";

type Member = { id: string; slug: string; displayName: string; avatarUrl?: string };
type CircleSummary = { id: string; name: string; createdAt: string; members: Member[]; previewImages?: string[] };
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

const SUGGESTIONS = ["Уход", "Макияж", "На дачу", "Подарки"];
const PLURAL = new Intl.PluralRules("ru");
const creatorsWord = (n: number) => {
  const f = PLURAL.select(n);
  return f === "one" ? "блогер" : f === "few" ? "блогера" : "блогеров";
};

export function MyCircles({
  availableCreators,
  onChange,
  onOpenCreators,
}: {
  availableCreators: Member[];
  onChange?: () => void;
  onOpenCreators?: () => void;
}) {
  const [circles, setCircles] = useState<CircleSummary[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [detail, setDetail] = useState<CircleDetail | null>(null);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [detailFailed, setDetailFailed] = useState(false);

  // Runs a request; shows a message instead of failing silently.
  async function run(req: () => Promise<Response>, fail: string): Promise<boolean> {
    setError(null);
    try {
      const res = await req();
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? fail);
        return false;
      }
      return true;
    } catch {
      setError("Нет соединения. Попробуйте ещё раз.");
      return false;
    }
  }

  const loadCircles = useCallback(async () => {
    try {
      const res = await fetch("/api/circles");
      if (!res.ok) throw new Error();
      setCircles((await res.json()).circles);
    } catch {
      setCircles([]);
      setError("Не удалось загрузить круги. Обновите страницу.");
    }
  }, []);

  useEffect(() => {
    loadCircles();
  }, [loadCircles]);

  const loadDetail = useCallback(async (id: string) => {
    setDetailFailed(false);
    try {
      const res = await fetch(`/api/circles/${id}`);
      if (!res.ok) throw new Error();
      setDetail(await res.json());
    } catch {
      setDetail(null);
      setDetailFailed(true);
    }
  }, []);

  async function createCircle(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    if (circles?.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      setError("Круг с таким названием уже есть.");
      return;
    }
    setCreating(true);
    const ok = await run(
      () =>
        fetch("/api/circles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        }),
      "Не удалось создать круг"
    );
    setCreating(false);
    if (ok) {
      setNewName("");
      await loadCircles();
      onChange?.();
    }
  }

  async function deleteCircle(id: string) {
    setConfirmDeleteId(null);
    const ok = await run(() => fetch(`/api/circles/${id}`, { method: "DELETE" }), "Не удалось удалить круг");
    if (!ok) return;
    if (openId === id) {
      setOpenId(null);
      setDetail(null);
    }
    await loadCircles();
    onChange?.();
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

  async function toggleMember(circleId: string, creatorId: string, isMember: boolean) {
    const ok = await run(
      () =>
        isMember
          ? fetch(`/api/circles/${circleId}/members?creatorId=${encodeURIComponent(creatorId)}`, { method: "DELETE" })
          : fetch(`/api/circles/${circleId}/members`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ creatorId }),
            }),
      "Не удалось изменить состав круга"
    );
    if (!ok) return;
    await loadDetail(circleId);
    await loadCircles();
  }

  return (
    <div className="flex flex-col gap-8">
      <form onSubmit={createCircle} className="flex gap-2 max-w-md">
        <input
          value={newName}
          onChange={(e) => {
            setNewName(e.target.value);
            setError(null);
          }}
          aria-label="Название круга"
          maxLength={40}
          placeholder="Название круга"
          className="flex-1 min-w-0 border border-line px-3 py-2.5 text-[13.5px] bg-transparent outline-none focus:border-ink transition-colors"
        />
        <button
          type="submit"
          disabled={creating || !newName.trim()}
          className="text-[12px] font-semibold uppercase tracking-wide text-paper bg-ink border border-ink px-4 py-2.5 hover:opacity-80 transition-opacity disabled:bg-transparent disabled:text-stone disabled:border-line disabled:hover:opacity-100 disabled:cursor-not-allowed cursor-pointer"
        >
          {creating ? "Создаю…" : "Создать"}
        </button>
      </form>

      <p role="alert" className="text-error text-sm -mt-5 empty:hidden">{error}</p>

      {availableCreators.length < 2 && (
        <p className="text-stone text-[13px] -mt-4 max-w-md">
          Круги пригодятся, когда вы подпишетесь на нескольких блогеров.{" "}
          <a href="/curators" className="underline underline-offset-4 hover:text-ink transition-colors">
            Найти блогеров
          </a>
        </p>
      )}

      {circles === null ? (
        <p role="status" className="text-stone text-sm">Загрузка…</p>
      ) : circles.length === 0 ? (
        <div className="flex flex-col gap-4 max-w-md">
          <p className="font-display italic text-stone text-lg">
            Круг собирает нескольких блогеров в одну ленту по теме.
          </p>
          <div className="flex flex-wrap gap-2" aria-label="Подсказки названий">
            {SUGGESTIONS.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setNewName(name)}
                className="text-[13px] px-3.5 py-2 border border-line hover:border-ink transition-colors cursor-pointer"
              >
                {name}
              </button>
            ))}
          </div>
          {onOpenCreators && availableCreators.length > 0 && (
            <button
              type="button"
              onClick={onOpenCreators}
              className="text-[12px] uppercase tracking-wide text-stone hover:text-ink transition-colors cursor-pointer w-fit"
            >
              Мои блогеры →
            </button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {circles.map((circle) => (
            <div key={circle.id} className="border border-line">
              <button
                type="button"
                onClick={() => toggleOpen(circle.id)}
                aria-expanded={openId === circle.id}
                className="w-full text-left cursor-pointer group"
              >
                <div className="grid grid-cols-2 gap-px bg-line aspect-[2/1]">
                  {(circle.previewImages?.length ? circle.previewImages : [null, null, null, null])
                    .slice(0, 4)
                    .map((src, i) =>
                      src ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={i} src={src} alt="" className="w-full h-full object-cover bg-raise" />
                      ) : (
                        <div key={i} className="w-full h-full bg-raise" />
                      )
                    )}
                </div>
                <div className="flex items-center justify-between gap-3 px-4 py-3">
                  <span className="text-[13.5px] font-medium truncate group-hover:underline">{circle.name}</span>
                  <span className="text-[11.5px] text-stone flex-none">
                    {circle.members.length} {creatorsWord(circle.members.length)}
                  </span>
                </div>
              </button>
              <div className="px-4 pb-2 flex justify-end items-center gap-3 min-h-9">
                {confirmDeleteId === circle.id ? (
                  <>
                    <span className="text-[12px] text-stone">Удалить круг? Блогеры останутся.</span>
                    <button
                      type="button"
                      onClick={() => deleteCircle(circle.id)}
                      className="text-[11px] uppercase tracking-wide text-error px-2 py-2 cursor-pointer"
                    >
                      Да
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="text-[11px] uppercase tracking-wide text-stone hover:text-ink px-2 py-2 cursor-pointer"
                    >
                      Нет
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(circle.id)}
                    className="text-[11px] uppercase tracking-wide text-stone hover:text-error transition-colors cursor-pointer px-2 py-2"
                  >
                    Удалить
                  </button>
                )}
              </div>

              {openId === circle.id && (
                <div className="border-t border-line px-4 py-4 flex flex-col gap-5">
                  {detail === null ? (
                    <p role="status" className="text-stone text-sm">
                      {detailFailed ? "Не удалось загрузить круг." : "Загрузка…"}
                    </p>
                  ) : (
                    <>
                      <div>
                        <h4 className="text-[11px] uppercase tracking-wider text-stone mb-3">
                          Состав круга
                        </h4>
                        {availableCreators.length === 0 ? (
                          <p className="text-stone text-[13px]">Сначала подпишитесь на блогеров.</p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {availableCreators.map((c) => {
                              const isMember = detail.members.some((m) => m.id === c.id);
                              return (
                                <button
                                  key={c.id}
                                  type="button"
                                  aria-pressed={isMember}
                                  onClick={() => toggleMember(circle.id, c.id, isMember)}
                                  className={`flex items-center gap-2 border pl-1.5 pr-3 py-1.5 text-[12.5px] transition-colors cursor-pointer ${
                                    isMember ? "border-ink" : "border-line text-stone hover:border-ink hover:text-ink"
                                  }`}
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={c.avatarUrl || placeholderAvatar(c.slug)}
                                    alt=""
                                    className="w-6 h-6 rounded-full object-cover bg-raise"
                                  />
                                  {isMember ? "✓ " : ""}
                                  {c.displayName}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div>
                        <h4 className="text-[11px] uppercase tracking-wider text-stone mb-3">
                          Рекомендации этого круга
                        </h4>
                        {detail.feed.length === 0 ? (
                          <p className="text-stone text-[13px]">
                            Пока пусто. Добавьте блогера с товарами на витрине.
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
                                {link.price ? (
                                  <span className="text-sm text-stone">
                                    {link.price.toLocaleString("ru-RU")} ₽
                                  </span>
                                ) : null}
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
