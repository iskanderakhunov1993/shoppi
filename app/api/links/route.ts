import { NextRequest, NextResponse } from "next/server";
import { requireCreator } from "@/lib/require-creator";
import { addLink, countClicksForLink, listLinksByCreator } from "@/lib/store";

const CATEGORIES = ["cosmetics", "mens", "clothing"] as const;

export async function GET(request: NextRequest) {
  const creator = requireCreator(request);
  if (!creator) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const links = listLinksByCreator(creator.id).map((link) => ({
    ...link,
    clicks: countClicksForLink(link.id),
    wrappedUrl: `/r/${link.id}`,
  }));

  return NextResponse.json({ links });
}

export async function POST(request: NextRequest) {
  const creator = requireCreator(request);
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
    // eslint-disable-next-line no-new
    new URL(targetUrl);
  } catch {
    return NextResponse.json({ error: "targetUrl must be a valid URL" }, { status: 400 });
  }

  const link = addLink({
    creatorId: creator.id,
    title,
    targetUrl,
    category: category as (typeof CATEGORIES)[number],
    imageUrl: body?.imageUrl || undefined,
    price: typeof body?.price === "number" ? body.price : undefined,
  });

  return NextResponse.json({ ...link, wrappedUrl: `/r/${link.id}` }, { status: 201 });
}
