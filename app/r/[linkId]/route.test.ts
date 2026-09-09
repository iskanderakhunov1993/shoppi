import { describe, it, expect, beforeEach } from "vitest";
import { resolveRedirectTarget } from "./route";
import { addLink, createUser, __resetStoreForTests } from "@/lib/store";

beforeEach(() => {
  __resetStoreForTests();
});

describe("resolveRedirectTarget", () => {
  it("returns the target_url when the link exists", () => {
    const { creator } = createUser("anna@example.com", "hashed");
    const link = addLink({
      creatorId: creator.id,
      title: "Item",
      category: "cosmetics",
      targetUrl: "https://example.com/product",
    });

    expect(resolveRedirectTarget(link.id)).toBe("https://example.com/product");
  });

  it("returns null when the link does not exist", () => {
    expect(resolveRedirectTarget("missing-id")).toBeNull();
  });
});
