import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/require-user";
import { getCreatorByUserId, setAffiliateTemplate, setBrandArticles, updateCreator } from "@/lib/store";
import { parseArticleInput } from "@/lib/marketplace";

/** Accepts a bare handle, an @handle, or a full profile URL — a person
 * copying from their bio shouldn't have to think about which one to paste. */
function normalizeHandle(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const fromUrl = trimmed.match(/(?:instagram\.com|tiktok\.com)\/@?([\w.]+)/i);
  if (fromUrl) return fromUrl[1];
  return trimmed.replace(/^@/, "");
}

export async function GET(request: NextRequest) {
  const user = await requireUser(request);
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (user.role === "creator") {
    const creator = await getCreatorByUserId(user.id);
    return NextResponse.json({
      role: user.role,
      email: user.email,
      displayName: creator?.displayName ?? user.email,
      slug: creator?.slug,
      bio: creator?.bio ?? "",
      avatarUrl: creator?.avatarUrl ?? "",
      instagramHandle: creator?.instagramHandle ?? "",
      tiktokHandle: creator?.tiktokHandle ?? "",
    });
  }

  if (user.role === "brand") {
    return NextResponse.json({
      role: user.role,
      email: user.email,
      displayName: user.brandDomain ?? user.email,
      brandDomain: user.brandDomain,
      brandArticles: user.brandArticles ?? [],
      affiliateTemplate: user.affiliateTemplate ?? "",
    });
  }

  return NextResponse.json({
    role: user.role,
    email: user.email,
    displayName: user.email.split("@")[0],
  });
}

export async function PUT(request: NextRequest) {
  const user = await requireUser(request);
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);

  if (user.role === "creator") {
    const creator = await getCreatorByUserId(user.id);
    if (!creator) {
      return NextResponse.json({ error: "Creator profile missing" }, { status: 404 });
    }
    if (body?.displayName !== undefined && !String(body.displayName).trim()) {
      return NextResponse.json({ error: "Имя не может быть пустым" }, { status: 400 });
    }

    const updated = await updateCreator(creator.id, {
      displayName: body?.displayName?.trim(),
      bio: body?.bio,
      avatarUrl: body?.avatarUrl,
      instagramHandle: body?.instagramHandle !== undefined ? normalizeHandle(body.instagramHandle) : undefined,
      tiktokHandle: body?.tiktokHandle !== undefined ? normalizeHandle(body.tiktokHandle) : undefined,
    });

    return NextResponse.json({
      displayName: updated?.displayName,
      bio: updated?.bio ?? "",
      avatarUrl: updated?.avatarUrl ?? "",
      slug: updated?.slug,
      instagramHandle: updated?.instagramHandle ?? "",
      tiktokHandle: updated?.tiktokHandle ?? "",
    });
  }

  if (user.role === "brand") {
    const raw = String(body?.articles ?? "");
    const { articles, unrecognized } = parseArticleInput(raw);
    await setBrandArticles(user.id, articles);

    if (body?.affiliateTemplate !== undefined) {
      const template = String(body.affiliateTemplate).trim();
      if (template && !template.includes("{url}")) {
        return NextResponse.json(
          { error: "Шаблон должен содержать {url} — место, куда подставится ссылка на товар" },
          { status: 400 }
        );
      }
      await setAffiliateTemplate(user.id, template || null);
    }

    return NextResponse.json({ brandArticles: articles, unrecognized });
  }

  return NextResponse.json({ error: "Nothing to update for this role" }, { status: 400 });
}
