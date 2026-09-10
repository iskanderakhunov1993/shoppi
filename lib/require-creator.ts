import { NextRequest } from "next/server";
import { getUserIdForSession, SESSION_COOKIE } from "@/lib/auth";
import { getCreatorByUserId, type Creator } from "@/lib/store";

export async function requireCreator(request: NextRequest): Promise<Creator | null> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const userId = await getUserIdForSession(token);
  if (!userId) return null;
  return (await getCreatorByUserId(userId)) ?? null;
}
