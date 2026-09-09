import { describe, it, expect, beforeEach } from "vitest";
import {
  createUser,
  getUserByEmail,
  verifyUser,
  getCreatorByUserId,
  getCreatorBySlug,
  addLink,
  getLink,
  listLinksByCreator,
  recordClick,
  countClicksForLink,
  listLinksByDomain,
  addFavorite,
  removeFavorite,
  listFavoriteLinks,
  isFavorite,
  __resetStoreForTests,
} from "./store";

beforeEach(() => {
  __resetStoreForTests();
});

function createCreator(email: string, passwordHash = "hashed") {
  const { user, creator } = createUser(email, passwordHash, "creator");
  if (!creator) throw new Error("expected a creator profile for role 'creator'");
  return { user, creator };
}

describe("createUser", () => {
  it("creates a user and an associated creator with a generated slug", () => {
    const { user, creator } = createCreator("anna@example.com");
    expect(user.email).toBe("anna@example.com");
    expect(user.verified).toBe(false);
    expect(creator.userId).toBe(user.id);
    expect(creator.slug).toMatch(/^anna-/);
  });

  it("throws when the email is already registered", () => {
    createCreator("anna@example.com");
    expect(() => createCreator("anna@example.com", "other-hash")).toThrow();
  });
});

describe("verifyUser", () => {
  it("marks the user verified given a valid token", () => {
    const { user } = createCreator("anna@example.com");
    const verified = verifyUser(user.verificationToken!);
    expect(verified?.verified).toBe(true);
    expect(getUserByEmail("anna@example.com")?.verified).toBe(true);
  });

  it("returns null for an invalid token", () => {
    expect(verifyUser("not-a-real-token")).toBeNull();
  });
});

describe("links and clicks", () => {
  it("lists links scoped to their creator, newest first", () => {
    const { creator } = createCreator("anna@example.com");
    const first = addLink({
      creatorId: creator.id,
      title: "First",
      category: "cosmetics",
      targetUrl: "https://example.com/1",
    });
    const second = addLink({
      creatorId: creator.id,
      title: "Second",
      category: "mens",
      targetUrl: "https://example.com/2",
    });

    const links = listLinksByCreator(creator.id);
    expect(links.map((l) => l.id)).toEqual([second.id, first.id]);
  });

  it("does not leak links from another creator", () => {
    const a = createCreator("a@example.com").creator;
    const b = createCreator("b@example.com").creator;
    addLink({ creatorId: a.id, title: "A's link", category: "clothing", targetUrl: "https://example.com/a" });

    expect(listLinksByCreator(b.id)).toEqual([]);
  });

  it("counts clicks recorded against a link", () => {
    const { creator } = createCreator("anna@example.com");
    const link = addLink({
      creatorId: creator.id,
      title: "Item",
      category: "cosmetics",
      targetUrl: "https://example.com/item",
    });

    expect(countClicksForLink(link.id)).toBe(0);
    recordClick(link.id, { isBot: false });
    recordClick(link.id, { isBot: false });
    expect(countClicksForLink(link.id)).toBe(2);
  });
});

describe("getCreatorBySlug", () => {
  it("finds the creator created at registration", () => {
    const { creator } = createCreator("anna@example.com");
    expect(getCreatorBySlug(creator.slug)?.id).toBe(creator.id);
  });

  it("returns undefined for an unknown slug", () => {
    expect(getCreatorBySlug("does-not-exist")).toBeUndefined();
  });
});

describe("getLink", () => {
  it("returns undefined for an unknown id", () => {
    expect(getLink("does-not-exist")).toBeUndefined();
  });
});

describe("getCreatorByUserId", () => {
  it("returns undefined for an unknown user id", () => {
    expect(getCreatorByUserId("does-not-exist")).toBeUndefined();
  });
});

describe("roles", () => {
  it("does not create a creator profile for shopper or brand roles", () => {
    const shopper = createUser("shopper@example.com", "hashed", "shopper");
    const brand = createUser("brand@example.com", "hashed", "brand", "wildberries.ru");
    expect(shopper.creator).toBeUndefined();
    expect(brand.creator).toBeUndefined();
    expect(brand.user.brandDomain).toBe("wildberries.ru");
  });
});

describe("listLinksByDomain", () => {
  it("finds links whose target_url host matches, ignoring www", () => {
    const { creator } = createCreator("anna@example.com");
    const match = addLink({
      creatorId: creator.id,
      title: "Serum",
      category: "cosmetics",
      targetUrl: "https://www.wildberries.ru/catalog/1",
    });
    addLink({
      creatorId: creator.id,
      title: "Other brand",
      category: "cosmetics",
      targetUrl: "https://ozon.ru/catalog/2",
    });

    const results = listLinksByDomain("wildberries.ru");
    expect(results.map((l) => l.id)).toEqual([match.id]);
  });

  it("returns an empty array when no links match", () => {
    expect(listLinksByDomain("nobody-links-here.ru")).toEqual([]);
  });
});

describe("favorites", () => {
  it("lists favorites a shopper has saved", () => {
    const { creator } = createCreator("anna@example.com");
    const { user: shopper } = createUser("shopper@example.com", "hashed", "shopper");
    const link = addLink({
      creatorId: creator.id,
      title: "Serum",
      category: "cosmetics",
      targetUrl: "https://example.com/serum",
    });

    expect(listFavoriteLinks(shopper.id)).toEqual([]);
    addFavorite(shopper.id, link.id);
    expect(listFavoriteLinks(shopper.id).map((l) => l.id)).toEqual([link.id]);
    expect(isFavorite(shopper.id, link.id)).toBe(true);

    removeFavorite(shopper.id, link.id);
    expect(listFavoriteLinks(shopper.id)).toEqual([]);
  });
});
