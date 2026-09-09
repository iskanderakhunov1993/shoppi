import { NextRequest } from "next/server";
import { getUserIdForSession, SESSION_COOKIE } from "@/lib/auth";
import { getUserById, type User } from "@/lib/store";

export function requireUser(request: NextRequest): User | null {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const userId = getUserIdForSession(token);
  if (!userId) return null;
  return getUserById(userId) ?? null;
}
