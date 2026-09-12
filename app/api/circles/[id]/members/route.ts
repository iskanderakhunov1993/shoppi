import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/require-user";
import {
  addCircleMember,
  getCircle,
  getCreatorById,
  getCreatorBySlug,
  removeCircleMember,
} from "@/lib/store";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(request);
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const circle = await getCircle(id);
  if (!circle || circle.userId !== user.id) {
    return NextResponse.json({ error: "Круг не найден" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const creatorId = body?.creatorId as string | undefined;
  const slug = body?.slug as string | undefined;
  const creator = creatorId ? await getCreatorById(creatorId) : slug ? await getCreatorBySlug(slug) : undefined;
  if (!creator) {
    return NextResponse.json({ error: "Unknown creator" }, { status: 400 });
  }

  await addCircleMember(circle.id, creator.id);
  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(request);
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const circle = await getCircle(id);
  if (!circle || circle.userId !== user.id) {
    return NextResponse.json({ error: "Круг не найден" }, { status: 404 });
  }

  const creatorId = request.nextUrl.searchParams.get("creatorId");
  if (!creatorId) {
    return NextResponse.json({ error: "creatorId query param is required" }, { status: 400 });
  }

  await removeCircleMember(circle.id, creatorId);
  return NextResponse.json({ ok: true });
}
