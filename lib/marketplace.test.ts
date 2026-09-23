import { describe, it, expect } from "vitest";
import { parseMarketplaceItem, parseArticleInput } from "./marketplace";

describe("parseMarketplaceItem", () => {
  it("pulls the article id out of a Wildberries product URL", () => {
    expect(parseMarketplaceItem("https://www.wildberries.ru/catalog/172247725/detail.aspx")).toEqual({
      marketplace: "wildberries",
      articleId: "172247725",
    });
  });

  it("handles a Wildberries URL without the www prefix or trailing path", () => {
    expect(parseMarketplaceItem("https://wildberries.ru/catalog/999/")).toEqual({
      marketplace: "wildberries",
      articleId: "999",
    });
  });

  it("pulls the trailing id out of an Ozon product URL with a slug", () => {
    expect(parseMarketplaceItem("https://www.ozon.ru/product/trimmer-dlya-borody-1284900733/")).toEqual({
      marketplace: "ozon",
      articleId: "1284900733",
    });
  });

  it("pulls the trailing id out of a Yandex Market product URL", () => {
    expect(parseMarketplaceItem("https://market.yandex.ru/product--kofevarka/1234567890")).toEqual({
      marketplace: "yandexmarket",
      articleId: "1234567890",
    });
  });

  it("pulls the trailing id out of a Sportmaster product URL", () => {
    expect(parseMarketplaceItem("https://www.sportmaster.ru/product/krossovki-nike-123456/")).toEqual({
      marketplace: "sportmaster",
      articleId: "123456",
    });
  });

  it("pulls the trailing id out of a Stockmann product URL", () => {
    expect(parseMarketplaceItem("https://www.stockmann.ru/product/sumka-778899")).toEqual({
      marketplace: "stockmann",
      articleId: "778899",
    });
  });

  it("recognizes Poizon by brand name across mirror domains", () => {
    expect(parseMarketplaceItem("https://www.poizon.com/item/998877")).toEqual({
      marketplace: "poizon",
      articleId: "998877",
    });
  });

  it("reports other marketplaces without an article", () => {
    expect(parseMarketplaceItem("https://www.lamoda.ru/p/palto-770211/")).toEqual({
      marketplace: "other",
    });
  });

  it("does not throw on a malformed URL", () => {
    expect(parseMarketplaceItem("not a url")).toEqual({ marketplace: "other" });
  });
});

describe("parseArticleInput", () => {
  it("accepts bare article numbers and full links together", () => {
    const result = parseArticleInput(
      "172247725\nhttps://www.ozon.ru/product/sviter-1102938471/\n183920144"
    );
    expect(result.articles).toEqual(["172247725", "1102938471", "183920144"]);
    expect(result.unrecognized).toEqual([]);
  });

  it("reports entries it could not read instead of silently dropping them", () => {
    const result = parseArticleInput("172247725, https://example.com/thing");
    expect(result.articles).toEqual(["172247725"]);
    expect(result.unrecognized).toEqual(["https://example.com/thing"]);
  });

  it("removes duplicates", () => {
    const result = parseArticleInput("111111 111111 222222");
    expect(result.articles).toEqual(["111111", "222222"]);
  });
});
