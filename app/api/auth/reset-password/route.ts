import { NextRequest, NextResponse } from "next/server";
import { getUserByResetToken, updateUserPasswordHash, clearResetToken, markUserVerified } from "@/lib/store";
import { hashPassword } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const token = body?.token as string | undefined;
  const password = body?.password as string | undefined;

  if (!token || !password || password.length < 6) {
    return NextResponse.json(
      { error: "token и password (мин. 6 символов) обязательны" },
      { status: 400 }
    );
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
