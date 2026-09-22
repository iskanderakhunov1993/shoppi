import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/require-user";
import { getCreatorByUserId, saveCreatorAvatar, updateCreator } from "@/lib/store";

// The client downsizes the photo to a small square before sending, so a
// generous cap is enough and keeps the JSON body well under Vercel's limit.
const MAX_BYTES = 400 * 1024;
const DATA_URL = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/;

export async function POST(request: NextRequest) {
  const user = await requireUser(request);
  if (!user || user.role !== "creator") {
    return NextResponse.json({ error: "Доступно только креаторам" }, { status: 403 });
  }
  const creator = await getCreatorByUserId(user.id);
  if (!creator) {
    return NextResponse.json({ error: "Профиль креатора не найден" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const match = typeof body?.image === "string" ? DATA_URL.exec(body.image) : null;
  if (!match) {
    return NextResponse.json({ error: "Загрузите изображение JPG, PNG или WebP" }, { status: 400 });
  }
  const [, mime, base64] = match;
  if (Buffer.byteLength(base64, "base64") > MAX_BYTES) {
    return NextResponse.json({ error: "Фото слишком большое" }, { status: 413 });
  }

  await saveCreatorAvatar(creator.id, mime, base64);
  // The version query keeps browsers from showing the previous photo
  // from their long-lived cache after a change.
  const avatarUrl = `/api/avatar/${creator.id}?v=${Date.now()}`;
  await updateCreator(creator.id, { avatarUrl });
  return NextResponse.json({ avatarUrl });
}
