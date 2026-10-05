import { NextRequest, NextResponse } from "next/server";
import { clientIpFrom } from "@/lib/bot-detection";
import { visitorFingerprint } from "@/lib/auth";
import { track } from "@/lib/events";
import { requireUser } from "@/lib/require-user";
import { addFavorite, getLink, listFavoriteLinks, removeFavorite } from "@/lib/store";

export async function GET(request: NextRequest) {
  const user = await requireUser(request);
  if (!user) {
    return NextResponse.json({ error: "Нужно войти в аккаунт" }, { status: 401 });
  }
  if (user.role !== "shopper") {
    return NextResponse.json({ error: "Доступно только покупателям" }, { status: 403 });
  }

  const links = await listFavoriteLinks(user.id);
  const favorites = links.map((link) => ({
    ...link,
    wrappedUrl: `/r/${link.id}`,
  }));
  return NextResponse.json({ favorites });
}

export async function POST(request: NextRequest) {
  const user = await requireUser(request);
  if (!user) {
    return NextResponse.json({ error: "Нужно войти в аккаунт" }, { status: 401 });
  }
  if (user.role !== "shopper") {
    return NextResponse.json({ error: "Доступно только покупателям" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const linkId = body?.linkId as string | undefined;
  const link = linkId ? await getLink(linkId) : undefined;
  if (!linkId || !link) {
    return NextResponse.json({ error: "Unknown linkId" }, { status: 400 });
  }

  await addFavorite(user.id, linkId);
  const visitor = visitorFingerprint(clientIpFrom(request.headers), request.headers.get("user-agent") ?? "");
  await track("favorite_add", { visitor, userId: user.id, creatorId: link.creatorId, linkId });
  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const user = await requireUser(request);
  if (!user) {
    return NextResponse.json({ error: "Нужно войти в аккаунт" }, { status: 401 });
  }
  if (user.role !== "shopper") {
    return NextResponse.json({ error: "Доступно только покупателям" }, { status: 403 });
  }

  const linkId = request.nextUrl.searchParams.get("linkId");
  if (!linkId) {
    return NextResponse.json({ error: "linkId query param is required" }, { status: 400 });
  }

  await removeFavorite(user.id, linkId);
  return NextResponse.json({ ok: true });
}
