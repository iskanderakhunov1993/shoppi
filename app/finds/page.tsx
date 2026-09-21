import Link from "next/link";
import { AdLabel } from "@/app/components/AdLabel";
import { cookies } from "next/headers";
import { listRecentLinks, listFollowedLinks, getSessionUserId, getUserById, markFindsSeen } from "@/lib/store";
import { placeholderAvatar } from "@/lib/avatar";
import { SESSION_COOKIE } from "@/lib/auth";
import { LandingNav } from "@/app/components/landing/LandingNav";
import { LandingFooter } from "@/app/components/landing/LandingFooter";
import { EmptyState } from "@/app/components/EmptyState";
import { CATEGORY_LABEL } from "@/lib/categories";

export const dynamic = "force-dynamic";

export default async function FindsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;

  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const viewerId = token ? await getSessionUserId(token) : null;
  const viewerUser = viewerId ? await getUserById(viewerId) : undefined;
  const isShopperViewer = viewerUser?.role === "shopper";

  const showFollowing = isShopperViewer && tab === "following";
  const links = showFollowing
    ? await listFollowedLinks(viewerId!, { limit: 60 })
    : await listRecentLinks({ limit: 60 });

  if (showFollowing) {
    await markFindsSeen(viewerId!);
  }

  return (
    <main className="flex-1 flex flex-col">
      <LandingNav />

      <section className="px-6 md:px-10 pt-32 pb-10 border-b border-line">
        <div className="max-w-[1200px] mx-auto">
          <span className="font-display italic text-lg text-stone block mb-1">Всё сразу</span>
          <h1 className="font-display text-4xl md:text-5xl mb-3">Последние находки</h1>
          <p className="text-stone text-[14px] max-w-lg mb-6">
            {showFollowing
              ? "Товары только от кураторов, на которых вы подписаны, по порядку добавления."
              : "Товары от всех кураторов площадки, по порядку добавления — без ранжирования и без алгоритма. Самый простой способ найти нового куратора, не проверяя каждую витрину по отдельности."}
          </p>
          {isShopperViewer && (
            <div className="flex gap-2">
              <Link
                href="/finds"
                className={`text-[12px] uppercase tracking-wide px-4 py-2 border transition-colors ${
                  !showFollowing ? "border-ink text-ink" : "border-line text-stone hover:border-ink hover:text-ink"
                }`}
              >
                Все находки
              </Link>
              <Link
                href="/finds?tab=following"
                className={`text-[12px] uppercase tracking-wide px-4 py-2 border transition-colors ${
                  showFollowing ? "border-ink text-ink" : "border-line text-stone hover:border-ink hover:text-ink"
                }`}
              >
                Мои кураторы
              </Link>
            </div>
          )}
        </div>
      </section>

      {links.length === 0 ? (
        <div className="py-16 flex justify-center">
          <EmptyState
            title={
              showFollowing
                ? "Пока пусто — подпишитесь на кураторов, чтобы видеть их находки здесь."
                : "Пока пусто — кураторы ещё не добавили товары."
            }
          />
        </div>
      ) : (
        <div className="max-w-[1200px] mx-auto w-full grid sm:grid-cols-2 lg:grid-cols-3">
          {links.map((link, i) => (
            <a
              key={link.id}
              href={`/r/${link.id}`}
              className={`flex flex-col gap-2 p-6 border-b border-line hover:opacity-85 transition-opacity ${
                (i + 1) % 3 !== 0 ? "lg:border-r" : ""
              } ${(i + 1) % 2 !== 0 ? "sm:border-r lg:border-r-0" : ""}`}
            >
              <div className="aspect-[4/3] bg-line overflow-hidden mb-1">
                {link.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={link.imageUrl} alt={link.title} className="w-full h-full object-cover" />
                )}
              </div>
              <span className="text-[10px] uppercase tracking-wide text-stone">
                {CATEGORY_LABEL[link.category] ?? link.category}
              </span>
              <div className="text-sm font-medium leading-snug">{link.title}</div>
              <AdLabel isAd={link.isAd} adInfo={link.adInfo} />
              <div className="flex items-center justify-between mt-auto pt-1">
                <div className="flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={link.creatorAvatarUrl || placeholderAvatar(link.creatorSlug)}
                    alt=""
                    className="w-5 h-5 rounded-full object-cover bg-raise"
                  />
                  <span className="text-[12px] text-stone">{link.creatorName}</span>
                </div>
                {link.price && (
                  <span className="text-[13.5px] text-stone">{link.price.toLocaleString("ru-RU")} ₽</span>
                )}
              </div>
            </a>
          ))}
        </div>
      )}

      <LandingFooter />
    </main>
  );
}
