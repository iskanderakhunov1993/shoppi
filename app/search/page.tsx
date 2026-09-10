import Link from "next/link";
import { seedDemoAccounts } from "@/lib/seed";
import { listCreators, searchLinks } from "@/lib/store";
import { placeholderAvatar } from "@/lib/avatar";
import { LandingNav } from "@/app/components/landing/LandingNav";
import { LandingFooter } from "@/app/components/landing/LandingFooter";
import { EmptyState } from "@/app/components/EmptyState";

export const dynamic = "force-dynamic";

const CATEGORY_LABEL: Record<string, string> = {
  cosmetics: "Косметика",
  mens: "Мужские товары",
  clothing: "Одежда",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  seedDemoAccounts();

  const query = q?.trim() ?? "";
  const creators = query ? listCreators({ query, limit: 8 }) : [];
  const links = query ? searchLinks(query, { limit: 24 }) : [];
  const hasResults = creators.length > 0 || links.length > 0;

  return (
    <main className="flex-1 flex flex-col">
      <LandingNav />

      <section className="px-6 md:px-10 pt-32 pb-10 border-b border-line">
        <div className="max-w-[1200px] mx-auto">
          <span className="text-[11px] uppercase tracking-widest text-stone">Поиск</span>
          <h1 className="font-display text-3xl md:text-4xl mt-2">
            {query ? `«${query}»` : "Что вы ищете?"}
          </h1>
          <form action="/search" method="get" className="flex gap-2 max-w-md mt-6">
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Товар, категория или куратор"
              className="flex-1 text-[14px] px-3 py-2.5 border border-line bg-card text-ink outline-none focus:border-ink transition-colors"
            />
            <button
              type="submit"
              className="text-[12px] font-semibold uppercase tracking-wide text-paper bg-ink px-5 py-2.5 hover:opacity-80 transition-opacity"
            >
              Найти
            </button>
          </form>
        </div>
      </section>

      <section className="px-6 md:px-10 py-12 flex-1">
        <div className="max-w-[1200px] mx-auto flex flex-col gap-14">
          {!query ? (
            <p className="text-stone text-sm">Введите запрос выше — ищем среди товаров и кураторов.</p>
          ) : !hasResults ? (
            <EmptyState title="Ничего не нашлось." description="Попробуйте другое слово или проверьте, нет ли опечатки." />
          ) : (
            <>
              {creators.length > 0 && (
                <div>
                  <h2 className="text-[11px] uppercase tracking-wider text-stone mb-5">
                    Кураторы · {creators.length}
                  </h2>
                  <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-px bg-line">
                    {creators.map((c) => (
                      <a
                        key={c.id}
                        href={`/${c.slug}`}
                        className="group bg-paper flex items-center gap-3 p-4 hover:opacity-90 transition-opacity"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={c.avatarUrl || placeholderAvatar(c.slug)}
                          alt={c.displayName}
                          className="w-11 h-11 rounded-full object-cover bg-raise flex-none"
                        />
                        <span className="text-[13.5px] font-medium">{c.displayName}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {links.length > 0 && (
                <div>
                  <h2 className="text-[11px] uppercase tracking-wider text-stone mb-5">
                    Товары · {links.length}
                  </h2>
                  <ul className="flex flex-col">
                    {links.map((link) => (
                      <li
                        key={link.id}
                        className="grid grid-cols-[1fr_auto] items-center gap-4 py-3.5 border-b border-line last:border-b-0"
                      >
                        <div>
                          <a href={`/r/${link.id}`} className="text-[13.5px] font-medium hover:underline">
                            {link.title}
                          </a>
                          <span className="block text-[10.5px] uppercase tracking-wide text-stone mt-0.5">
                            {CATEGORY_LABEL[link.category] ?? link.category} · от{" "}
                            <Link href={`/${link.creatorSlug}`} className="hover:underline">
                              {link.creatorName}
                            </Link>
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
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <LandingFooter />
    </main>
  );
}
