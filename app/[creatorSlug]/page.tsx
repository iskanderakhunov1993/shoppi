import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { FavoriteButton } from "@/app/components/FavoriteButton";
import { FollowButton } from "@/app/components/FollowButton";
import { EmptyState } from "@/app/components/EmptyState";
import { placeholderAvatar } from "@/lib/avatar";

function pluralizeShoppers(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "покупатель";
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return "покупателя";
  return "покупателей";
}

const CATEGORY_LABEL: Record<string, string> = {
  cosmetics: "Косметика",
  mens: "Мужские товары",
  clothing: "Одежда",
};

type StorefrontLink = {
  id: string;
  title: string;
  imageUrl?: string;
  price?: number;
  category: string;
  promoCode?: string;
  wrappedUrl: string;
};

async function getStorefront(slug: string) {
  const h = await headers();
  const host = h.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  const res = await fetch(`${protocol}://${host}/api/creators/${slug}`, {
    cache: "no-store",
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to load storefront");
  return res.json() as Promise<{
    id: string;
    slug: string;
    displayName: string;
    bio?: string;
    links: StorefrontLink[];
    avatarUrl?: string;
    instagramHandle?: string;
    tiktokHandle?: string;
    followers: number;
  }>;
}

function InstagramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" />
    </svg>
  );
}

function TiktokIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M14 3v10.6a3.4 3.4 0 1 1-2.6-3.3M14 3c.4 2.2 2 3.9 4.2 4.2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default async function StorefrontPage({
  params,
}: {
  params: Promise<{ creatorSlug: string }>;
}) {
  const { creatorSlug } = await params;
  const creator = await getStorefront(creatorSlug);
  if (!creator) notFound();

  return (
    <main className="flex-1">
      <div className="text-center px-8 pt-14 pb-10 border-b border-line">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={creator.avatarUrl || placeholderAvatar(creatorSlug)}
          alt={creator.displayName}
          className="w-28 h-28 rounded-full object-cover mx-auto mb-6 bg-raise"
        />
        <span className="font-display italic text-stone text-base block mb-1">Курирует</span>
        <h1 className="font-display text-4xl mb-3">{creator.displayName}</h1>
        {creator.bio && (
          <p className="text-stone text-sm max-w-md mx-auto mb-6">{creator.bio}</p>
        )}
        <div className="flex justify-center mb-5">
          <FollowButton creatorId={creator.id} initialFollowers={creator.followers} />
        </div>
        <p className="font-display italic text-stone text-sm mb-4">
          Доверяют {creator.followers.toLocaleString("ru-RU")}{" "}
          {pluralizeShoppers(creator.followers)}
        </p>
        {(creator.instagramHandle || creator.tiktokHandle) && (
          <div className="flex justify-center gap-3">
            {creator.instagramHandle && (
              <a
                href={`https://instagram.com/${creator.instagramHandle}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-8 h-8 flex items-center justify-center border border-line rounded-full text-stone hover:text-ink hover:border-ink transition-colors"
              >
                <InstagramIcon />
              </a>
            )}
            {creator.tiktokHandle && (
              <a
                href={`https://tiktok.com/@${creator.tiktokHandle}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                className="w-8 h-8 flex items-center justify-center border border-line rounded-full text-stone hover:text-ink hover:border-ink transition-colors"
              >
                <TiktokIcon />
              </a>
            )}
          </div>
        )}
      </div>

      {creator.links.length === 0 ? (
        <div className="py-16 flex justify-center">
          <EmptyState title="Куратор пока не добавил товары." />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3">
          {creator.links.map((link, i) => (
            <div
              key={link.id}
              className={`flex flex-col gap-2 p-5 border-b border-line ${
                (i + 1) % 3 !== 0 ? "md:border-r" : ""
              } ${(i + 1) % 2 !== 0 ? "sm:border-r md:border-r-0" : ""}`}
            >
              <a href={link.wrappedUrl} className="flex flex-col gap-2 hover:opacity-85 transition-opacity">
                {link.imageUrl && (
                  <div className="aspect-[4/3] bg-line overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={link.imageUrl}
                      alt={link.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <span className="text-[10px] uppercase tracking-wide text-stone">
                  {CATEGORY_LABEL[link.category]}
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
              <FavoriteButton linkId={link.id} />
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
