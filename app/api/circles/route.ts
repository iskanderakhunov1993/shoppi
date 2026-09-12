import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/require-user";
import { createCircle, listCircleMembers, listCirclesByUser } from "@/lib/store";

export async function GET(request: NextRequest) {
  const user = await requireUser(request);
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const circles = await listCirclesByUser(user.id);
  const withMembers = await Promise.all(
    circles.map(async (circle) => {
      const members = await listCircleMembers(circle.id);
      return {
        id: circle.id,
        name: circle.name,
        createdAt: circle.createdAt,
        members: members.map((m) => ({ id: m.id, slug: m.slug, displayName: m.displayName, avatarUrl: m.avatarUrl })),
      };
    })
  );

  return NextResponse.json({ circles: withMembers });
}

export async function POST(request: NextRequest) {
  const user = await requireUser(request);
  if (!user || user.role !== "shopper") {
    return NextResponse.json({ error: "Shoppers only" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const name = String(body?.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "Название круга обязательно" }, { status: 400 });
  }

  const circle = await createCircle(user.id, name);
  return NextResponse.json({ id: circle.id, name: circle.name, createdAt: circle.createdAt, members: [] }, { status: 201 });
}
