import { NextRequest, NextResponse } from "next/server";
import { requireCreator } from "@/lib/require-creator";
import { deleteCollection, getCollectionById, updateCollection } from "@/lib/store";

async function owned(request: NextRequest, id: string) {
  const creator = await requireCreator(request);
  if (!creator) return { error: NextResponse.json({ error: "Нужно войти в аккаунт" }, { status: 401 }) };
  const collection = await getCollectionById(id);
  if (!collection || collection.creatorId !== creator.id) {
    return { error: NextResponse.json({ error: "Коллекция не найдена" }, { status: 404 }) };
  }
  return { creator, collection };
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await owned(request, id);
  if (result.error) return result.error;

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim().slice(0, 80) : undefined;
  const linkIds = Array.isArray(body?.linkIds) ? body.linkIds.filter((x: unknown) => typeof x === "string") : undefined;
  await updateCollection(id, result.creator!.id, { name: name || undefined, linkIds });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await owned(request, id);
  if (result.error) return result.error;
  await deleteCollection(id);
  return NextResponse.json({ ok: true });
}
