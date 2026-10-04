"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { DashboardHeader } from "./DashboardHeader";
import { EmptyState } from "@/app/components/EmptyState";
import { OnboardingModal } from "./OnboardingModal";
import { CircleOnboarding } from "./CircleOnboarding";
import { MyCircles } from "./MyCircles";
import { InterestsEditor } from "./InterestsEditor";
import { placeholderAvatar } from "@/lib/avatar";
import { CATEGORY_LABEL, type Category } from "@/lib/categories";

type FavoriteLink = {
  id: string;
  title: string;
  category: Category;
  price?: number;
  wrappedUrl: string;
};

type FollowedCreator = {
  id: string;
  slug: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
};

type FeedLink = FavoriteLink & { wrappedUrl: string; clicks: number; creatorName?: string; creatorSlug?: string; imageUrl?: string };

type Tab = "overview" | "saved" | "circle" | "circles";
const VALID_TABS: Tab[] = ["overview", "saved", "circle", "circles"];

const TAB_HINT: Record<Tab, string> = {
  overview: "Ваши подписки, круги и сохранённые товары в одном месте.",
  saved: "Товары, сохранённые с любой витрины. Эта же подборка доступна по ссылке «Мой вишлист» вверху.",
  circle: "Те, на кого вы подписаны напрямую: их находки собираются в ленте ниже.",
  circles: "Группируйте креаторов из «Мои креаторы» по темам, например «Уход» или «На дачу».",
};

export function ShopperDashboard({ me }: { me: { displayName: string; slug?: string; interests?: Category[]; wishlistPublic?: boolean } }) {
  const [tab, setTabState] = useState<Tab>("overview");
  const [interests, setInterests] = useState<Category[]>(me.interests ?? []);

  // Keeps the URL shareable/bookmarkable per tab (e.g. a link straight
  // to "Круги"), and restores the tab on load instead of always
  // resetting to the overview.
  const setTab = useCallback((next: Tab) => {
    setTabState(next);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", next);
    window.history.replaceState(null, "", url);
  }, []);

  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("tab");
    if (fromUrl && VALID_TABS.includes(fromUrl as Tab)) setTabState(fromUrl as Tab);
  }, []);

  const [favorites, setFavorites] = useState<FavoriteLink[] | null>(null);
  const [circle, setCircle] = useState<{ creators: FollowedCreator[]; feed: FeedLink[] } | null>(null);
  const [circleCount, setCircleCount] = useState<number | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [origin, setOrigin] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => setOrigin(window.location.origin), []);

  // Opened from the "X/2 выполнено" badge in the global nav, which
  // links here with this query param instead of duplicating the modal.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("onboarding")) {
      setShowOnboardingModal(true);
    }
  }, []);

  // A failed load used to fall back to empty data and read as "Пока пусто".
  const [loadFailed, setLoadFailed] = useState(false);
  const getJson = useCallback(async (url: string) => {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error();
      return await res.json();
    } catch {
      setLoadFailed(true);
      return null;
    }
  }, []);

  const loadFavorites = useCallback(async () => {
    const data = await getJson("/api/favorites");
    setFavorites(data?.favorites ?? []);
  }, [getJson]);

  const loadCircle = useCallback(async () => {
    const data = await getJson("/api/follows");
    setCircle(data ?? { creators: [], feed: [] });
  }, [getJson]);

  const loadCircleCount = useCallback(async () => {
    const data = await getJson("/api/circles");
    setCircleCount((data?.circles ?? []).length);
  }, [getJson]);

  function retryLoad() {
    setLoadFailed(false);
    loadFavorites();
    loadCircle();
    loadCircleCount();
  }

  useEffect(() => {
    loadFavorites();
    loadCircle();
    loadCircleCount();
  }, [loadFavorites, loadCircle, loadCircleCount]);

  // Auto-surface the checklist on every visit for anyone who hasn't
  // finished it yet, including after logging back in — closing it
  // (×) only dismisses the current view, not future ones, so it
  // keeps nudging until both steps are actually done. Also closes it
  // on its own the moment the last step completes, so it never lingers
  // showing a fully checked-off list.
  useEffect(() => {
    if (favorites === null || circle === null) return;
    const allDone = favorites.length > 0 && circle.creators.length > 0;
    setShowOnboardingModal(!allDone);
  }, [favorites, circle]);

  function dismissOnboardingModal() {
    setShowOnboardingModal(false);
  }

  async function remove(linkId: string) {
    await fetch(`/api/favorites?linkId=${encodeURIComponent(linkId)}`, { method: "DELETE" });
    await loadFavorites();
  }

  // Unfollow is held back for a few seconds so it can be undone: the
  // creator disappears right away, the DELETE goes out when the toast
  // expires (or immediately if the page is being left).
  const [pendingUnfollow, setPendingUnfollow] = useState<FollowedCreator | null>(null);
  const unfollowTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const commitUnfollow = useCallback(
    async (creatorId: string) => {
      try {
        await fetch(`/api/follows?creatorId=${encodeURIComponent(creatorId)}`, { method: "DELETE", keepalive: true });
      } finally {
        await loadCircle();
      }
    },
    [loadCircle]
  );

  function unfollow(creator: FollowedCreator) {
    if (pendingUnfollow && unfollowTimer.current) {
      clearTimeout(unfollowTimer.current);
      commitUnfollow(pendingUnfollow.id);
    }
    setPendingUnfollow(creator);
    unfollowTimer.current = setTimeout(() => {
      setPendingUnfollow(null);
      commitUnfollow(creator.id);
    }, 5000);
  }

  function undoUnfollow() {
    if (unfollowTimer.current) clearTimeout(unfollowTimer.current);
    setPendingUnfollow(null);
  }

  useEffect(() => {
    if (!pendingUnfollow) return;
    const flush = () => {
      fetch(`/api/follows?creatorId=${encodeURIComponent(pendingUnfollow.id)}`, { method: "DELETE", keepalive: true });
    };
    window.addEventListener("pagehide", flush);
    return () => window.removeEventListener("pagehide", flush);
  }, [pendingUnfollow]);

  const hasFavorite = Boolean(favorites && favorites.length > 0);
  const hasFollow = Boolean(circle && circle.creators.length > 0);
  // Circles group multiple creators by theme — meaningless with just
  // one followed creator, so it stays a discoverable feature rather
  // than a gate on finishing onboarding.
  const onboardingDone = hasFavorite && hasFollow;

  return (
    <main className="flex-1 flex flex-col">
      <DashboardHeader
        label="Кабинет покупателя"
        title={me.displayName}
        action={
          <div className="flex items-center gap-2">
            {!onboardingDone && (
              <button
                type="button"
                onClick={() => setShowOnboardingModal(true)}
                className="text-[12px] uppercase tracking-wide text-stone border border-line px-3 py-2 hover:border-ink hover:text-ink transition-colors cursor-pointer"
              >
                Начало работы · {[hasFavorite, hasFollow].filter(Boolean).length}/2
              </button>
            )}
            <Link
              href="/curators"
              className="text-[12px] uppercase tracking-wide text-stone border border-line px-3 py-2 hover:border-ink hover:text-ink transition-colors"
            >
              Все креаторы
            </Link>
            {me.slug && favorites && favorites.length > 0 && (
              <>
                <a
                  href={`/wishlist/${me.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[12px] uppercase tracking-wide text-stone border border-line px-3 py-2 hover:border-ink hover:text-ink transition-colors"
                >
                  Мой вишлист
                </a>
                <button
                  type="button"
                  onClick={async () => {
                    // Copying the link is the act of sharing it.
                    if (!me.wishlistPublic) {
                      await fetch("/api/me", {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ wishlistPublic: true }),
                      }).catch(() => {});
                    }
                    navigator.clipboard.writeText(`${origin}/wishlist/${me.slug}`).catch(() => {});
                    setLinkCopied(true);
                    setTimeout(() => setLinkCopied(false), 1800);
                  }}
                  aria-label="Скопировать ссылку на вишлист (откроет доступ по ссылке)"
                  title={`${origin ? origin.replace(/^https?:\/\//, "") : ""}/wishlist/${me.slug}`}
                  className="w-9 h-9 flex items-center justify-center border border-line text-stone hover:text-ink hover:border-ink transition-colors cursor-pointer"
                >
                  {linkCopied ? (
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M3 8.5l3.2 3.2L13 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <rect x="5.5" y="5.5" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M3 10.5V3.5a1 1 0 0 1 1-1H10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  )}
                </button>
              </>
            )}
          </div>
        }
      />

      <div className="flex gap-6 px-8 pt-6 border-b border-line">
        <button
          onClick={() => setTab("overview")}
          className={`text-[12px] uppercase tracking-wide pb-3 border-b-2 -mb-px transition-colors cursor-pointer ${
            tab === "overview" ? "border-ink text-ink" : "border-transparent text-stone hover:text-ink"
          }`}
        >
          Обзор
        </button>
        <button
          onClick={() => setTab("circle")}
          className={`text-[12px] uppercase tracking-wide pb-3 border-b-2 -mb-px transition-colors cursor-pointer ${
            tab === "circle" ? "border-ink text-ink" : "border-transparent text-stone hover:text-ink"
          }`}
        >
          Мои креаторы{circle ? ` · ${circle.creators.length}` : ""}
        </button>
        <button
          onClick={() => setTab("circles")}
          className={`text-[12px] uppercase tracking-wide pb-3 border-b-2 -mb-px transition-colors cursor-pointer ${
            tab === "circles" ? "border-ink text-ink" : "border-transparent text-stone hover:text-ink"
          }`}
        >
          Круги{circleCount !== null ? ` · ${circleCount}` : ""}
        </button>
        <button
          onClick={() => setTab("saved")}
          className={`text-[12px] uppercase tracking-wide pb-3 border-b-2 -mb-px transition-colors cursor-pointer ${
            tab === "saved" ? "border-ink text-ink" : "border-transparent text-stone hover:text-ink"
          }`}
        >
          Сохранённое{favorites ? ` · ${favorites.length}` : ""}
        </button>
      </div>
      <p className="px-8 pt-3 text-[12.5px] text-stone">{TAB_HINT[tab]}</p>

      {loadFailed && (
        <div role="alert" className="mx-8 mt-4 border border-line px-4 py-3 flex items-center justify-between gap-4 text-[13px]">
          <span>Не удалось загрузить часть данных.</span>
          <button
            type="button"
            onClick={retryLoad}
            className="text-[12px] uppercase tracking-wide underline underline-offset-4 cursor-pointer"
          >
            Повторить
          </button>
        </div>
      )}

      {pendingUnfollow && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-ink text-paper px-5 py-3 flex items-center gap-5 text-[13px] shadow-lg"
        >
          <span>{pendingUnfollow.displayName} больше не в ваших креаторах</span>
          <button
            type="button"
            onClick={undoUnfollow}
            className="text-[12px] uppercase tracking-wide underline underline-offset-4 cursor-pointer"
          >
            Отменить
          </button>
        </div>
      )}

      {tab === "overview" && (
        <div className="px-8 py-8 flex flex-col gap-10">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[11px] uppercase tracking-wider text-stone">
                Последние находки от ваших креаторов
              </h3>
              {circle && circle.feed.length > 0 && (
                <button
                  type="button"
                  onClick={() => setTab("circle")}
                  className="text-[11px] uppercase tracking-wide text-stone hover:text-ink transition-colors cursor-pointer"
                >
                  Все →
                </button>
              )}
            </div>
            {circle === null ? (
              <p className="text-stone text-sm">Загрузка…</p>
            ) : circle.feed.length === 0 ? (
              <p className="font-display italic text-stone text-sm">
                Пока пусто. Как только кто-то из ваших креаторов добавит товар, он появится тут.{" "}
                <a href="/finds" className="not-italic underline underline-offset-4">
                  Посмотрите находки всей площадки
                </a>
                .
              </p>
            ) : (
              <ul className="flex flex-col">
                {circle.feed.slice(0, 8).map((link) => (
                  <li
                    key={link.id}
                    className="grid grid-cols-[56px_1fr_auto] items-center gap-4 py-3.5 border-b border-line last:border-b-0"
                  >
                    <div className="w-14 h-14 bg-raise overflow-hidden">
                      {link.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={link.imageUrl} alt="" loading="lazy" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div>
                      <a href={link.wrappedUrl} className="text-[13.5px] font-medium hover:underline">
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
                    <span className="text-sm text-stone">
                      {link.price ? `${link.price.toLocaleString("ru-RU")} ₽` : "цена не указана"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <InterestsEditor interests={interests} onChange={setInterests} />
        </div>
      )}

      {tab === "saved" && (
        <div className="px-8 py-8">
          {favorites === null ? (
            <p className="text-stone text-sm">Загрузка…</p>
          ) : favorites.length === 0 ? (
            <EmptyState
              title="Пока пусто."
              description="Откройте витрину креатора и нажмите «Сохранить» на товаре: он появится здесь, и к нему можно будет вернуться позже."
              cta={{ label: "Смотреть креаторов", href: "/curators" }}
            />
          ) : (
            <ul className="flex flex-col">
              {favorites.map((link) => (
                <li
                  key={link.id}
                  className="grid grid-cols-[1fr_auto] items-center gap-4 py-3.5 border-b border-line last:border-b-0"
                >
                  <div>
                    <a href={link.wrappedUrl} className="text-[13.5px] font-medium hover:underline">
                      {link.title}
                    </a>
                    <span className="block text-[10.5px] uppercase tracking-wide text-stone mt-0.5">
                      {CATEGORY_LABEL[link.category]}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    {link.price && (
                      <span className="text-sm text-stone">
                        {link.price.toLocaleString("ru-RU")} ₽
                      </span>
                    )}
                    <button
                      onClick={() => remove(link.id)}
                      className="text-[11px] uppercase tracking-wide text-stone hover:text-error transition-colors cursor-pointer"
                    >
                      Убрать
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === "circle" && (
        <div className="px-8 py-8">
          {circle === null ? (
            <p className="text-stone text-sm">Загрузка…</p>
          ) : circle.creators.length === 0 ? (
            <div className="max-w-md flex flex-col gap-4 items-start">
              <div className="w-12 h-12 grid grid-cols-2 gap-1 p-2 border border-line">
                <span className="bg-line" />
                <span className="bg-line" />
                <span className="bg-line" />
                <span className="bg-line" />
              </div>
              <p className="font-display italic text-base text-stone">Пока нет креаторов</p>
              <p className="text-stone text-sm leading-relaxed">
                Подпишитесь на первых креаторов, чьему вкусу доверяете, и их находки соберутся в одну
                ленту, вместо того чтобы проверять каждую витрину по отдельности.
              </p>
              <button
                type="button"
                onClick={() => setShowOnboarding(true)}
                className="w-fit text-[12px] font-semibold uppercase tracking-wide text-paper bg-ink px-5 py-3 hover:opacity-80 transition-opacity cursor-pointer"
              >
                Найти креаторов
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-10">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[11px] uppercase tracking-wider text-stone">
                    В ваших креаторах
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowOnboarding(true)}
                    className="text-[11px] uppercase tracking-wide text-stone hover:text-ink transition-colors cursor-pointer"
                  >
                    + Добавить ещё
                  </button>
                </div>
                <div className="flex flex-wrap gap-3">
                  {circle.creators.filter((c) => c.id !== pendingUnfollow?.id).map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center gap-2.5 border border-line pl-2 pr-3 py-2"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={c.avatarUrl || placeholderAvatar(c.slug)}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover bg-raise"
                      />
                      <a href={`/${c.slug}`} className="text-[13px] font-medium hover:underline">
                        {c.displayName}
                      </a>
                      <button
                        type="button"
                        onClick={() => unfollow(c)}
                        aria-label={`Убрать ${c.displayName} из креаторов`}
                        className="w-8 h-8 -my-1.5 -mr-2 flex items-center justify-center text-stone hover:text-error transition-colors cursor-pointer text-[17px] leading-none"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-[11px] uppercase tracking-wider text-stone mb-4">
                  Их находки
                </h3>
                {circle.feed.length === 0 ? (
                  <p className="font-display italic text-stone">
                    Ваши креаторы пока ничего не добавили.
                  </p>
                ) : (
                  <ul className="flex flex-col">
                    {circle.feed.map((link) => (
                      <li
                        key={link.id}
                        className="grid grid-cols-[56px_1fr_auto] items-center gap-4 py-3.5 border-b border-line last:border-b-0"
                      >
                        <div className="w-14 h-14 bg-raise overflow-hidden">
                          {link.imageUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={link.imageUrl} alt="" loading="lazy" className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div>
                          <a href={link.wrappedUrl} className="text-[13.5px] font-medium hover:underline">
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
                        <span className="text-sm text-stone">
                          {link.price ? `${link.price.toLocaleString("ru-RU")} ₽` : "цена не указана"}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "circles" && (
        <div className="px-8 py-8">
          <MyCircles
            availableCreators={circle?.creators ?? []}
            onChange={loadCircleCount}
            onOpenCreators={() => setTab("circle")}
          />
        </div>
      )}

      {showOnboarding && (
        <CircleOnboarding
          initialInterests={interests}
          onClose={() => setShowOnboarding(false)}
          onDone={async () => {
            setShowOnboarding(false);
            await loadCircle();
          }}
        />
      )}

      {showOnboardingModal && (
        <OnboardingModal
          onClose={dismissOnboardingModal}
          steps={[
            {
              n: 1,
              title: "Подпишитесь на креатора",
              description: "Добавьте того, чьему вкусу доверяете, и его находки появятся у вас в ленте.",
              done: hasFollow,
              cta: {
                label: "Быстрый подбор",
                onClick: () => {
                  setShowOnboardingModal(false);
                  setShowOnboarding(true);
                },
              },
              secondaryCta: {
                label: "Все креаторы",
                onClick: () => {
                  window.location.href = "/curators";
                },
              },
            },
            {
              n: 2,
              title: "Сохраните товар в избранное",
              description: "На любой витрине креатора нажмите «Сохранить»: товар появится в «Сохранённом».",
              done: hasFavorite,
              cta: {
                label: "Смотреть креаторов",
                onClick: () => {
                  window.location.href = "/curators";
                },
              },
            },
          ]}
        />
      )}
    </main>
  );
}
