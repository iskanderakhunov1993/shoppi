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
  const user = await requireUser(request);
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const followedCreators = await listFollowedCreators(user.id);
  const creators = followedCreators.map((c) => ({
    id: c.id,
    slug: c.slug,
    displayName: c.displayName,
    bio: c.bio,
    avatarUrl: c.avatarUrl,
  }));

  const feedLinks = await circleFeed(user.id);
  const counts = await countClicksForLinks(feedLinks.map((l) => l.id));
  const creatorById = new Map(followedCreators.map((c) => [c.id, c]));

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
  const user = await requireUser(request);
  if (!user || user.role !== "shopper") {
    return NextResponse.json({ error: "Shoppers only" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const creatorId = body?.creatorId as string | undefined;
  const slug = body?.slug as string | undefined;

  const creator = creatorId
    ? await getCreatorById(creatorId)
    : slug
      ? await getCreatorBySlug(slug)
      : undefined;
  if (!creator) {
    return NextResponse.json({ error: "Unknown creator" }, { status: 400 });
  }

  await followCreator(user.id, creator.id);
  return NextResponse.json({ ok: true, followers: await countFollowers(creator.id) }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const user = await requireUser(request);
  if (!user || user.role !== "shopper") {
    return NextResponse.json({ error: "Shoppers only" }, { status: 403 });
  }

  const creatorId = request.nextUrl.searchParams.get("creatorId");
  if (!creatorId) {
    return NextResponse.json({ error: "creatorId query param is required" }, { status: 400 });
  }

  await unfollowCreator(user.id, creatorId);
  return NextResponse.json({ ok: true, followers: await countFollowers(creatorId) });
}
