import { NextRequest, NextResponse } from "next/server";
import { requireCreator } from "@/lib/require-creator";
import { fetchProductInfo, parseMarketplaceItem } from "@/lib/marketplace";

export async function GET(request: NextRequest) {
  const creator = await requireCreator(request);
  if (!creator) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "url query param is required" }, { status: 400 });
  }

  const item = parseMarketplaceItem(url);
  if (item.marketplace !== "wildberries" || !item.articleId) {
    // Not an error: Ozon and unrecognized links just aren't fetchable —
    // the creator fills the form in by hand, as before.
    return NextResponse.json({ found: false });
  }

  const info = await fetchProductInfo(item);
  if (!info) {
    return NextResponse.json({ found: false });
  }

  return NextResponse.json({ found: true, ...info });
}
