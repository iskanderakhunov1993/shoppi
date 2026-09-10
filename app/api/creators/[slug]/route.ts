import { NextRequest, NextResponse } from "next/server";
import { countFollowers, getCreatorBySlug, listLinksByCreator } from "@/lib/store";

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
  const links = linkRows.map((link) => ({
    id: link.id,
    title: link.title,
    imageUrl: link.imageUrl,
    price: link.price,
    category: link.category,
    wrappedUrl: `/r/${link.id}`,
  }));

  return NextResponse.json({
    id: creator.id,
    slug: creator.slug,
    displayName: creator.displayName,
    bio: creator.bio,
    avatarUrl: creator.avatarUrl,
    followers: await countFollowers(creator.id),
    links,
  });
}
