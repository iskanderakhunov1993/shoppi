import { describe, it, expect } from "vitest";
import { isSafeImageUrl, isSafeProductUrl, needsRedirectConfirmation } from "./safeUrl";

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

describe("needsRedirectConfirmation", () => {
  it("lets ordinary shops and brand sites straight through", () => {
    for (const ok of ["https://www.ozon.ru/product/1", "https://brand-shop.ru/item", "https://www.lamoda.ru/p/x"]) {
      expect(needsRedirectConfirmation(ok), ok).toBe(false);
    }
  });
  it("asks for shorteners and punycode look-alikes", () => {
    for (const bad of ["https://bit.ly/abc", "https://clck.ru/xyz", "https://xn--80ak6aa92e.com/"]) {
      expect(needsRedirectConfirmation(bad), bad).toBe(true);
    }
  });
});
