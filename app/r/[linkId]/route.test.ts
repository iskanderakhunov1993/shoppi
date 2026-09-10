import { describe, it, expect, beforeEach } from "vitest";
import { resolveRedirectTarget } from "./route";
import { addLink, createUser, __resetStoreForTests } from "@/lib/store";

beforeEach(async () => {
  await __resetStoreForTests();
});

describe("resolveRedirectTarget", () => {
  it("returns the target_url when the link exists", async () => {
    const { creator } = await createUser("anna@example.com", "hashed", "creator");
    if (!creator) throw new Error("expected a creator profile");
    const link = await addLink({
      creatorId: creator.id,
      title: "Item",
      category: "cosmetics",
      targetUrl: "https://example.com/product",
    });

    expect(await resolveRedirectTarget(link.id)).toBe("https://example.com/product");
  });

  it("returns null when the link does not exist", async () => {
    expect(await resolveRedirectTarget("missing-id")).toBeNull();
  });
});
