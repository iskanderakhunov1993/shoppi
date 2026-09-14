import { NextRequest, NextResponse } from "next/server";
import { requireCreator } from "@/lib/require-creator";
import { createSection, listSectionsByCreator, listSectionLinkIds } from "@/lib/store";

export async function GET(request: NextRequest) {
  const creator = await requireCreator(request);
  if (!creator) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const sections = await listSectionsByCreator(creator.id);
  const withLinkIds = await Promise.all(
    sections.map(async (s) => ({ ...s, linkIds: [...(await listSectionLinkIds(s.id))] }))
  );

  return NextResponse.json({ sections: withLinkIds });
}

export async function POST(request: NextRequest) {
  const creator = await requireCreator(request);
  if (!creator) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const name = String(body?.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "Название раздела обязательно" }, { status: 400 });
  }

  const section = await createSection(creator.id, name);
  return NextResponse.json({ ...section, linkIds: [] }, { status: 201 });
}
