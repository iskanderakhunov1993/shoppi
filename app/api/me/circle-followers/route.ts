import { NextRequest, NextResponse } from "next/server";
import { requireCreator } from "@/lib/require-creator";
import { listCreatorCircleFollowers } from "@/lib/store";

export async function GET(request: NextRequest) {
  const creator = await requireCreator(request);
  if (!creator) {
    return NextResponse.json({ error: "Нужно войти в аккаунт" }, { status: 401 });
  }

  const followers = await listCreatorCircleFollowers(creator.id);
  return NextResponse.json({ followers });
}
