"use client";

import { useMemo, useState } from "react";
import { FavoriteButton } from "@/app/components/FavoriteButton";
import { EmptyState } from "@/app/components/EmptyState";
import { EditSectionButton } from "./EditSectionButton";
import { CATEGORY_LABEL, type Category } from "@/lib/categories";

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
  saves: number;
};

type Section = { id: string; name: string; icon?: string; links: StorefrontLink[] };

type Tab = "latest" | "popular" | string;

export function StorefrontGrid({
  links,
  sections = [],
  hidePopular = false,
  isOwner = false,
}: {
  links: StorefrontLink[];
  sections?: Section[];
  hidePopular?: boolean;
  isOwner?: boolean;
}) {
  const [tab, setTab] = useState<Tab>("latest");
  const [facet, setFacet] = useState<{ field: "subtype" | "brand"; value: string } | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  const categories = useMemo(
    () => [...new Set(links.map((l) => l.category))],
    [links]
  );

  const tabFiltered = useMemo(() => {
    if (tab === "latest") return links;
    if (tab === "popular") return [...links].sort((a, b) => b.clicks - a.clicks);
    const section = sections.find((s) => s.id === tab);
    if (section) return section.links;
    return links.filter((l) => l.category === tab);
  }, [links, tab, sections]);

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

  function selectTab(next: Tab) {
    setTab(next);
    setFacet(null);
  }

  if (links.length === 0) {
    return (
      <div className="py-16 flex justify-center">
        <EmptyState
          title={
            isOwner
              ? "Витрина пока пуста — добавьте первый товар кнопкой «+» вверху справа."
              : "Куратор пока не добавил товары."
          }
        />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-5 px-8 pt-6 pb-4 overflow-x-auto border-b border-line">
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
            className="flex-none text-stone hover:text-ink transition-colors cursor-pointer"
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3" />
              <path d="M11.5 11.5L15 15" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
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
        {!hidePopular && (
          <button
            onClick={() => selectTab("popular")}
            className={`text-[13px] px-3 py-1.5 rounded-full whitespace-nowrap transition-colors cursor-pointer ${
              tab === "popular" ? "border border-ink text-ink" : "border border-transparent text-stone hover:text-ink"
            }`}
          >
            Популярное
          </button>
        )}
        {sections.map((s) => (
          <span
            key={s.id}
            className={`inline-flex items-center rounded-full whitespace-nowrap transition-colors ${
              tab === s.id ? "border border-ink text-ink" : "border border-transparent text-stone hover:text-ink"
            }`}
          >
            <button onClick={() => selectTab(s.id)} className="text-[13px] pl-3 pr-1.5 py-1.5 cursor-pointer">
              {s.icon && <span className="mr-1">{s.icon}</span>}
              {s.name}
            </button>
            {isOwner && tab === s.id && (
              <span className="pr-2.5">
                <EditSectionButton sectionId={s.id} name={s.name} onHidden={() => selectTab("latest")} />
              </span>
            )}
          </span>
        ))}
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

      {visible.length === 0 ? (
        <div className="py-16 flex justify-center">
          <EmptyState title="В этой категории пока пусто." />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((link, i) => (
            <div
              key={link.id}
              className={`flex flex-col gap-3 p-6 border-b border-line ${
                (i + 1) % 3 !== 0 ? "lg:border-r" : ""
              } ${(i + 1) % 2 !== 0 ? "sm:border-r lg:border-r-0" : ""}`}
            >
              <div className="relative aspect-square bg-line overflow-hidden">
                <a href={link.wrappedUrl} className="block w-full h-full">
                  {link.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={link.imageUrl}
                      alt={link.title}
                      className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                    />
                  ) : (
                    <div className="w-full h-full" aria-hidden="true" />
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
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
