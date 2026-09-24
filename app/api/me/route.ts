import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/require-user";
import {
  ensureUserSlug,
  getCreatorByUserId,
  setAffiliateTemplate,
  setBrandArticles,
  setUserInterests,
  updateCreator,
  updateUserProfile,
} from "@/lib/store";
import { parseArticleInput } from "@/lib/marketplace";
import { isCategory } from "@/lib/categories";

/** Accepts a bare handle, an @handle, or a full profile URL — a person
 * copying from their bio shouldn't have to think about which one to paste. */
function normalizeHandle(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const fromUrl = trimmed.match(/(?:instagram\.com|tiktok\.com|t\.me|youtube\.com|youtu\.be)\/(?:@|c\/|channel\/|user\/)?([\w.-]+)/i);
  if (fromUrl) return fromUrl[1];
  return trimmed.replace(/^@/, "").slice(0, 64);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function GET(request: NextRequest) {
  const user = await requireUser(request);
  if (!user) {
    return NextResponse.json({ error: "Нужно войти в аккаунт" }, { status: 401 });
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
      telegramHandle: creator?.telegramHandle ?? "",
      youtubeHandle: creator?.youtubeHandle ?? "",
      contactEmail: creator?.contactEmail ?? "",
      onboarded: creator?.onboarded ?? false,
      categories: creator?.categories ?? [],
      hidePopular: creator?.hidePopular ?? false,
    });
  }

  if (user.role === "brand") {
    return NextResponse.json({
      role: user.role,
      email: user.email,
      displayName: user.displayName ?? user.brandDomain ?? user.email,
      brandDomain: user.brandDomain,
      brandArticles: user.brandArticles ?? [],
      affiliateTemplate: user.affiliateTemplate ?? "",
    });
  }

  const slug = await ensureUserSlug(user.id);
  return NextResponse.json({
    role: user.role,
    email: user.email,
    displayName: user.displayName ?? "Покупатель",
    avatarUrl: user.avatarUrl ?? "",
    slug,
    interests: user.interests ?? [],
  });
}

export async function PUT(request: NextRequest) {
  const user = await requireUser(request);
  if (!user) {
    return NextResponse.json({ error: "Нужно войти в аккаунт" }, { status: 401 });
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

    let contactEmail: string | null | undefined;
    if (body?.contactEmail !== undefined) {
      const value = String(body.contactEmail).trim().slice(0, 120);
      if (value && !EMAIL_RE.test(value)) {
        return NextResponse.json({ error: "Введите корректную почту для сотрудничества" }, { status: 400 });
      }
      contactEmail = value || null;
    }

    const updated = await updateCreator(creator.id, {
      contactEmail,
      displayName: body?.displayName?.trim(),
      bio: body?.bio,
      avatarUrl: body?.avatarUrl,
      instagramHandle: body?.instagramHandle !== undefined ? normalizeHandle(body.instagramHandle) : undefined,
      tiktokHandle: body?.tiktokHandle !== undefined ? normalizeHandle(body.tiktokHandle) : undefined,
      telegramHandle: body?.telegramHandle !== undefined ? normalizeHandle(body.telegramHandle) : undefined,
      youtubeHandle: body?.youtubeHandle !== undefined ? normalizeHandle(body.youtubeHandle) : undefined,
      onboarded: typeof body?.onboarded === "boolean" ? body.onboarded : undefined,
      categories: Array.isArray(body?.categories) ? body.categories.filter(isCategory) : undefined,
      hidePopular: typeof body?.hidePopular === "boolean" ? body.hidePopular : undefined,
    });

    return NextResponse.json({
      displayName: updated?.displayName,
      bio: updated?.bio ?? "",
      avatarUrl: updated?.avatarUrl ?? "",
      slug: updated?.slug,
      instagramHandle: updated?.instagramHandle ?? "",
      tiktokHandle: updated?.tiktokHandle ?? "",
      telegramHandle: updated?.telegramHandle ?? "",
      youtubeHandle: updated?.youtubeHandle ?? "",
      contactEmail: updated?.contactEmail ?? "",
      onboarded: updated?.onboarded ?? false,
      categories: updated?.categories ?? [],
      hidePopular: updated?.hidePopular ?? false,
    });
  }

  if (user.role === "brand") {
    if (body?.displayName !== undefined && !String(body.displayName).trim()) {
      return NextResponse.json({ error: "Имя не может быть пустым" }, { status: 400 });
    }
    if (body?.displayName !== undefined) {
      await updateUserProfile(user.id, { displayName: body.displayName.trim() });
    }

    let articles = user.brandArticles ?? [];
    let unrecognized: string[] = [];
    if (body?.articles !== undefined) {
      const parsed = parseArticleInput(String(body.articles));
      articles = parsed.articles;
      unrecognized = parsed.unrecognized;
      await setBrandArticles(user.id, articles);
    }

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

  if (user.role === "shopper") {
    if (body?.displayName !== undefined && !String(body.displayName).trim()) {
      return NextResponse.json({ error: "Имя не может быть пустым" }, { status: 400 });
    }
    const interests = Array.isArray(body?.interests) ? body.interests.filter(isCategory) : undefined;
    if (interests) await setUserInterests(user.id, interests);
    const updated = await updateUserProfile(user.id, {
      displayName: body?.displayName?.trim(),
      avatarUrl: body?.avatarUrl,
    });
    return NextResponse.json({
      displayName: updated.displayName,
      avatarUrl: updated.avatarUrl ?? "",
      slug: await ensureUserSlug(user.id),
      interests: interests ?? user.interests ?? [],
    });
  }

  return NextResponse.json({ error: "Для этой роли нечего обновлять" }, { status: 400 });
}
