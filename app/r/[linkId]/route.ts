import { NextRequest, NextResponse } from "next/server";
import { getLink, hasRecentClick, recordClick } from "@/lib/store";
import { isBotUserAgent, clientIpFrom } from "@/lib/bot-detection";
import { visitorFingerprint } from "@/lib/auth";

export async function resolveRedirectTarget(linkId: string): Promise<string | null> {
  const link = await getLink(linkId);
  return link?.targetUrl ?? null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ linkId: string }> }
) {
  const { linkId } = await params;
  const targetUrl = await resolveRedirectTarget(linkId);

  if (!targetUrl) {
    return NextResponse.json({ error: "Link not found" }, { status: 404 });
  }

  const userAgent = request.headers.get("user-agent");
  const isBot = isBotUserAgent(userAgent);
  const fingerprint = visitorFingerprint(clientIpFrom(request.headers), userAgent ?? "");

  // A reader refreshing or coming back within the window is one visit,
  // not several. Bot hits are always recorded so the raw total stays true.
  const isRepeat = !isBot && (await hasRecentClick(linkId, fingerprint, 30));

  if (!isRepeat) {
    await recordClick(linkId, {
      referrer: request.headers.get("referer") ?? undefined,
      userAgent: userAgent ?? undefined,
      isBot,
      fingerprint,
    });
  }

  return NextResponse.redirect(targetUrl, { status: 302 });
}
