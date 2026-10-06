import { cookies } from "next/headers";
import { notFound, permanentRedirect } from "next/navigation";
import Link from "next/link";
import { AdLabel } from "@/app/components/AdLabel";
import { seedDemoAccounts } from "@/lib/seed";
import {
  listLinksByCategory,
  countLinksByCategory,
  listFollowedLinksByCategory,
  countFollowedLinksByCategory,
  listCategoryCovers,
  getCreatorById,
  getSessionUserId,
  getUserById,
  type Link as ShopLink,
  type RecentLink,
} from "@/lib/store";
import { LandingNav } from "@/app/components/landing/LandingNav";
import { LandingFooter } from "@/app/components/landing/LandingFooter";
import { EmptyState } from "@/app/components/EmptyState";
import { placeholderAvatar } from "@/lib/avatar";
import { SESSION_COOKIE } from "@/lib/auth";
import { CATEGORY_LABEL, isCategory, normalizeCategory } from "@/lib/categories";

export const dynamic = "force-dynamic";

const PER_PAGE = 24;

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ tab?: string; page?: string }>;
}) {
  const { category: raw } = await params;
  if (!isCategory(raw)) {
    const renamed = normalizeCategory(raw);
    if (renamed) permanentRedirect(`/category/${renamed}`);
    notFound();
  }
  const category = raw;

  const { tab, page: pageParam } = await searchParams;

  await seedDemoAccounts();

  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const viewerId = token ? await getSessionUserId(token) : null;
  const viewerUser = viewerId ? await getUserById(viewerId) : undefined;
  const isShopperViewer = viewerUser?.role === "shopper";

  const showFollowing = isShopperViewer && tab === "following";
  const page = Math.max(1, Number(pageParam) || 1);
  const offset = (page - 1) * PER_PAGE;

  const [total, links, cover] = await Promise.all([
    showFollowing ? countFollowedLinksByCategory(viewerId!, category) : countLinksByCategory(category),
    showFollowing
      ? listFollowedLinksByCategory(viewerId!, category, { limit: PER_PAGE, offset })
      : listLinksByCategory(category, { limit: PER_PAGE, offset }),
    listCategoryCovers().then((covers) => covers.find((c) => c.category === category)?.imageUrl),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  // listLinksByCategory doesn't join creator info the way the followed
  // variant does, so fill it in here from the few distinct creators on
  // this page of results instead of one query per link.
  const needsCreatorLookup: ShopLink[] = showFollowing ? [] : (links as ShopLink[]);
  const creatorsById = new Map(
    await Promise.all(
      [...new Set(needsCreatorLookup.map((l) => l.creatorId))].map(
        async (id) => [id, await getCreatorById(id)] as const
      )
    )
  );

  const pageHref = (n: number) =>
    `/category/${category}?page=${n}${showFollowing ? "&tab=following" : ""}`;

  return (
    <main className="flex-1 flex flex-col">
      <LandingNav overlay />

      <div className="relative h-[280px] md:h-[340px] overflow-hidden">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-ink" />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black via-black/50 to-black/20" />
        <div className="relative h-full flex flex-col justify-end px-6 md:px-10 pb-10">
          <div className="max-w-[1200px] mx-auto w-full">
            <span className="text-[11px] uppercase tracking-widest text-white/70 mb-2 font-display italic">
              По категории
            </span>
            <h1 className="font-display text-white text-4xl md:text-6xl">{CATEGORY_LABEL[category]}</h1>
          </div>
        </div>
      </div>

      <section className="px-6 md:px-10 pt-8 pb-14 md:pb-16">
        <div className="max-w-[1200px] mx-auto">
          {isShopperViewer && (
            <div className="flex gap-2 mb-10">
              <Link
                href={`/category/${category}`}
                className={`text-[12px] uppercase tracking-wide px-4 py-2 border transition-colors ${
                  !showFollowing ? "border-ink text-ink" : "border-line text-stone hover:border-ink hover:text-ink"
                }`}
              >
                Все товары
              </Link>
              <Link
                href={`/category/${category}?tab=following`}
                className={`text-[12px] uppercase tracking-wide px-4 py-2 border transition-colors ${
                  showFollowing ? "border-ink text-ink" : "border-line text-stone hover:border-ink hover:text-ink"
                }`}
              >
                Мои блогеры
              </Link>
            </div>
          )}

          {links.length === 0 ? (
            <EmptyState
              title={
                showFollowing
                  ? "Ваши блогеры пока не добавили товары в этой категории."
                  : "В этой категории пока нет опубликованных товаров."
              }
            />
          ) : (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-10">
              {links.map((link) => {
                const creatorName = showFollowing
                  ? (link as RecentLink).creatorName
                  : creatorsById.get(link.creatorId)?.displayName;
                const creatorSlug = showFollowing
                  ? (link as RecentLink).creatorSlug
                  : creatorsById.get(link.creatorId)?.slug;
                const creatorAvatarUrl = showFollowing
                  ? (link as RecentLink).creatorAvatarUrl
                  : creatorsById.get(link.creatorId)?.avatarUrl;

                return (
                  <a
                    key={link.id}
                    href={`/r/${link.id}`}
                    className="group bg-paper flex flex-col hover:opacity-90 transition-opacity"
                  >
                    <div className="aspect-[4/3] bg-line overflow-hidden">
                      {link.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={link.imageUrl}
                          alt={link.title}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                        />
                      )}
                    </div>
                    <div className="p-5">
                      <div className="text-sm font-medium leading-snug mb-1">{link.title}</div>
                      <AdLabel isAd={link.isAd} adInfo={link.adInfo} />
                      {creatorName && (
                        <div className="flex items-center gap-1.5 mt-1">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={creatorAvatarUrl || placeholderAvatar(creatorSlug ?? creatorName)}
                            alt=""
                            className="w-4 h-4 rounded-full object-cover bg-raise"
                          />
                          <span className="text-[11px] text-stone">{creatorName}</span>
                        </div>
                      )}
                      {link.price && (
                        <div className="text-[13.5px] text-stone mt-2">
                          {link.price.toLocaleString("ru-RU")} ₽
                        </div>
                      )}
                    </div>
                  </a>
                );
              })}
            </div>
          )}

          {totalPages > 1 && (
            <nav className="flex items-center justify-between mt-12 text-[12px] uppercase tracking-wide">
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
