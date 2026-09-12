import { NextRequest, NextResponse } from "next/server";
import { requireCreator } from "@/lib/require-creator";
import { addLink, countClicksForLinks, listLinksByCreator } from "@/lib/store";
import { parseMarketplaceItem } from "@/lib/marketplace";
import { CATEGORIES } from "@/lib/categories";

export async function GET(request: NextRequest) {
  const creator = await requireCreator(request);
  if (!creator) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const rows = await listLinksByCreator(creator.id);
  // One grouped query for every link, instead of a count per link.
  const counts = await countClicksForLinks(rows.map((l) => l.id));

  const links = rows.map((link) => ({
    ...link,
    clicks: counts.get(link.id)?.human ?? 0,
    clicksTotal: counts.get(link.id)?.total ?? 0,
    wrappedUrl: `/r/${link.id}`,
  }));

  return NextResponse.json({ links });
}

export async function POST(request: NextRequest) {
  const creator = await requireCreator(request);
  if (!creator) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const title = body?.title as string | undefined;
  const targetUrl = body?.targetUrl as string | undefined;
  const category = body?.category as string | undefined;

  if (!title || !targetUrl || !category) {
    return NextResponse.json(
      { error: "title, targetUrl, and category are required" },
      { status: 400 }
    );
  }
  if (!CATEGORIES.includes(category as (typeof CATEGORIES)[number])) {
    return NextResponse.json(
      { error: `category must be one of: ${CATEGORIES.join(", ")}` },
      { status: 400 }
    );
  }
  try {
    new URL(targetUrl);
  } catch {
    return NextResponse.json({ error: "targetUrl must be a valid URL" }, { status: 400 });
  }

  const { marketplace, articleId } = parseMarketplaceItem(targetUrl);

  const link = await addLink({
    creatorId: creator.id,
    title,
    targetUrl,
    category: category as (typeof CATEGORIES)[number],
    imageUrl: body?.imageUrl || undefined,
    price: typeof body?.price === "number" ? body.price : undefined,
    promoCode: body?.promoCode || undefined,
    marketplace,
    articleId,
  });

  return NextResponse.json({ ...link, wrappedUrl: `/r/${link.id}` }, { status: 201 });
}
