import Link from "next/link";
import { seedDemoAccounts } from "@/lib/seed";
import { countCreators, listCreators } from "@/lib/store";
import { placeholderAvatar } from "@/lib/avatar";
import { LandingNav } from "@/app/components/landing/LandingNav";
import { LandingFooter } from "@/app/components/landing/LandingFooter";

export const dynamic = "force-dynamic";

const PER_PAGE = 24;

export default async function CuratorsDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const { page: pageParam, q } = await searchParams;
  seedDemoAccounts();

  const page = Math.max(1, Number(pageParam) || 1);
  const query = q?.trim() ?? "";

  const total = countCreators(query);
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const creators = listCreators({ limit: PER_PAGE, offset: (page - 1) * PER_PAGE, query });

  const pageHref = (n: number) =>
    `/curators?page=${n}${query ? `&q=${encodeURIComponent(query)}` : ""}`;

  return (
    <main className="flex-1 flex flex-col">
      <LandingNav />

      <section className="px-6 md:px-10 pt-32 pb-12 md:py-16 border-b border-line">
        <div className="max-w-[1200px] mx-auto">
          <span className="font-display italic text-lg text-stone block mb-1">По</span>
          <h1 className="font-display text-4xl md:text-5xl mb-6">Куратору</h1>

          <form action="/curators" method="get" className="flex gap-2 max-w-md">
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Имя куратора"
              className="flex-1 text-[14px] px-3 py-2.5 border border-line bg-card text-ink outline-none focus:border-ink transition-colors"
            />
            <button
              type="submit"
              className="text-[12px] font-semibold uppercase tracking-wide text-paper bg-ink px-5 py-2.5 hover:opacity-80 transition-opacity"
            >
              Найти
            </button>
          </form>

          <p className="text-stone text-[13px] mt-4">
            {query ? (
              <>
                Найдено: {total}.{" "}
                <Link href="/curators" className="underline underline-offset-4">
                  Сбросить
                </Link>
              </>
            ) : (
              <>Всего кураторов: {total}</>
            )}
          </p>
        </div>
      </section>

      <section className="px-6 md:px-10 py-12 flex-1">
        <div className="max-w-[1200px] mx-auto">
          {creators.length === 0 ? (
            <p className="font-display italic text-stone">
              По этому запросу кураторов не нашлось.
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-px bg-line">
              {creators.map((creator) => (
                <a
                  key={creator.id}
                  href={`/${creator.slug}`}
                  className="group bg-paper flex flex-col hover:opacity-90 transition-opacity"
                >
                  <div className="aspect-square overflow-hidden bg-raise">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={creator.avatarUrl || placeholderAvatar(creator.slug)}
                      alt={creator.displayName}
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4">
                    <div className="font-display text-lg mb-1">{creator.displayName}</div>
                    {creator.bio && (
                      <p className="font-display italic text-[13px] text-stone leading-snug">
                        {creator.bio}
                      </p>
                    )}
                  </div>
                </a>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <nav className="flex items-center justify-between mt-10 text-[12px] uppercase tracking-wide">
              {page > 1 ? (
                <Link
                  href={pageHref(page - 1)}
                  className="border border-line px-4 py-2.5 hover:border-ink transition-colors"
                >
                  Назад
                </Link>
              ) : (
                <span className="border border-line px-4 py-2.5 text-stone opacity-40">Назад</span>
              )}

              <span className="text-stone">
                Страница {page} из {totalPages}
              </span>

              {page < totalPages ? (
                <Link
                  href={pageHref(page + 1)}
                  className="border border-line px-4 py-2.5 hover:border-ink transition-colors"
                >
                  Дальше
                </Link>
              ) : (
                <span className="border border-line px-4 py-2.5 text-stone opacity-40">Дальше</span>
              )}
            </nav>
          )}
        </div>
      </section>

      <LandingFooter />
    </main>
  );
}
