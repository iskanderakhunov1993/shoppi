import { NextRequest, NextResponse } from "next/server";
import { countClicksForLinks, countFavoritesForLinks, countFollowers, getCreatorBySlug, listLinksByCreator, listPublicSections } from "@/lib/store";

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
  const counts = await countClicksForLinks(linkIds);
  const saves = await countFavoritesForLinks(linkIds);
  const links = linkRows.map((link) => ({
    id: link.id,
    title: link.title,
    imageUrl: link.imageUrl,
    price: link.price,
    category: link.category,
    brand: link.brand,
    subtype: link.subtype,
    promoCode: link.promoCode,
    wrappedUrl: `/r/${link.id}`,
    clicks: counts.get(link.id)?.human ?? 0,
    saves: saves.get(link.id) ?? 0,
  }));

  const publicSections = await listPublicSections(creator.id);
  const sections = publicSections.map((s) => ({
    id: s.id,
    name: s.name,
    icon: s.icon,
    links: s.links.map((link) => ({
      id: link.id,
      title: link.title,
      imageUrl: link.imageUrl,
      price: link.price,
      category: link.category,
      brand: link.brand,
      subtype: link.subtype,
      promoCode: link.promoCode,
      wrappedUrl: `/r/${link.id}`,
      clicks: counts.get(link.id)?.human ?? 0,
      saves: saves.get(link.id) ?? 0,
    })),
  }));

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
    categories: creator.categories ?? [],
    hidePopular: creator.hidePopular,
    followers: await countFollowers(creator.id),
    links,
    sections,
  });
}
