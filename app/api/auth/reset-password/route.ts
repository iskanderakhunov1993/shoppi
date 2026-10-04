import { NextRequest, NextResponse } from "next/server";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth";
import { isRateLimited, TOO_MANY } from "@/lib/rateLimit";
import { clientIpFrom } from "@/lib/bot-detection";
import { getUserByResetToken, updateUserPasswordHash, clearResetToken, markUserVerified } from "@/lib/store";
import { hashPassword } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const token = body?.token as string | undefined;
  const password = body?.password as string | undefined;

  if (!token || !password || password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: "Пароль должен быть не короче 8 символов" },
      { status: 400 }
    );
  }

  if (await isRateLimited(`reset:ip:${clientIpFrom(request.headers)}`, 20, 60 * 60)) {
    return NextResponse.json(TOO_MANY, { status: 429 });
  }
  const user = await getUserByResetToken(token);
  if (!user) {
    return NextResponse.json({ error: "Ссылка недействительна или устарела" }, { status: 400 });
  }

  await updateUserPasswordHash(user.id, hashPassword(password));
  await clearResetToken(user.id);
  // Resetting via a mailed link is itself proof of owning the inbox.
  if (!user.verified) await markUserVerified(user.id);

  return NextResponse.json({ ok: true });
}
