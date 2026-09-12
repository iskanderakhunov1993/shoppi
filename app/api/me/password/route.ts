import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/require-user";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { updateUserPasswordHash } from "@/lib/store";

export async function PUT(request: NextRequest) {
  const user = await requireUser(request);
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const currentPassword = String(body?.currentPassword ?? "");
  const newPassword = String(body?.newPassword ?? "");

  if (!verifyPassword(currentPassword, user.passwordHash)) {
    return NextResponse.json({ error: "Текущий пароль неверен" }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: "Новый пароль должен быть не короче 8 символов" }, { status: 400 });
  }

  await updateUserPasswordHash(user.id, hashPassword(newPassword));
  return NextResponse.json({ ok: true });
}
