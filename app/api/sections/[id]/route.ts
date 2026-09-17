import { NextRequest, NextResponse } from "next/server";
import { requireCreator } from "@/lib/require-creator";
import { getSectionById, renameSection, setSectionHidden, setSectionIcon, deleteSection, moveSection } from "@/lib/store";

async function ownedSection(request: NextRequest, id: string) {
  const creator = await requireCreator(request);
  if (!creator) return { error: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };
  const section = await getSectionById(id);
  if (!section || section.creatorId !== creator.id) {
    return { error: NextResponse.json({ error: "Раздел не найден" }, { status: 404 }) };
  }
  return { creator, section };
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await ownedSection(request, id);
  if (result.error) return result.error;

  const body = await request.json().catch(() => null);
  if (typeof body?.name === "string" && body.name.trim()) {
    await renameSection(id, body.name.trim());
  }
  if (typeof body?.hidden === "boolean") {
    await setSectionHidden(id, body.hidden);
  }
  if (typeof body?.icon === "string") {
    await setSectionIcon(id, body.icon.trim() || null);
  }
  if (body?.move === "up" || body?.move === "down") {
    await moveSection(result.creator!.id, id, body.move);
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await ownedSection(request, id);
  if (result.error) return result.error;

  await deleteSection(id);
  return NextResponse.json({ ok: true });
}
