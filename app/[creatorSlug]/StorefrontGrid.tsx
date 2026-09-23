"use client";

import { AdLabel } from "@/app/components/AdLabel";
import { useMemo, useState } from "react";
import { FavoriteButton } from "@/app/components/FavoriteButton";
import { EmptyState } from "@/app/components/EmptyState";
import { CollectionEditor } from "./CollectionEditor";
import { CopyLinkButton } from "./CopyLinkButton";
import { QuickAddProductButton } from "./QuickAddProductButton";
import { CATEGORY_LABEL, type Category } from "@/lib/categories";
import { pluralizeProducts, pluralizeCreators } from "@/lib/plural";

type StorefrontLink = {
  id: string;
  title: string;
  imageUrl?: string;
  price?: number;
  category: Category;
  brand?: string;
  subtype?: string;
  promoCode?: string;
  wrappedUrl: string;
  clicks: number;
  clicksWeek: number;
  clicksMonth: number;
  sameProductCreators?: number;
  sameProductAvatars?: string[];
  sameProductNames?: string[];
  saves: number;
  isAd?: boolean;
  adInfo?: string;
};

type Collection = { id: string; name: string; linkIds: string[] };
type Social = { key: string; label: string; handle: string; href: string };

type Tab = "latest" | "popular" | "popular_month" | "popular_week" | "collections" | "social" | "for_you" | string;

export function StorefrontGrid({
  links,
  collections = [],
  socials = [],
  storefrontUrl = "",
  hidePopular = false,
  isOwner = false,
}: {
  links: StorefrontLink[];
  collections?: Collection[];
  socials?: Social[];
  storefrontUrl?: string;
  hidePopular?: boolean;
  isOwner?: boolean;
}) {
  const [tab, setTab] = useState<Tab>("latest");
  const [facet, setFacet] = useState<{ field: "subtype" | "brand"; value: string } | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [collectionId, setCollectionId] = useState<string | null>(null);
  const [editor, setEditor] = useState<{ collection?: Collection } | null>(null);
  const [copied, setCopied] = useState(false);

  const categories = useMemo(
    () => [...new Set(links.map((l) => l.category))],
    [links]
  );

  const activeCollection = collections.find((c) => c.id === collectionId) ?? null;

  const tabFiltered = useMemo(() => {
    if (activeCollection) {
      const byId = new Map(links.map((l) => [l.id, l]));
      return activeCollection.linkIds.map((id) => byId.get(id)).filter((l): l is StorefrontLink => Boolean(l));
    }
    if (tab === "latest") return links;
    if (tab === "popular") return [...links].sort((a, b) => b.clicks - a.clicks);
    if (tab === "popular_month") return [...links].sort((a, b) => b.clicksMonth - a.clicksMonth);
    if (tab === "popular_week") return [...links].sort((a, b) => b.clicksWeek - a.clicksWeek);
    if (tab === "for_you") return [...links].sort(() => Math.random() - 0.5);
    if (tab === "collections" || tab === "social") return [];
    return links.filter((l) => l.category === tab);
  }, [links, tab, activeCollection]);

  // Secondary facets (тип/бренд) — only built from products in the
  // current tab that actually have the field set, so an empty facet
  // never appears just because most products haven't been tagged yet.
  const subtypeFacets = useMemo(() => {
    const counts = new Map<string, number>();
    for (const l of tabFiltered) if (l.subtype) counts.set(l.subtype, (counts.get(l.subtype) ?? 0) + 1);
    return [...counts.entries()];
  }, [tabFiltered]);

  const brandFacets = useMemo(() => {
    const counts = new Map<string, number>();
    for (const l of tabFiltered) if (l.brand) counts.set(l.brand, (counts.get(l.brand) ?? 0) + 1);
    return [...counts.entries()];
  }, [tabFiltered]);

  const visible = useMemo(() => {
    let result = facet ? tabFiltered.filter((l) => l[facet.field] === facet.value) : tabFiltered;
    const q = query.trim().toLowerCase();
    if (q) result = result.filter((l) => l.title.toLowerCase().includes(q));
    return result;
  }, [tabFiltered, facet, query]);

  // Like ShopMy: collections sit directly on "Последние" as cover cards,
  // one flat level (no section wrapper around them). Only the products
  // that aren't in any collection show as plain cards below. Searching,
  // filtering, or switching to another tab drops back to a plain grid.
  const collectionsMode = tab === "latest" && collections.length > 0 && !activeCollection && !query.trim() && !facet;
  const leftovers = useMemo(() => {
    const inCollections = new Set(collections.flatMap((c) => c.linkIds));
    return tabFiltered.filter((l) => !inCollections.has(l.id));
  }, [tabFiltered, collections]);
  const shown = collectionsMode ? leftovers : visible;

  function selectTab(next: Tab) {
    setTab(next);
    setFacet(null);
    setCollectionId(null);
  }

  function copyLink() {
    navigator.clipboard.writeText(storefrontUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  // An empty storefront is only a dead end for visitors; the owner still
  // needs the tabs and toolbar to start building it.
  if (links.length === 0 && !isOwner) {
    return (
      <div className="py-16 flex justify-center">
        <EmptyState
          title={
            isOwner
              ? "Витрина пока пуста — добавьте первый товар кнопкой «+» вверху справа."
              : "Креатор пока не добавил товары."
          }
        />
      </div>
    );
  }

  return (
    <div>
      <div className="relative border-b border-line">
      <div className="flex items-center gap-5 px-8 pt-6 pb-4 overflow-x-auto">
        {searchOpen ? (
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onBlur={() => !query && setSearchOpen(false)}
            placeholder="Поиск по витрине"
            className="flex-none w-40 text-[13px] py-1 border-b border-line bg-transparent outline-none focus:border-ink"
          />
        ) : (
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label="Поиск по витрине"
            className="flex-none w-8 h-8 flex items-center justify-center text-stone hover:text-ink transition-colors cursor-pointer -ml-1"
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M11.5 11.5L15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        )}
        <button
          onClick={() => selectTab("latest")}
          className={`text-[13px] px-3 py-1.5 rounded-full whitespace-nowrap transition-colors cursor-pointer ${
            tab === "latest" ? "border border-ink text-ink" : "border border-transparent text-stone hover:text-ink"
          }`}
        >
          Последние
        </button>
        {!hidePopular && links.length > 0 && (
          <button
            onClick={() => selectTab("popular")}
            className={`text-[13px] px-3 py-1.5 rounded-full whitespace-nowrap transition-colors cursor-pointer ${
              tab === "popular" ? "border border-ink text-ink" : "border border-transparent text-stone hover:text-ink"
            }`}
          >
            Популярное
          </button>
        )}
        {!hidePopular && links.length > 0 && (
          <button
            onClick={() => selectTab("popular_month")}
            className={`text-[13px] px-3 py-1.5 rounded-full whitespace-nowrap transition-colors cursor-pointer ${
              tab === "popular_month" ? "border border-ink text-ink" : "border border-transparent text-stone hover:text-ink"
            }`}
          >
            Популярное за месяц
          </button>
        )}
        {!hidePopular && links.length > 0 && (
          <button
            onClick={() => selectTab("popular_week")}
            className={`text-[13px] px-3 py-1.5 rounded-full whitespace-nowrap transition-colors cursor-pointer ${
              tab === "popular_week" ? "border border-ink text-ink" : "border border-transparent text-stone hover:text-ink"
            }`}
          >
            Популярное за неделю
          </button>
        )}
        {collections.length > 0 && (
          <button
            onClick={() => selectTab("collections")}
            className={`text-[13px] px-3 py-1.5 rounded-full whitespace-nowrap transition-colors cursor-pointer ${
              tab === "collections" ? "border border-ink text-ink" : "border border-transparent text-stone hover:text-ink"
            }`}
          >
            Коллекции
          </button>
        )}
        {socials.length > 0 && (
          <button
            onClick={() => selectTab("social")}
            className={`text-[13px] px-3 py-1.5 rounded-full whitespace-nowrap transition-colors cursor-pointer ${
              tab === "social" ? "border border-ink text-ink" : "border border-transparent text-stone hover:text-ink"
            }`}
          >
            Соцсети
          </button>
        )}
        {links.length > 0 && (
          <button
            onClick={() => selectTab("for_you")}
            className={`text-[13px] px-3 py-1.5 rounded-full whitespace-nowrap transition-colors cursor-pointer ${
              tab === "for_you" ? "border border-ink text-ink" : "border border-transparent text-stone hover:text-ink"
            }`}
          >
            Для вас
          </button>
        )}
        {categories.length > 0 && <span className="text-line select-none flex-none">·</span>}
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => selectTab(c)}
            className={`text-[13px] px-3 py-1.5 rounded-full whitespace-nowrap transition-colors cursor-pointer ${
              tab === c ? "border border-ink text-ink" : "border border-transparent text-stone hover:text-ink"
            }`}
          >
            {CATEGORY_LABEL[c] ?? c}
          </button>
        ))}
      </div>
      {/* Right-edge fade hints that the tab row scrolls further — the row
          has no visible scrollbar, so without this a 7+ tab list can look
          like it simply ends at the viewport edge. */}
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-paper to-transparent" />
      </div>

      {isOwner && (
        <div className="flex items-center gap-2 px-8 py-3 overflow-x-auto border-b border-line">
          <button
            type="button"
            onClick={copyLink}
            className="inline-flex items-center gap-1.5 text-[13px] px-3.5 py-1.5 rounded-full bg-raise text-ink hover:opacity-80 transition-opacity cursor-pointer whitespace-nowrap"
          >
            {copied ? "Ссылка скопирована" : "Поделиться"}
          </button>
          {links.length === 0 ? (
            <QuickAddProductButton variant="pill" />
          ) : (
            <button
              type="button"
              onClick={() => setEditor({})}
              className="inline-flex items-center gap-1.5 text-[13px] px-3.5 py-1.5 rounded-full bg-ink text-paper hover:opacity-85 transition-opacity cursor-pointer whitespace-nowrap"
            >
              Добавить коллекцию +
            </button>
          )}
        </div>
      )}

      {activeCollection && (
        <div className="flex items-center gap-4 px-8 py-4 border-b border-line">
          <button
            type="button"
            onClick={() => setCollectionId(null)}
            className="text-[12px] uppercase tracking-wide text-stone hover:text-ink transition-colors cursor-pointer"
          >
            ← Назад
          </button>
          <span className="font-display text-xl">{activeCollection.name}</span>
          <CopyLinkButton
            path={`${new URL(storefrontUrl || "http://x").pathname}/c/${activeCollection.id}`}
            label="Поделиться коллекцией"
          />
          {isOwner && (
            <button
              type="button"
              onClick={() => setEditor({ collection: activeCollection })}
              className="text-[12px] uppercase tracking-wide text-stone hover:text-ink transition-colors cursor-pointer"
            >
              Изменить
            </button>
          )}
        </div>
      )}

      {(collectionsMode || tab === "collections") && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 px-8 py-8 border-b border-line">
          {collections.map((c) => {
            const byId = new Map(links.map((l) => [l.id, l]));
            const items = c.linkIds.map((id) => byId.get(id)).filter((l): l is StorefrontLink => Boolean(l));
            return (
              <button key={c.id} type="button" onClick={() => setCollectionId(c.id)} className="text-left cursor-pointer group">
                <div className="grid grid-cols-2 gap-px bg-line aspect-square overflow-hidden">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="bg-raise overflow-hidden">
                      {items[i]?.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={items[i].imageUrl} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-[15px] font-medium leading-snug group-hover:underline">{c.name}</div>
                <div className="text-[11.5px] uppercase tracking-wider text-stone mt-0.5">
                  {items.length} {pluralizeProducts(items.length)}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {tab === "social" && (
        <div className="flex flex-col gap-3 px-8 py-8 border-b border-line max-w-md">
          {socials.length === 0 ? (
            <EmptyState
              title={isOwner ? "Вы пока не добавили ни одной соцсети." : "Соцсети пока не добавлены."}
              cta={isOwner ? { label: "Добавить в профиле", href: "/dashboard?tab=profile" } : undefined}
            />
          ) : (
            socials.map((s) => (
              <a
                key={s.key}
                href={s.href}
                target={s.key === "email" ? undefined : "_blank"}
                rel={s.key === "email" ? undefined : "noopener noreferrer"}
                className="flex items-center justify-between px-4 py-3 border border-line hover:border-ink transition-colors"
              >
                <span className="text-[13px] font-medium">{s.label}</span>
                <span className="text-stone text-[13px]">{s.handle}</span>
              </a>
            ))
          )}
        </div>
      )}

      {editor && (
        <CollectionEditor
          products={links.map((l) => ({ id: l.id, title: l.title, imageUrl: l.imageUrl }))}
          collection={editor.collection}
          onClose={() => {
            setEditor(null);
            setCollectionId(null);
          }}
        />
      )}

      {(subtypeFacets.length > 1 || brandFacets.length > 1) && (
        <div className="flex items-center gap-2 px-8 pb-4 pt-4 overflow-x-auto border-b border-line">
          {facet && (
            <button
              onClick={() => setFacet(null)}
              className="text-[11px] uppercase tracking-wide text-ink border-b border-ink whitespace-nowrap cursor-pointer"
            >
              {facet.value} ×
            </button>
          )}
          {subtypeFacets.length > 1 &&
            subtypeFacets.map(([value, count]) => (
              <button
                key={`subtype-${value}`}
                onClick={() => setFacet({ field: "subtype", value })}
                className={`text-[11px] uppercase tracking-wide whitespace-nowrap cursor-pointer transition-colors ${
                  facet?.field === "subtype" && facet.value === value ? "text-ink" : "text-stone hover:text-ink"
                }`}
              >
                {value} <span className="text-stone">{count}</span>
              </button>
            ))}
          {subtypeFacets.length > 1 && brandFacets.length > 1 && (
            <span className="text-line select-none">·</span>
          )}
          {brandFacets.length > 1 &&
            brandFacets.map(([value, count]) => (
              <button
                key={`brand-${value}`}
                onClick={() => setFacet({ field: "brand", value })}
                className={`text-[11px] uppercase tracking-wide whitespace-nowrap cursor-pointer transition-colors ${
                  facet?.field === "brand" && facet.value === value ? "text-ink" : "text-stone hover:text-ink"
                }`}
              >
                {value} <span className="text-stone">{count}</span>
              </button>
            ))}
        </div>
      )}

      {tab === "collections" || tab === "social" ? null : collectionsMode && shown.length === 0 ? null : shown.length === 0 ? (
        <div className="py-16 flex flex-col items-center gap-4">
          <EmptyState
            title={
              query.trim() || facet
                ? "Ничего не найдено — попробуйте другой запрос или сбросьте фильтр."
                : isOwner && activeCollection
                  ? "В этой коллекции пока нет товаров."
                  : isOwner && links.length === 0
                    ? "Витрина пока пуста — добавьте первый товар кнопкой «Добавить товар +» выше."
                    : "В этой категории пока пусто."
            }
          />
          {isOwner && activeCollection && !query.trim() && !facet && (
            <button
              type="button"
              onClick={() => setEditor({ collection: activeCollection })}
              className="text-[12px] font-semibold uppercase tracking-wide text-paper bg-ink px-5 py-3 hover:opacity-80 transition-opacity cursor-pointer"
            >
              Добавить товар в коллекцию
            </button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((link, i) => (
            <div
              key={link.id}
              className={`flex flex-col gap-3 p-6 border-b border-line transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_-14px_rgba(0,0,0,0.35)] ${
                (i + 1) % 3 !== 0 ? "lg:border-r" : ""
              } ${(i + 1) % 2 !== 0 ? "sm:border-r lg:border-r-0" : ""}`}
            >
              <div className="relative bg-line overflow-hidden">
                <a href={link.wrappedUrl} className="block w-full">
                  {link.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={link.imageUrl}
                      alt={link.title}
                      className="w-full h-auto object-contain hover:opacity-90 transition-opacity"
                    />
                  ) : (
                    <div className="w-full aspect-square" aria-hidden="true" />
                  )}
                </a>
                <div className="absolute top-3 right-3 flex flex-col items-center gap-1">
                  <FavoriteButton linkId={link.id} variant="overlay" />
                  {link.saves > 0 && (
                    <span className="text-[10px] font-medium text-paper bg-ink/75 rounded-full px-1.5 py-px">
                      {link.saves}
                    </span>
                  )}
                </div>
              </div>
              <a href={link.wrappedUrl} className="flex flex-col gap-1 hover:opacity-85 transition-opacity">
                <span className="text-[10px] uppercase tracking-wide text-stone">
                  {CATEGORY_LABEL[link.category] ?? link.category}
                  {link.subtype && ` · ${link.subtype}`}
                </span>
                <div className="text-sm font-medium leading-snug">{link.title}</div>
                <AdLabel isAd={link.isAd} adInfo={link.adInfo} />
                {link.price && (
                  <div className="text-[13.5px] text-stone">
                    {link.price.toLocaleString("ru-RU")} ₽
                  </div>
                )}
                {link.promoCode && (
                  <div className="text-[11.5px] text-ink border border-line w-fit px-2 py-0.5">
                    Промокод: {link.promoCode}
                  </div>
                )}
                {!!link.sameProductCreators && link.sameProductCreators > 1 && (
                  <div
                    className="flex items-center gap-2 mt-0.5"
                    title={
                      link.sameProductNames?.length ? `Также выбрали: ${link.sameProductNames.join(", ")}` : undefined
                    }
                  >
                    <div className="flex -space-x-2">
                      {(link.sameProductAvatars ?? []).slice(0, 3).map((src, i) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={i}
                          src={src}
                          alt=""
                          title={link.sameProductNames?.[i]}
                          className="w-5 h-5 rounded-full object-cover border-2 border-card bg-raise"
                        />
                      ))}
                    </div>
                    <span className="text-[11px] text-stone">
                      Выбор {link.sameProductCreators} {pluralizeCreators(link.sameProductCreators)}
                    </span>
                  </div>
                )}
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
