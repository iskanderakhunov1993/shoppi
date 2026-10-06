/**
 * Product links are shown under the Shoppi domain and redirected through
 * /r/:id, so a hostile one would turn Shoppi into a phishing redirector.
 * Only plain public web pages pass.
 */
export function isSafeProductUrl(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return false;
  if (url.username || url.password) return false;
  const host = url.hostname.toLowerCase();
  if (!host.includes(".") || host === "localhost" || host.endsWith(".local") || host.endsWith(".localhost")) return false;
  // Bare IPs (v4 or v6) are never a real shop.
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.startsWith("[")) return false;
  return true;
}

/** Images may also be inline data URLs (resized uploads). */
export function isSafeImageUrl(raw: string): boolean {
  return raw.startsWith("data:image/") || isSafeProductUrl(raw);
}

// Shorteners hide the real destination, and punycode hosts can imitate a
// familiar shop (xn--...). Ordinary shop and brand sites go straight through.
const SHORTENERS = ["bit.ly", "clck.ru", "tinyurl.com", "goo.su", "vk.cc", "t.co", "cutt.ly", "is.gd", "u.to", "rebrand.ly", "ow.ly", "shorturl.at"];

/** True when a product link deserves a "check the address" step before redirecting. */
export function needsRedirectConfirmation(raw: string): boolean {
  let host: string;
  try {
    host = new URL(raw).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return true;
  }
  if (host.split(".").some((part) => part.startsWith("xn--"))) return true;
  return SHORTENERS.some((s) => host === s || host.endsWith(`.${s}`));
}
