import { NextRequest, NextResponse } from "next/server";
import { requireCreator } from "@/lib/require-creator";
import { createCollection, getSectionById } from "@/lib/store";

export async function POST(request: NextRequest) {
  const creator = await requireCreator(request);
  if (!creator) {
    return NextResponse.json({ error: "Нужно войти в аккаунт" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const name = String(body?.name ?? "").trim().slice(0, 80);
  if (!name) {
    return NextResponse.json({ error: "Название коллекции обязательно" }, { status: 400 });
  }

  let sectionId: string | null = null;
  if (typeof body?.sectionId === "string" && body.sectionId) {
    const section = await getSectionById(body.sectionId);
    if (!section || section.creatorId !== creator.id) {
      return NextResponse.json({ error: "Раздел не найден" }, { status: 404 });
    }
    sectionId = section.id;
  }

  const linkIds = Array.isArray(body?.linkIds) ? body.linkIds.filter((x: unknown) => typeof x === "string") : [];
  const collection = await createCollection(creator.id, { name, sectionId, linkIds });
  return NextResponse.json(collection, { status: 201 });
}
