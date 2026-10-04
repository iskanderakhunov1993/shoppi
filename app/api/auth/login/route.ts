import { NextRequest, NextResponse } from "next/server";
import { isRateLimited, TOO_MANY } from "@/lib/rateLimit";
import { clientIpFrom } from "@/lib/bot-detection";
import { homePathFor } from "@/lib/landing";
import { getCreatorByUserId, getUserByEmail } from "@/lib/store";
import { createSession, verifyPassword, SESSION_COOKIE } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = body?.email as string | undefined;
  const password = body?.password as string | undefined;

  if (!email || !password) {
    return NextResponse.json({ error: "Введите email и пароль" }, { status: 400 });
  }

  const ip = clientIpFrom(request.headers);
  if (
    (await isRateLimited(`login:ip:${ip}`, 30, 15 * 60)) ||
    (await isRateLimited(`login:email:${email.toLowerCase()}`, 10, 15 * 60))
  ) {
    return NextResponse.json(TOO_MANY, { status: 429 });
  }

  const user = await getUserByEmail(email);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: "Неверный email или пароль" }, { status: 401 });
  }

  if (!user.verified) {
    return NextResponse.json({ error: "Email не подтверждён — проверьте почту" }, { status: 403 });
  }

  const token = await createSession(user.id);
  const creator = user.role === "creator" ? await getCreatorByUserId(user.id) : undefined;
  const response = NextResponse.json({ email: user.email, next: homePathFor(user, creator) });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  return response;
}
