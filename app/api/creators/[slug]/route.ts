import { NextRequest, NextResponse } from "next/server";
import { countClicksForLinks, countFollowers, getCreatorBySlug, listLinksByCreator } from "@/lib/store";

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
  const counts = await countClicksForLinks(linkRows.map((l) => l.id));
  const links = linkRows.map((link) => ({
    id: link.id,
    title: link.title,
    imageUrl: link.imageUrl,
    price: link.price,
    category: link.category,
    promoCode: link.promoCode,
    wrappedUrl: `/r/${link.id}`,
    clicks: counts.get(link.id)?.human ?? 0,
  }));

  return NextResponse.json({
    id: creator.id,
    slug: creator.slug,
    displayName: creator.displayName,
    bio: creator.bio,
    avatarUrl: creator.avatarUrl,
    instagramHandle: creator.instagramHandle,
    tiktokHandle: creator.tiktokHandle,
    categories: creator.categories ?? [],
    followers: await countFollowers(creator.id),
    links,
  });
}
