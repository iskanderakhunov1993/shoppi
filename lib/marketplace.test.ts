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
