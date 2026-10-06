import { NextRequest, NextResponse } from "next/server";
import { track } from "@/lib/events";
import { getAffiliateTemplateForArticle, getLink, hasRecentClick, recordClick } from "@/lib/store";
import { isBotUserAgent, clientIpFrom } from "@/lib/bot-detection";
import { visitorFingerprint } from "@/lib/auth";
import { isSafeProductUrl, needsRedirectConfirmation } from "@/lib/safeUrl";

/**
 * Wraps the raw marketplace URL in a brand's CPA-network deep link when one
 * is on file for this article — the one point where that swap can happen
 * without the storefront or the creator ever knowing about it.
 */
export async function resolveRedirectTarget(linkId: string): Promise<string | null> {
  const link = await getLink(linkId);
  if (!link) return null;

  if (link.articleId) {
    const template = await getAffiliateTemplateForArticle(link.articleId);
    if (template) return template.replace("{url}", encodeURIComponent(link.targetUrl));
  }

  return link.targetUrl;
}

function page(title: string, body: string, status = 200): NextResponse {
  const html = `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${title} — Shoppi</title><style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;font:15px/1.5 system-ui,sans-serif;background:#fff;color:#111}@media(prefers-color-scheme:dark){body{background:#121212;color:#f5f4f2}a.b{background:#f5f4f2!important;color:#121212!important}}main{max-width:420px;padding:24px;text-align:center}h1{font:400 28px Georgia,serif;margin:0 0 12px}p{color:#737066;margin:0 0 24px}a{color:inherit}a.b{display:inline-block;background:#111;color:#fff;padding:12px 20px;text-decoration:none;text-transform:uppercase;font-size:13px;letter-spacing:.04em;margin-bottom:12px}</style></head><body><main>${body}</main></body></html>`;
  return new NextResponse(html, { status, headers: { "content-type": "text/html; charset=utf-8" } });
}

const escape = (v: string) =>
  v.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ linkId: string }> }
) {
  const { linkId } = await params;
  const link = await getLink(linkId);
  const targetUrl = link ? await resolveRedirectTarget(linkId) : null;

  // Old rows predate URL validation, so the target is re-checked here.
  if (!link || !targetUrl || !isSafeProductUrl(targetUrl)) {
    return page(
      "Товар недоступен",
      `<h1>Товар больше недоступен</h1><p>Блогер убрал эту ссылку или она устарела.</p><a class="b" href="/finds">Смотреть рекомендации</a>`,
      404
    );
  }

  // Any shop is fine (marketplaces, brand sites, small stores); only links
  // that hide or imitate their destination get a confirmation step.
  if (needsRedirectConfirmation(targetUrl) && request.nextUrl.searchParams.get("go") !== "1") {
    const host = escape(new URL(targetUrl).hostname.replace(/^www\./, ""));
    return page(
      "Переход на внешний сайт",
      `<h1>Переход на ${host}</h1><p>Ссылка ведёт через сокращатель или похожий на другой адрес. Проверьте сайт, прежде чем вводить данные или оплачивать.</p><a class="b" href="/r/${encodeURIComponent(linkId)}?go=1${request.nextUrl.searchParams.get("src") === "digest" ? "&src=digest" : ""}" rel="nofollow">Перейти на ${host}</a><br><a href="/">На Shoppi</a>`
    );
  }

  const userAgent = request.headers.get("user-agent");
  const isBot = isBotUserAgent(userAgent);
  const fingerprint = visitorFingerprint(clientIpFrom(request.headers), userAgent ?? "");

  // A reader refreshing or coming back within the window is one visit,
  // not several. Bot hits are always recorded so the raw total stays true.
  const isRepeat = !isBot && (await hasRecentClick(linkId, fingerprint, 30));

  if (!isRepeat && !isBot) {
    await track(request.nextUrl.searchParams.get("src") === "digest" ? "digest_click" : "link_click", {
      visitor: fingerprint,
      creatorId: link.creatorId,
      linkId,
    });
  }

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
