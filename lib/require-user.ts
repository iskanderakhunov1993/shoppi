import { NextRequest } from "next/server";
import { getUserIdForSession, SESSION_COOKIE } from "@/lib/auth";
import { getUserById, type User } from "@/lib/store";

export async function requireUser(request: NextRequest): Promise<User | null> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const userId = await getUserIdForSession(token);
  if (!userId) return null;
  return (await getUserById(userId)) ?? null;
}
