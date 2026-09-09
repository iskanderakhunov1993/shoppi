/**
 * Link previews are fetched by the platform, not the reader: Telegram,
 * WhatsApp and the rest open every URL posted in a chat to build the
 * preview card. Those hits reach our redirect exactly like a human click,
 * so a post nobody opened would still report traffic.
 *
 * We flag them rather than drop them — the raw number stays available,
 * and the blogger's media kit can show what actually was a person.
 */
const BOT_PATTERNS: RegExp[] = [
  /TelegramBot/i,
  /WhatsApp/i,
  /facebookexternalhit/i,
  /Facebot/i,
  /Twitterbot/i,
  /Slackbot/i,
  /Discordbot/i,
  /LinkedInBot/i,
  /SkypeUriPreview/i,
  /vkShare/i,
  /Googlebot/i,
  /YandexBot/i,
  /YandexMetrika/i,
  /bingbot/i,
  /DuckDuckBot/i,
  /AhrefsBot/i,
  /SemrushBot/i,
  /MJ12bot/i,
  /Applebot/i,
  /HeadlessChrome/i,
  /PhantomJS/i,
  /curl\//i,
  /wget/i,
  /python-requests/i,
  /python-urllib/i,
  /Go-http-client/i,
  /okhttp/i,
  /axios\//i,
  /node-fetch/i,
  /Java\//i,
  /\bbot\b/i,
  /crawler/i,
  /spider/i,
  /preview/i,
];

export function isBotUserAgent(userAgent: string | null | undefined): boolean {
  if (!userAgent || userAgent.trim() === "") return true; // no UA at all is not a browser
  return BOT_PATTERNS.some((re) => re.test(userAgent));
}

/**
 * Best-effort client IP behind a proxy. Only ever used to build a salted
 * hash, never stored or logged in raw form.
 */
export function clientIpFrom(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "unknown";
}
