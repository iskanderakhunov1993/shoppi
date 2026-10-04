import { NextRequest, NextResponse } from "next/server";
import { getCreatorById, getUserBySlug, listFavoriteLinks } from "@/lib/store";
import { requireUser } from "@/lib/require-user";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const user = await getUserBySlug(slug);
  if (!user || user.role !== "shopper") {
    return NextResponse.json({ error: "Wishlist not found" }, { status: 404 });
  }
  // Private by default: only the owner sees it until they share it.
  const viewer = await requireUser(request);
  const isOwner = viewer?.id === user.id;
  if (!user.wishlistPublic && !isOwner) {
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
      isAd: link.isAd,
      adInfo: link.adInfo,
      creatorName: creator?.displayName,
      creatorSlug: creator?.slug,
    };
  });

  return NextResponse.json({
    isPublic: Boolean(user.wishlistPublic),
    isOwner,
    bio: user.bio ?? "",
    slug: user.slug,
    displayName: user.displayName ?? "Покупатель",
    avatarUrl: user.avatarUrl,
    links,
  });
}
