import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/require-user";
import { countFollowers, getCreatorById, listLinksByCategory, type Link } from "@/lib/store";

const CATEGORIES = ["cosmetics", "mens", "clothing"] as const;

function isCategory(value: string): value is Link["category"] {
  return (CATEGORIES as readonly string[]).includes(value);
}

export async function GET(request: NextRequest) {
  const user = await requireUser(request);
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const categoriesParam = request.nextUrl.searchParams.get("categories") ?? "";
  const categories = categoriesParam
    .split(",")
    .map((c) => c.trim())
    .filter(isCategory);

  if (categories.length === 0) {
    return NextResponse.json({ creators: [] });
  }

  const linksByCategory = await Promise.all(
    categories.map((category) => listLinksByCategory(category, { limit: 100 }))
  );
  const creatorIds = [...new Set(linksByCategory.flat().map((l) => l.creatorId))];

  const creators = (
    await Promise.all(
      creatorIds.map(async (id) => {
        const creator = await getCreatorById(id);
        if (!creator) return null;
        return {
          id: creator.id,
          slug: creator.slug,
          displayName: creator.displayName,
          bio: creator.bio,
          avatarUrl: creator.avatarUrl,
          followers: await countFollowers(creator.id),
        };
      })
    )
  ).filter((c): c is NonNullable<typeof c> => c !== null);

  creators.sort((a, b) => b.followers - a.followers);

  return NextResponse.json({ creators: creators.slice(0, 12) });
}
