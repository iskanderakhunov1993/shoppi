import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/require-user";
import { countClicksForLink, listLinksByDomain } from "@/lib/store";

export async function GET(request: NextRequest) {
  const user = requireUser(request);
  if (!user || user.role !== "brand") {
    return NextResponse.json({ error: "Brands only" }, { status: 403 });
  }
  if (!user.brandDomain) {
    return NextResponse.json({ error: "No brandDomain set on this account" }, { status: 400 });
  }

  const links = listLinksByDomain(user.brandDomain).map((link) => ({
    ...link,
    clicks: countClicksForLink(link.id),
  }));

  return NextResponse.json({ brandDomain: user.brandDomain, links });
}
