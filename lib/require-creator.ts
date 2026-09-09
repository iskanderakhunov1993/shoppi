import { NextRequest } from "next/server";
import { getUserIdForSession, SESSION_COOKIE } from "@/lib/auth";
import { getCreatorByUserId, type Creator } from "@/lib/store";

export function requireCreator(request: NextRequest): Creator | null {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const userId = getUserIdForSession(token);
  if (!userId) return null;
  return getCreatorByUserId(userId) ?? null;
}
