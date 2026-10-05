import { NextRequest, NextResponse } from "next/server";
import { setDigestOptOut, verifyUnsubscribeToken } from "@/lib/digest";

function page(text: string, status = 200) {
  const html = `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Рассылка — Shoppi</title><style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;font:15px/1.5 system-ui,sans-serif;background:#fff;color:#111}@media(prefers-color-scheme:dark){body{background:#121212;color:#f5f4f2}}main{max-width:420px;padding:24px;text-align:center}h1{font:400 26px Georgia,serif;margin:0 0 12px}a{color:inherit}</style></head><body><main>${text}</main></body></html>`;
  return new NextResponse(html, { status, headers: { "content-type": "text/html; charset=utf-8" } });
}

async function handle(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("u") ?? "";
  const token = request.nextUrl.searchParams.get("t") ?? "";
  if (!userId || !token || !verifyUnsubscribeToken(userId, token)) {
    return page(`<h1>Ссылка недействительна</h1><p>Отписаться можно в <a href="/dashboard/settings">настройках</a>.</p>`, 400);
  }
  await setDigestOptOut(userId, true);
  return page(`<h1>Вы отписаны</h1><p>Еженедельные письма больше не придут. Включить снова можно в <a href="/dashboard/settings">настройках</a>.</p>`);
}

// GET for the link in the email, POST for mail clients' one-click unsubscribe.
export const GET = handle;
export const POST = handle;
