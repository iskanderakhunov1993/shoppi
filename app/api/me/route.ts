import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/require-user";
import { getCreatorByUserId, setBrandArticles, updateCreator } from "@/lib/store";
import { parseArticleInput } from "@/lib/marketplace";

export async function GET(request: NextRequest) {
  const user = requireUser(request);
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (user.role === "creator") {
    const creator = getCreatorByUserId(user.id);
    return NextResponse.json({
      role: user.role,
      email: user.email,
      displayName: creator?.displayName ?? user.email,
      slug: creator?.slug,
      bio: creator?.bio ?? "",
      avatarUrl: creator?.avatarUrl ?? "",
    });
  }

  if (user.role === "brand") {
    return NextResponse.json({
      role: user.role,
      email: user.email,
      displayName: user.brandDomain ?? user.email,
      brandDomain: user.brandDomain,
      brandArticles: user.brandArticles ?? [],
    });
  }

  return NextResponse.json({
    role: user.role,
    email: user.email,
    displayName: user.email.split("@")[0],
  });
}

export async function PUT(request: NextRequest) {
  const user = requireUser(request);
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);

  if (user.role === "creator") {
    const creator = getCreatorByUserId(user.id);
    if (!creator) {
      return NextResponse.json({ error: "Creator profile missing" }, { status: 404 });
    }
    if (body?.displayName !== undefined && !String(body.displayName).trim()) {
      return NextResponse.json({ error: "Имя не может быть пустым" }, { status: 400 });
    }

    const updated = updateCreator(creator.id, {
      displayName: body?.displayName?.trim(),
      bio: body?.bio,
      avatarUrl: body?.avatarUrl,
    });

    return NextResponse.json({
      displayName: updated?.displayName,
      bio: updated?.bio ?? "",
      avatarUrl: updated?.avatarUrl ?? "",
      slug: updated?.slug,
    });
  }

  if (user.role === "brand") {
    const raw = String(body?.articles ?? "");
    const { articles, unrecognized } = parseArticleInput(raw);
    setBrandArticles(user.id, articles);
    return NextResponse.json({ brandArticles: articles, unrecognized });
  }

  return NextResponse.json({ error: "Nothing to update for this role" }, { status: 400 });
}
