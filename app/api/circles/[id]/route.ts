import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/require-user";
import {
  circleMembersFeed,
  countClicksForLinks,
  deleteCircle,
  getCircle,
  listCircleMembers,
} from "@/lib/store";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(request);
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const circle = await getCircle(id);
  if (!circle || circle.userId !== user.id) {
    return NextResponse.json({ error: "Круг не найден" }, { status: 404 });
  }

  const members = await listCircleMembers(circle.id);
  const feedLinks = await circleMembersFeed(circle.id);
  const counts = await countClicksForLinks(feedLinks.map((l) => l.id));
  const creatorById = new Map(members.map((m) => [m.id, m]));

  const feed = feedLinks.map((link) => ({
    ...link,
    wrappedUrl: `/r/${link.id}`,
    clicks: counts.get(link.id)?.human ?? 0,
    creatorName: creatorById.get(link.creatorId)?.displayName,
    creatorSlug: creatorById.get(link.creatorId)?.slug,
  }));

  return NextResponse.json({
    id: circle.id,
    name: circle.name,
    members: members.map((m) => ({ id: m.id, slug: m.slug, displayName: m.displayName, avatarUrl: m.avatarUrl })),
    feed,
  });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(request);
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const ok = await deleteCircle(id, user.id);
  if (!ok) {
    return NextResponse.json({ error: "Круг не найден" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
