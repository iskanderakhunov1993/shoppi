import { NextRequest, NextResponse } from "next/server";
import { getCreatorById, getUserBySlug, listFavoriteLinks } from "@/lib/store";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const user = await getUserBySlug(slug);
  if (!user || user.role !== "shopper") {
    return NextResponse.json({ error: "Wishlist not found" }, { status: 404 });
  }

  const linkRows = await listFavoriteLinks(user.id);
  const creatorsById = new Map(
    await Promise.all(
      [...new Set(linkRows.map((l) => l.creatorId))].map(
        async (id) => [id, await getCreatorById(id)] as const
      )
    )
  );

  const links = linkRows.map((link) => {
    const creator = creatorsById.get(link.creatorId);
    return {
      id: link.id,
      title: link.title,
      imageUrl: link.imageUrl,
      price: link.price,
      category: link.category,
      wrappedUrl: `/r/${link.id}`,
      creatorName: creator?.displayName,
      creatorSlug: creator?.slug,
    };
  });

  return NextResponse.json({
    slug: user.slug,
    displayName: user.displayName ?? user.email.split("@")[0],
    avatarUrl: user.avatarUrl,
    links,
  });
}
