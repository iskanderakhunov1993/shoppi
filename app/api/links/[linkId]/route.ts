import { NextRequest, NextResponse } from "next/server";
import { requireCreator } from "@/lib/require-creator";
import { deleteLink, getLink, updateLink } from "@/lib/store";

const CATEGORIES = ["cosmetics", "mens", "clothing"] as const;

/** Both handlers refuse to touch a link that belongs to someone else. */
function authorize(request: NextRequest, linkId: string) {
  const creator = requireCreator(request);
  if (!creator) return { error: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };

  const link = getLink(linkId);
  if (!link) return { error: NextResponse.json({ error: "Link not found" }, { status: 404 }) };
  if (link.creatorId !== creator.id) {
    return { error: NextResponse.json({ error: "Not your link" }, { status: 403 }) };
  }

  return { link };
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ linkId: string }> }
) {
  const { linkId } = await params;
  const { error } = authorize(request, linkId);
  if (error) return error;

  const body = await request.json().catch(() => null);
  const category = body?.category as string | undefined;

  if (category && !CATEGORIES.includes(category as (typeof CATEGORIES)[number])) {
    return NextResponse.json(
      { error: `category must be one of: ${CATEGORIES.join(", ")}` },
      { status: 400 }
    );
  }
  if (body?.title !== undefined && !String(body.title).trim()) {
    return NextResponse.json({ error: "title cannot be empty" }, { status: 400 });
  }

  const updated = updateLink(linkId, {
    title: body?.title,
    category: category as (typeof CATEGORIES)[number] | undefined,
    price: body?.price === null ? null : typeof body?.price === "number" ? body.price : undefined,
    imageUrl: body?.imageUrl === null ? null : body?.imageUrl,
  });

  return NextResponse.json({ ...updated, wrappedUrl: `/r/${linkId}` });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ linkId: string }> }
) {
  const { linkId } = await params;
  const { error } = authorize(request, linkId);
  if (error) return error;

  deleteLink(linkId);
  return NextResponse.json({ ok: true });
}
