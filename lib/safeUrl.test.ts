import { describe, it, expect } from "vitest";
import { isSafeImageUrl, isSafeProductUrl } from "./safeUrl";

describe("isSafeProductUrl", () => {
  it("accepts ordinary shop pages", () => {
    expect(isSafeProductUrl("https://www.wildberries.ru/catalog/123/detail.aspx")).toBe(true);
    expect(isSafeProductUrl("http://brand-shop.ru/item?id=1")).toBe(true);
  });

  it("rejects non-web schemes, credentials, local and bare-IP hosts", () => {
    for (const bad of [
      "javascript:alert(1)",
      "data:text/html,hi",
      "ftp://shop.ru/x",
      "https://user:pass@shop.ru/",
      "http://localhost:3000/",
      "http://192.168.0.1/",
      "http://[::1]/",
      "https://intranet/",
      "not a url",
    ]) {
      expect(isSafeProductUrl(bad), bad).toBe(false);
    }
  });
});

describe("isSafeImageUrl", () => {
  it("allows resized data-URL uploads but not other data URLs", () => {
    expect(isSafeImageUrl("data:image/jpeg;base64,AAAA")).toBe(true);
    expect(isSafeImageUrl("data:text/html,hi")).toBe(false);
  });
});
