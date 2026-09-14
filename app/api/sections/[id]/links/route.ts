import { NextRequest, NextResponse } from "next/server";
import { requireCreator } from "@/lib/require-creator";
import { getSectionById, getLink, setLinkInSection } from "@/lib/store";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const creator = await requireCreator(request);
  if (!creator) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const section = await getSectionById(id);
  if (!section || section.creatorId !== creator.id) {
    return NextResponse.json({ error: "Раздел не найден" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const linkId = body?.linkId as string | undefined;
  const included = Boolean(body?.included);
  if (!linkId) {
    return NextResponse.json({ error: "linkId обязателен" }, { status: 400 });
  }
  const link = await getLink(linkId);
  if (!link || link.creatorId !== creator.id) {
    return NextResponse.json({ error: "Товар не найден" }, { status: 404 });
  }

  await setLinkInSection(id, linkId, included);
  return NextResponse.json({ ok: true });
}
