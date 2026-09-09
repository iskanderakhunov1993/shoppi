import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/require-user";
import { countClicksForLinks, getCreatorById, listLinksByArticles } from "@/lib/store";

export async function GET(request: NextRequest) {
  const user = requireUser(request);
  if (!user || user.role !== "brand") {
    return NextResponse.json({ error: "Brands only" }, { status: 403 });
  }

  const articles = user.brandArticles ?? [];
  if (articles.length === 0) {
    // Not an error: a brand that has not claimed any articles yet is the
    // normal first-run state, and the dashboard explains what to do.
    return NextResponse.json({ brandDomain: user.brandDomain, articles: [], links: [] });
  }

  const rows = listLinksByArticles(articles);
  const counts = countClicksForLinks(rows.map((l) => l.id));

  const links = rows.map((link) => ({
    ...link,
    clicks: counts.get(link.id)?.human ?? 0,
    clicksTotal: counts.get(link.id)?.total ?? 0,
    creatorName: getCreatorById(link.creatorId)?.displayName,
    creatorSlug: getCreatorById(link.creatorId)?.slug,
  }));

  return NextResponse.json({ brandDomain: user.brandDomain, articles, links });
}
