import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { EmptyState } from "@/app/components/EmptyState";
import { placeholderAvatar } from "@/lib/avatar";
import { LandingNav } from "@/app/components/landing/LandingNav";
import { LandingFooter } from "@/app/components/landing/LandingFooter";

const CATEGORY_LABEL: Record<string, string> = {
  cosmetics: "Косметика",
  mens: "Мужские товары",
  clothing: "Одежда",
};

type WishlistLink = {
  id: string;
  title: string;
  imageUrl?: string;
  price?: number;
  category: string;
  wrappedUrl: string;
  creatorName?: string;
  creatorSlug?: string;
};

async function getWishlist(slug: string) {
  const h = await headers();
  const host = h.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  const res = await fetch(`${protocol}://${host}/api/wishlist/${slug}`, {
    cache: "no-store",
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to load wishlist");
  return res.json() as Promise<{
    slug: string;
    displayName: string;
    avatarUrl?: string;
    links: WishlistLink[];
  }>;
}

export default async function WishlistPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const wishlist = await getWishlist(slug);
  if (!wishlist) notFound();

  return (
    <main className="flex-1 flex flex-col">
      <LandingNav />

      <div className="text-center px-8 pt-32 pb-10 border-b border-line">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={wishlist.avatarUrl || placeholderAvatar(slug)}
          alt={wishlist.displayName}
          className="w-24 h-24 rounded-full object-cover mx-auto mb-6 bg-raise"
        />
        <span className="font-display italic text-stone text-base block mb-1">Вишлист</span>
        <h1 className="font-display text-4xl">{wishlist.displayName}</h1>
      </div>

      {wishlist.links.length === 0 ? (
        <div className="py-16 flex justify-center">
          <EmptyState title="Пока пусто — здесь появятся сохранённые товары." />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3">
          {wishlist.links.map((link, i) => (
            <a
              key={link.id}
              href={link.wrappedUrl}
              className={`flex flex-col gap-2 p-5 border-b border-line hover:opacity-85 transition-opacity ${
                (i + 1) % 3 !== 0 ? "md:border-r" : ""
              } ${(i + 1) % 2 !== 0 ? "sm:border-r md:border-r-0" : ""}`}
            >
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
                {CATEGORY_LABEL[link.category] ?? link.category}
                {link.creatorSlug && <> · от {link.creatorName}</>}
              </span>
              <div className="text-sm font-medium leading-snug">{link.title}</div>
              {link.price && (
                <div className="text-[13.5px] text-stone">
                  {link.price.toLocaleString("ru-RU")} ₽
                </div>
              )}
            </a>
          ))}
        </div>
      )}

      <LandingFooter />
    </main>
  );
}
