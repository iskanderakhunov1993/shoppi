import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { FavoriteButton } from "@/app/components/FavoriteButton";
import { placeholderAvatar } from "@/lib/avatar";

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
    slug: string;
    displayName: string;
    bio?: string;
    links: StorefrontLink[];
    avatarUrl?: string;
  }>;
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
      <div className="text-center px-8 py-12 border-b border-line">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={creator.avatarUrl || placeholderAvatar(creatorSlug)}
          alt={creator.displayName}
          className="w-24 h-24 rounded-full object-cover mx-auto mb-5 bg-raise"
        />
        <div className="text-[11px] uppercase tracking-wider text-stone">
          Витрина куратора
        </div>
        <h1 className="font-display text-3xl mt-2 mb-2">{creator.displayName}</h1>
        {creator.bio && (
          <p className="text-stone text-sm max-w-md mx-auto">{creator.bio}</p>
        )}
      </div>

      {creator.links.length === 0 ? (
        <p className="font-display italic text-center text-stone py-16">
          Куратор пока не добавил товары.
        </p>
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
              </a>
              <FavoriteButton linkId={link.id} />
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
