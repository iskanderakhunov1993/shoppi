import { NextRequest, NextResponse } from "next/server";
import { requireCreator } from "@/lib/require-creator";

export async function GET(request: NextRequest) {
  const creator = requireCreator(request);
  if (!creator) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  return NextResponse.json({ slug: creator.slug, displayName: creator.displayName });
}
