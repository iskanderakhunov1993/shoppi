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
  listCreators,
  countCreators,
  updateCreator,
  searchLinks,
  followCreator,
  unfollowCreator,
  isFollowing,
  countFollowers,
  listFollowedCreators,
  circleFeed,
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

describe("listCreators", () => {
  it("finds a creator by a Cyrillic name regardless of case", () => {
    // SQLite's lower() only folds ASCII, so searching a Cyrillic name
    // used to return nothing at all.
    const { creator } = createCreator("anna@example.com");
    updateCreator(creator.id, { displayName: "Анна Иванова" });

    expect(listCreators({ query: "анна" }).map((c) => c.id)).toEqual([creator.id]);
    expect(listCreators({ query: "АННА" }).map((c) => c.id)).toEqual([creator.id]);
    expect(listCreators({ query: "Иванова" }).map((c) => c.id)).toEqual([creator.id]);
    expect(countCreators("анна")).toBe(1);
  });

  it("returns nothing for a name that is not there", () => {
    createCreator("anna@example.com");
    expect(listCreators({ query: "Владимир" })).toEqual([]);
  });

  it("pages through results rather than returning everything", () => {
    for (let i = 0; i < 5; i++) createCreator(`c${i}@example.com`);
    expect(listCreators({ limit: 2 })).toHaveLength(2);
    expect(listCreators({ limit: 2, offset: 4 })).toHaveLength(1);
    expect(countCreators()).toBe(5);
  });
});

describe("searchLinks", () => {
  it("finds a link by a Cyrillic title regardless of case, with creator info attached", () => {
    const { creator } = createCreator("anna@example.com");
    const link = addLink({
      creatorId: creator.id,
      title: "Сыворотка для лица",
      category: "cosmetics",
      targetUrl: "https://example.com/serum",
    });

    const results = searchLinks("сыворотка");
    expect(results.map((l) => l.id)).toEqual([link.id]);
    expect(results[0].creatorSlug).toBe(creator.slug);
    expect(results[0].creatorName).toBe(creator.displayName);
  });

  it("returns nothing for a title that is not there", () => {
    const { creator } = createCreator("anna@example.com");
    addLink({ creatorId: creator.id, title: "Крем", category: "cosmetics", targetUrl: "https://example.com/1" });
    expect(searchLinks("шампунь")).toEqual([]);
  });
});

describe("follows (circles)", () => {
  it("follows and unfollows a creator", () => {
    const { creator } = createCreator("anna@example.com");
    const { user: shopper } = createUser("shopper@example.com", "hashed", "shopper");

    expect(isFollowing(shopper.id, creator.id)).toBe(false);
    followCreator(shopper.id, creator.id);
    expect(isFollowing(shopper.id, creator.id)).toBe(true);
    expect(countFollowers(creator.id)).toBe(1);
    expect(listFollowedCreators(shopper.id).map((c) => c.id)).toEqual([creator.id]);

    unfollowCreator(shopper.id, creator.id);
    expect(isFollowing(shopper.id, creator.id)).toBe(false);
    expect(countFollowers(creator.id)).toBe(0);
  });

  it("following twice does not double-count", () => {
    const { creator } = createCreator("anna@example.com");
    const { user: shopper } = createUser("shopper@example.com", "hashed", "shopper");

    followCreator(shopper.id, creator.id);
    followCreator(shopper.id, creator.id);
    expect(countFollowers(creator.id)).toBe(1);
  });

  it("blends links from every followed creator into one feed, newest first", () => {
    const a = createCreator("a@example.com").creator;
    const b = createCreator("b@example.com").creator;
    const { user: shopper } = createUser("shopper@example.com", "hashed", "shopper");

    const first = addLink({ creatorId: a.id, title: "A1", category: "cosmetics", targetUrl: "https://example.com/a1" });
    const second = addLink({ creatorId: b.id, title: "B1", category: "mens", targetUrl: "https://example.com/b1" });

    followCreator(shopper.id, a.id);
    followCreator(shopper.id, b.id);

    expect(circleFeed(shopper.id).map((l) => l.id)).toEqual([second.id, first.id]);
  });

  it("only shows links from followed creators, not everyone", () => {
    const followed = createCreator("followed@example.com").creator;
    const stranger = createCreator("stranger@example.com").creator;
    const { user: shopper } = createUser("shopper@example.com", "hashed", "shopper");

    addLink({ creatorId: stranger.id, title: "Not yours", category: "cosmetics", targetUrl: "https://example.com/x" });
    followCreator(shopper.id, followed.id);

    expect(circleFeed(shopper.id)).toEqual([]);
  });
});
