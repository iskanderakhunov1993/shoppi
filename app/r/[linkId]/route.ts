import { NextRequest, NextResponse } from "next/server";
import { getLink, recordClick } from "@/lib/store";

export function resolveRedirectTarget(linkId: string): string | null {
  const link = getLink(linkId);
  return link?.targetUrl ?? null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ linkId: string }> }
) {
  const { linkId } = await params;
  const targetUrl = resolveRedirectTarget(linkId);

  if (!targetUrl) {
    return NextResponse.json({ error: "Link not found" }, { status: 404 });
  }

  recordClick(
    linkId,
    request.headers.get("referer") ?? undefined,
    request.headers.get("user-agent") ?? undefined
  );

  return NextResponse.redirect(targetUrl, { status: 302 });
}
