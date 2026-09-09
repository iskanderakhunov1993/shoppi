import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/require-user";
import { addFavorite, getLink, listFavoriteLinks, removeFavorite } from "@/lib/store";

export async function GET(request: NextRequest) {
  const user = requireUser(request);
  if (!user || user.role !== "shopper") {
    return NextResponse.json({ error: "Shoppers only" }, { status: 403 });
  }

  const favorites = listFavoriteLinks(user.id).map((link) => ({
    ...link,
    wrappedUrl: `/r/${link.id}`,
  }));
  return NextResponse.json({ favorites });
}

export async function POST(request: NextRequest) {
  const user = requireUser(request);
  if (!user || user.role !== "shopper") {
    return NextResponse.json({ error: "Shoppers only" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const linkId = body?.linkId as string | undefined;
  if (!linkId || !getLink(linkId)) {
    return NextResponse.json({ error: "Unknown linkId" }, { status: 400 });
  }

  addFavorite(user.id, linkId);
  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const user = requireUser(request);
  if (!user || user.role !== "shopper") {
    return NextResponse.json({ error: "Shoppers only" }, { status: 403 });
  }

  const linkId = request.nextUrl.searchParams.get("linkId");
  if (!linkId) {
    return NextResponse.json({ error: "linkId query param is required" }, { status: 400 });
  }

  removeFavorite(user.id, linkId);
  return NextResponse.json({ ok: true });
}
