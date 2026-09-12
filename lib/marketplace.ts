export type MarketplaceItem = {
  marketplace: "wildberries" | "ozon" | "other";
  articleId?: string;
};

/**
 * Pulls the marketplace item id out of a product URL.
 *
 * Matching brands by domain does not work on marketplaces: every WB
 * seller shares wildberries.ru, so a domain match would show one seller
 * every other seller's links. The article id is the only thing that
 * actually identifies a product.
 */
export function parseMarketplaceItem(rawUrl: string): MarketplaceItem {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return { marketplace: "other" };
  }

  const host = url.hostname.replace(/^www\./, "").toLowerCase();

  if (host.endsWith("wildberries.ru")) {
    // /catalog/172247725/detail.aspx — the id is the segment after catalog
    const m = url.pathname.match(/\/catalog\/(\d+)/);
    return { marketplace: "wildberries", articleId: m?.[1] };
  }

  if (host.endsWith("ozon.ru")) {
    // /product/nazvanie-tovara-1234567890/ — the id is the trailing number
    const m = url.pathname.match(/\/product\/(?:[^/]*-)?(\d+)/);
    return { marketplace: "ozon", articleId: m?.[1] };
  }

  return { marketplace: "other" };
}

export type FetchedProductInfo = {
  title: string;
  price?: number;
  imageUrl?: string;
};

/**
 * WB's product data API (card.wb.ru) returns real data to an ordinary
 * browser or to curl, but blocks requests from this server's own Node
 * runtime specifically — confirmed by testing both `fetch` and the raw
 * `https` module directly against it (403 every time, vs. 200 from
 * curl on the same machine with identical headers). That is a TLS/HTTP
 * fingerprint check, not a header check, so no header we can set fixes
 * it from here.
 *
 * Microlink (api.microlink.io) is a general-purpose link-metadata
 * service — same category as what Slack/Discord use to unfurl a
 * pasted link — and its own fetcher is not on WB's block list. Its
 * `data.<name>.selector` option lets us pull raw body text instead of
 * parsed page metadata, which is what actually makes this useful: the
 * card.wb.ru response is JSON, not HTML, so Microlink's normal
 * title/description extraction finds nothing there.
 *
 * The free tier caps out at 25 requests/day — fine for now, but this
 * will need a paid Microlink plan (or a different relay) once the
 * product has real usage.
 */
async function fetchWbProductInfo(articleId: string): Promise<FetchedProductInfo | null> {
  const cardUrl = `https://card.wb.ru/cards/v4/detail?appType=1&curr=rub&dest=-1257786&spp=30&nm=${articleId}`;
  const relayUrl = `https://api.microlink.io/?url=${encodeURIComponent(cardUrl)}&meta=false&data.raw.selector=body`;

  const res = await fetch(relayUrl).catch(() => null);
  if (!res || !res.ok) return null;

  const relay = await res.json().catch(() => null);
  const raw: string | undefined = relay?.data?.raw;
  if (!raw) return null;

  // Microlink wraps the fetched body as `<pre>{...}</pre><div .../>` —
  // strip that back down to the JSON it actually fetched.
  const match = raw.match(/<pre[^>]*>([\s\S]*?)<\/pre>/);
  const jsonText = match?.[1];
  if (!jsonText) return null;

  let data: { products?: unknown[] } | null;
  try {
    data = JSON.parse(jsonText.replace(/&quot;/g, '"').replace(/&amp;/g, "&"));
  } catch {
    return null;
  }

  const product = data?.products?.[0] as
    | { name?: string; brand?: string; pics?: number; sizes?: { price?: { product?: number } }[] }
    | undefined;
  if (!product?.name) return null;

  const title = product.brand ? `${product.brand}, ${product.name}` : product.name;

  // sizes[].price.product is in kopecks and only present when in stock.
  const priceKopecks: number | undefined = product.sizes?.find(
    (s: { price?: { product?: number } }) => s.price?.product
  )?.price?.product;
  const price = priceKopecks ? Math.round(priceKopecks / 100) : undefined;

  const imageUrl = (product.pics ?? 0) > 0 ? await findWbImageUrl(articleId) : undefined;

  return { title, price, imageUrl };
}

/**
 * WB shards product images across ~30 "basket" CDN hosts by article id,
 * and which host holds a given id changes over time as new baskets are
 * added — there is no public mapping, so this just tries them in order.
 * Unlike the card API, this CDN is not blocked for a normal server
 * request.
 */
async function findWbImageUrl(articleId: string): Promise<string | undefined> {
  const nm = Number(articleId);
  const vol = Math.floor(nm / 100000);
  const part = Math.floor(nm / 1000);

  for (let i = 1; i <= 30; i++) {
    const basket = String(i).padStart(2, "0");
    const url = `https://basket-${basket}.wbbasket.ru/vol${vol}/part${part}/${articleId}/images/big/1.webp`;
    const res = await fetch(url, { method: "HEAD" }).catch(() => null);
    if (res?.ok) return url;
  }
  return undefined;
}

/**
 * Pulls real product data (title, price, photo) for a marketplace link.
 * Only Wildberries works (see fetchWbProductInfo) — Ozon blocks every
 * path tested, including through Microlink's own relay, with a
 * JS-challenge page ("Похоже, нет соединения") rather than a simple
 * status code, so there is no known way to automate it right now.
 */
export async function fetchProductInfo(item: MarketplaceItem): Promise<FetchedProductInfo | null> {
  if (item.marketplace === "wildberries" && item.articleId) {
    return fetchWbProductInfo(item.articleId).catch(() => null);
  }
  return null;
}

/**
 * Accepts what a seller actually has at hand: a bare article number or a
 * full product link, one per line.
 */
export function parseArticleInput(input: string): { articles: string[]; unrecognized: string[] } {
  const articles: string[] = [];
  const unrecognized: string[] = [];

  for (const raw of input.split(/[\n,;\s]+/)) {
    const value = raw.trim();
    if (!value) continue;

    if (/^\d{4,}$/.test(value)) {
      articles.push(value);
      continue;
    }

    const parsed = parseMarketplaceItem(value);
    if (parsed.articleId) articles.push(parsed.articleId);
    else unrecognized.push(value);
  }

  return { articles: [...new Set(articles)], unrecognized };
}
