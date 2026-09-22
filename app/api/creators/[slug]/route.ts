import { NextRequest, NextResponse } from "next/server";
import { countClicksForLinks, countCreatorsByArticle, countFavoritesForLinks, countFollowers, getCreatorBySlug, listCollectionsByCreator, listLinksByCreator } from "@/lib/store";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const creator = await getCreatorBySlug(slug);
  if (!creator) {
    return NextResponse.json({ error: "Creator not found" }, { status: 404 });
  }

  const linkRows = await listLinksByCreator(creator.id);
  const linkIds = linkRows.map((l) => l.id);
  const weekSince = new Date(Date.now() - 7 * 24 * 3600_000).toISOString();
  const monthSince = new Date(Date.now() - 30 * 24 * 3600_000).toISOString();
  const [counts, countsWeek, countsMonth, saves, sameProduct] = await Promise.all([
    countClicksForLinks(linkIds),
    countClicksForLinks(linkIds, weekSince),
    countClicksForLinks(linkIds, monthSince),
    countFavoritesForLinks(linkIds),
    countCreatorsByArticle(linkRows.map((l) => ({ marketplace: l.marketplace, articleId: l.articleId }))),
  ]);
  const links = linkRows.map((link) => {
    const stat =
      link.marketplace && link.articleId ? sameProduct.get(`${link.marketplace}:${link.articleId}`) : undefined;
    return {
      id: link.id,
      title: link.title,
      imageUrl: link.imageUrl,
      price: link.price,
      category: link.category,
      brand: link.brand,
      subtype: link.subtype,
      promoCode: link.promoCode,
      isAd: link.isAd,
      adInfo: link.adInfo,
      wrappedUrl: `/r/${link.id}`,
      clicks: counts.get(link.id)?.human ?? 0,
      clicksWeek: countsWeek.get(link.id)?.human ?? 0,
      clicksMonth: countsMonth.get(link.id)?.human ?? 0,
      saves: saves.get(link.id) ?? 0,
      sameProductCreators: stat?.creatorCount,
      sameProductAvatars: stat?.sampleAvatars,
    };
  });

  return NextResponse.json({
    id: creator.id,
    slug: creator.slug,
    displayName: creator.displayName,
    bio: creator.bio,
    avatarUrl: creator.avatarUrl,
    instagramHandle: creator.instagramHandle,
    tiktokHandle: creator.tiktokHandle,
    telegramHandle: creator.telegramHandle,
    youtubeHandle: creator.youtubeHandle,
    contactEmail: creator.contactEmail,
    categories: creator.categories ?? [],
    hidePopular: creator.hidePopular,
    followers: await countFollowers(creator.id),
    links,
    collections: (await listCollectionsByCreator(creator.id)).map((c) => ({
      id: c.id,
      name: c.name,
      linkIds: c.linkIds,
    })),
  });
}
