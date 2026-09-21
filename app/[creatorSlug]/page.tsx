import { cookies, headers } from "next/headers";
import { notFound } from "next/navigation";
import { FollowButton } from "@/app/components/FollowButton";
import { AddToCircleButton } from "./AddToCircleButton";
import { QuickAddProductButton } from "./QuickAddProductButton";
import { StorefrontGrid } from "./StorefrontGrid";
import { placeholderAvatar } from "@/lib/avatar";
import { LandingNav } from "@/app/components/landing/LandingNav";
import { LandingFooter } from "@/app/components/landing/LandingFooter";
import { SOCIALS } from "@/app/components/SocialIcons";
import { CATEGORY_LABEL, type Category } from "@/lib/categories";
import { SESSION_COOKIE } from "@/lib/auth";
import { getSessionUserId, getCreatorByUserId, getUserById } from "@/lib/store";

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
    telegramHandle?: string;
    youtubeHandle?: string;
    categories?: Category[];
    hidePopular?: boolean;
    followers: number;
    sections?: { id: string; name: string; icon?: string; links: StorefrontLink[] }[];
    collections?: { id: string; name: string; sectionId: string | null; linkIds: string[] }[];
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
  const viewerUser = viewerId && !isOwner ? await getUserById(viewerId) : undefined;
  const isShopperViewer = viewerUser?.role === "shopper";

  const h = await headers();
  const host = h.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  const storefrontUrl = `${protocol}://${host}/${creatorSlug}`;

  return (
    <main className="flex-1 flex flex-col">
      <LandingNav />

      <div className="relative text-center px-8 pt-36 pb-12">
        {isOwner && (
          <div className="absolute top-36 right-6 flex items-center gap-2">
            <QuickAddProductButton />
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
          className="w-36 h-36 rounded-full object-cover mx-auto mb-7 bg-raise"
        />
        <span className="font-display italic text-stone text-base block mb-1">Курирует</span>
        <h1 className="font-display text-4xl mb-3">{creator.displayName}</h1>
        {creator.bio && (
          <p className="text-stone text-[15px] max-w-md mx-auto mb-2">{creator.bio}</p>
        )}
        {creator.categories && creator.categories.length > 0 && (
          <p className="text-stone text-[15px] mb-7">
            {creator.categories.map((c) => CATEGORY_LABEL[c]).join(" · ")}
          </p>
        )}
        {!isOwner && (
          <div className="flex flex-col sm:flex-row justify-center items-center gap-2.5 mb-6 px-6">
            <FollowButton creatorId={creator.id} initialFollowers={creator.followers} />
            {isShopperViewer && <AddToCircleButton creatorId={creator.id} />}
          </div>
        )}
        <p className="font-display italic text-stone text-sm mb-5">
          Доверяют {creator.followers.toLocaleString("ru-RU")}{" "}
          {pluralizeShoppers(creator.followers)}
        </p>
        {SOCIALS.some((n) => creator[n.key]) && (
          <div className="flex justify-center gap-4">
            {SOCIALS.map(({ key, label, Icon, url }) =>
              creator[key] ? (
                <a
                  key={key}
                  href={url(creator[key]!)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="text-stone hover:text-ink transition-colors"
                >
                  <Icon />
                </a>
              ) : null
            )}
          </div>
        )}
      </div>

      <StorefrontGrid
        links={creator.links}
        sections={creator.sections}
        collections={creator.collections}
        storefrontUrl={storefrontUrl}
        hidePopular={creator.hidePopular}
        isOwner={isOwner}
      />

      <LandingFooter />
    </main>
  );
}
