import Link from "next/link";
import { AdLabel } from "@/app/components/AdLabel";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { LandingNav } from "@/app/components/landing/LandingNav";
import { LandingFooter } from "@/app/components/landing/LandingFooter";
import { FavoriteButton } from "@/app/components/FavoriteButton";
import { CopyLinkButton } from "../../CopyLinkButton";
import { CATEGORY_LABEL } from "@/lib/categories";
import { placeholderAvatar } from "@/lib/avatar";
import { pluralizeProducts } from "@/lib/plural";
import { SESSION_COOKIE } from "@/lib/auth";
import {
  getCollectionById,
  getCreatorBySlug,
  getCreatorByUserId,
  getSectionById,
  getSessionUserId,
  listLinksByCreator,
} from "@/lib/store";

export const dynamic = "force-dynamic";

type Params = { creatorSlug: string; collectionId: string };

/** Collections of a hidden section stay private, except to their owner. */
async function load({ creatorSlug, collectionId }: Params) {
  const creator = await getCreatorBySlug(creatorSlug);
  const collection = await getCollectionById(collectionId);
  if (!creator || !collection || collection.creatorId !== creator.id) return null;

  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const viewerId = token ? await getSessionUserId(token) : null;
  const isOwner = viewerId ? (await getCreatorByUserId(viewerId))?.id === creator.id : false;

  if (collection.sectionId && !isOwner) {
    const section = await getSectionById(collection.sectionId);
    if (!section || section.hidden) return null;
  }

  const byId = new Map((await listLinksByCreator(creator.id)).map((l) => [l.id, l]));
  const links = collection.linkIds.map((id) => byId.get(id)).filter((l) => l !== undefined);
  return { creator, collection, links, isOwner };
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const data = await load(await params);
  if (!data) return { title: "Коллекция не найдена — Shoppi" };
  return {
    title: `${data.collection.name} — ${data.creator.displayName} — Shoppi`,
    description: `Коллекция креатора ${data.creator.displayName}: ${data.links.length} товаров.`,
  };
}

export default async function CollectionPage({ params }: { params: Promise<Params> }) {
  const data = await load(await params);
  if (!data) notFound();
  const { creator, collection, links, isOwner } = data;

  return (
    <main className="flex-1 flex flex-col">
      <LandingNav />

      <header className="text-center px-6 pt-32 pb-10 border-b border-line">
        <Link href={`/${creator.slug}`} className="inline-flex items-center gap-2 text-stone hover:text-ink transition-colors text-[13px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={creator.avatarUrl || placeholderAvatar(creator.slug)}
            alt=""
            className="w-6 h-6 rounded-full object-cover bg-raise"
          />
          Креатор: {creator.displayName}
        </Link>
        <h1 className="font-display text-4xl md:text-5xl mt-5 mb-3">{collection.name}</h1>
        <p className="text-stone text-[13px] uppercase tracking-wider">
          {links.length} {pluralizeProducts(links.length)}
        </p>
        <div className="flex justify-center gap-2 mt-6">
          <CopyLinkButton path={`/${creator.slug}/c/${collection.id}`} />
          {isOwner && (
            <Link
              href={`/${creator.slug}`}
              className="inline-flex items-center text-[13px] px-3.5 py-1.5 rounded-full border border-line text-stone hover:text-ink hover:border-ink transition-colors whitespace-nowrap"
            >
              Изменить
            </Link>
          )}
        </div>
      </header>

      {links.length === 0 ? (
        <p className="font-display italic text-stone text-center py-16">В этой коллекции пока нет товаров.</p>
      ) : (
        <div className="max-w-[1200px] mx-auto w-full grid sm:grid-cols-2 lg:grid-cols-3">
          {links.map((link, i) => (
            <div
              key={link.id}
              className={`flex flex-col gap-3 p-6 border-b border-line ${
                (i + 1) % 3 !== 0 ? "lg:border-r" : ""
              } ${(i + 1) % 2 !== 0 ? "sm:border-r lg:border-r-0" : ""}`}
            >
              <div className="relative bg-line overflow-hidden">
                <a href={`/r/${link.id}`} className="block w-full">
                  {link.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={link.imageUrl} alt={link.title} className="w-full h-auto object-contain hover:opacity-90 transition-opacity" />
                  )}
                </a>
                <div className="absolute top-3 right-3">
                  <FavoriteButton linkId={link.id} variant="overlay" />
                </div>
              </div>
              <a href={`/r/${link.id}`} className="flex flex-col gap-1 hover:opacity-85 transition-opacity">
                <span className="text-[10px] uppercase tracking-wide text-stone">
                  {CATEGORY_LABEL[link.category] ?? link.category}
                  {link.brand && ` · ${link.brand}`}
                </span>
                <span className="text-sm font-medium leading-snug">{link.title}</span>
                <AdLabel isAd={link.isAd} adInfo={link.adInfo} />
                {link.price && <span className="text-[13.5px] text-stone">{link.price.toLocaleString("ru-RU")} ₽</span>}
              </a>
            </div>
          ))}
        </div>
      )}

      <LandingFooter />
    </main>
  );
}
