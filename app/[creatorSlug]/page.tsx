import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { FollowButton } from "@/app/components/FollowButton";
import { StorefrontGrid } from "./StorefrontGrid";
import { placeholderAvatar } from "@/lib/avatar";
import { LandingNav } from "@/app/components/landing/LandingNav";
import { LandingFooter } from "@/app/components/landing/LandingFooter";
import { CATEGORY_LABEL, type Category } from "@/lib/categories";

function pluralizeShoppers(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "покупатель";
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return "покупателя";
  return "покупателей";
}

type StorefrontLink = {
  id: string;
  title: string;
  imageUrl?: string;
  price?: number;
  category: Category;
  promoCode?: string;
  wrappedUrl: string;
  clicks: number;
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
    categories?: Category[];
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
    <main className="flex-1 flex flex-col">
      <LandingNav />

      <div className="text-center px-8 pt-32 pb-10 border-b border-line">
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
        {creator.categories && creator.categories.length > 0 && (
          <div className="flex justify-center flex-wrap gap-2 mb-6">
            {creator.categories.map((c) => (
              <span
                key={c}
                className="text-[10.5px] uppercase tracking-wide text-stone border border-line px-2.5 py-1"
              >
                {CATEGORY_LABEL[c]}
              </span>
            ))}
          </div>
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

      <StorefrontGrid links={creator.links} />

      <LandingFooter />
    </main>
  );
}
