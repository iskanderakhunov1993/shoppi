import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/require-user";
import {
  circleFeed,
  countClicksForLinks,
  countFollowers,
  followCreator,
  getCreatorById,
  getCreatorBySlug,
  listFollowedCreators,
  unfollowCreator,
} from "@/lib/store";

export async function GET(request: NextRequest) {
  const user = requireUser(request);
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const creators = listFollowedCreators(user.id).map((c) => ({
    id: c.id,
    slug: c.slug,
    displayName: c.displayName,
    bio: c.bio,
    avatarUrl: c.avatarUrl,
  }));

  const feedLinks = circleFeed(user.id);
  const counts = countClicksForLinks(feedLinks.map((l) => l.id));
  const creatorById = new Map(listFollowedCreators(user.id).map((c) => [c.id, c]));

  const feed = feedLinks.map((link) => ({
    ...link,
    wrappedUrl: `/r/${link.id}`,
    clicks: counts.get(link.id)?.human ?? 0,
    creatorName: creatorById.get(link.creatorId)?.displayName,
    creatorSlug: creatorById.get(link.creatorId)?.slug,
  }));

  return NextResponse.json({ creators, feed });
}

export async function POST(request: NextRequest) {
  const user = requireUser(request);
  if (!user || user.role !== "shopper") {
    return NextResponse.json({ error: "Shoppers only" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const creatorId = body?.creatorId as string | undefined;
  const slug = body?.slug as string | undefined;

  const creator = creatorId ? getCreatorById(creatorId) : slug ? getCreatorBySlug(slug) : undefined;
  if (!creator) {
    return NextResponse.json({ error: "Unknown creator" }, { status: 400 });
  }

  followCreator(user.id, creator.id);
  return NextResponse.json({ ok: true, followers: countFollowers(creator.id) }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const user = requireUser(request);
  if (!user || user.role !== "shopper") {
    return NextResponse.json({ error: "Shoppers only" }, { status: 403 });
  }

  const creatorId = request.nextUrl.searchParams.get("creatorId");
  if (!creatorId) {
    return NextResponse.json({ error: "creatorId query param is required" }, { status: 400 });
  }

  unfollowCreator(user.id, creatorId);
  return NextResponse.json({ ok: true, followers: countFollowers(creatorId) });
}
