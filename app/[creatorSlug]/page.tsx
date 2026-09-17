import { cookies, headers } from "next/headers";
import { notFound } from "next/navigation";
import { FollowButton } from "@/app/components/FollowButton";
import { ShareButtonIcon } from "./ShareButton";
import { StorefrontGrid } from "./StorefrontGrid";
import { placeholderAvatar } from "@/lib/avatar";
import { LandingNav } from "@/app/components/landing/LandingNav";
import { LandingFooter } from "@/app/components/landing/LandingFooter";
import { CATEGORY_LABEL, type Category } from "@/lib/categories";
import { SESSION_COOKIE } from "@/lib/auth";
import { getSessionUserId, getCreatorByUserId } from "@/lib/store";

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
  brand?: string;
  subtype?: string;
  promoCode?: string;
  wrappedUrl: string;
  clicks: number;
  saves: number;
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
    hidePopular?: boolean;
    followers: number;
    sections?: { id: string; name: string; icon?: string; links: StorefrontLink[] }[];
  }>;
}

function PencilIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M11.3 2.3a1.4 1.4 0 0 1 2 2L5.4 12.2l-2.8.7.7-2.8L11.3 2.3z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
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

  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const viewerId = token ? await getSessionUserId(token) : null;
  const viewerCreator = viewerId ? await getCreatorByUserId(viewerId) : undefined;
  const isOwner = viewerCreator?.slug === creatorSlug;

  const h = await headers();
  const host = h.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  const storefrontUrl = `${protocol}://${host}/${creatorSlug}`;

  return (
    <main className="flex-1 flex flex-col">
      <LandingNav />

      <div className="relative text-center px-8 pt-32 pb-10 border-b border-line">
        {isOwner && (
          <div className="absolute top-36 right-6 flex items-center gap-2">
            <ShareButtonIcon url={storefrontUrl} />
            <a
              href="/dashboard?tab=profile"
              aria-label="Редактировать профиль"
              className="w-8 h-8 flex items-center justify-center border border-line rounded-full text-stone hover:text-ink hover:border-ink transition-colors"
            >
              <PencilIcon />
            </a>
          </div>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={creator.avatarUrl || placeholderAvatar(creatorSlug)}
          alt={creator.displayName}
          className="w-28 h-28 rounded-full object-cover mx-auto mb-6 bg-raise"
        />
        <span className="font-display italic text-stone text-base block mb-1">Курирует</span>
        <h1 className="font-display text-4xl mb-3">{creator.displayName}</h1>
        {creator.bio && (
          <p className="text-stone text-sm max-w-md mx-auto mb-3">{creator.bio}</p>
        )}
        {creator.categories && creator.categories.length > 0 && (
          <p className="font-display italic text-stone text-sm mb-6">
            {creator.categories.map((c) => CATEGORY_LABEL[c]).join(" · ")}
          </p>
        )}
        <div className="flex justify-center items-center gap-2.5 mb-5">
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

      <StorefrontGrid links={creator.links} sections={creator.sections} hidePopular={creator.hidePopular} />

      <LandingFooter />
    </main>
  );
}
