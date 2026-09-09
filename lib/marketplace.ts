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
