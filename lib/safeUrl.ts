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
