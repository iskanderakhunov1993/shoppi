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

beforeEach(async () => {
  await __resetStoreForTests();
});

async function createCreator(email: string, passwordHash = "hashed") {
  const { user, creator } = await createUser(email, passwordHash, "creator");
  if (!creator) throw new Error("expected a creator profile for role 'creator'");
  return { user, creator };
}

describe("createUser", () => {
  it("creates a user and an associated creator with a generated slug", async () => {
    const { user, creator } = await createCreator("anna@example.com");
    expect(user.email).toBe("anna@example.com");
    expect(user.verified).toBe(false);
    expect(creator.userId).toBe(user.id);
    expect(creator.slug).toMatch(/^anna-/);
  });

  it("throws when the email is already registered", async () => {
    await createCreator("anna@example.com");
    await expect(createCreator("anna@example.com", "other-hash")).rejects.toThrow();
  });
});

describe("verifyUser", () => {
  it("marks the user verified given a valid token", async () => {
    const { user } = await createCreator("anna@example.com");
    const verified = await verifyUser(user.verificationToken!);
    expect(verified?.verified).toBe(true);
    expect((await getUserByEmail("anna@example.com"))?.verified).toBe(true);
  });

  it("returns null for an invalid token", async () => {
    expect(await verifyUser("not-a-real-token")).toBeNull();
  });
});

describe("links and clicks", () => {
  it("lists links scoped to their creator, newest first", async () => {
    const { creator } = await createCreator("anna@example.com");
    const first = await addLink({
      creatorId: creator.id,
      title: "First",
      category: "cosmetics",
      targetUrl: "https://example.com/1",
    });
    const second = await addLink({
      creatorId: creator.id,
      title: "Second",
      category: "mens",
      targetUrl: "https://example.com/2",
    });

    const links = await listLinksByCreator(creator.id);
    expect(links.map((l) => l.id)).toEqual([second.id, first.id]);
  });

  it("does not leak links from another creator", async () => {
    const a = (await createCreator("a@example.com")).creator;
    const b = (await createCreator("b@example.com")).creator;
    await addLink({ creatorId: a.id, title: "A's link", category: "clothing", targetUrl: "https://example.com/a" });

    expect(await listLinksByCreator(b.id)).toEqual([]);
  });

  it("counts clicks recorded against a link", async () => {
    const { creator } = await createCreator("anna@example.com");
    const link = await addLink({
      creatorId: creator.id,
      title: "Item",
      category: "cosmetics",
      targetUrl: "https://example.com/item",
    });

    expect(await countClicksForLink(link.id)).toBe(0);
    await recordClick(link.id, { isBot: false });
    await recordClick(link.id, { isBot: false });
    expect(await countClicksForLink(link.id)).toBe(2);
  });
});

describe("getCreatorBySlug", () => {
  it("finds the creator created at registration", async () => {
    const { creator } = await createCreator("anna@example.com");
    expect((await getCreatorBySlug(creator.slug))?.id).toBe(creator.id);
  });

  it("returns undefined for an unknown slug", async () => {
    expect(await getCreatorBySlug("does-not-exist")).toBeUndefined();
  });
});

describe("getLink", () => {
  it("returns undefined for an unknown id", async () => {
    expect(await getLink("does-not-exist")).toBeUndefined();
  });
});

describe("getCreatorByUserId", () => {
  it("returns undefined for an unknown user id", async () => {
    expect(await getCreatorByUserId("does-not-exist")).toBeUndefined();
  });
});

describe("roles", () => {
  it("does not create a creator profile for shopper or brand roles", async () => {
    const shopper = await createUser("shopper@example.com", "hashed", "shopper");
    const brand = await createUser("brand@example.com", "hashed", "brand", "wildberries.ru");
    expect(shopper.creator).toBeUndefined();
    expect(brand.creator).toBeUndefined();
    expect(brand.user.brandDomain).toBe("wildberries.ru");
  });
});

describe("listLinksByDomain", () => {
  it("finds links whose target_url host matches, ignoring www", async () => {
    const { creator } = await createCreator("anna@example.com");
    const match = await addLink({
      creatorId: creator.id,
      title: "Serum",
      category: "cosmetics",
      targetUrl: "https://www.wildberries.ru/catalog/1",
    });
    await addLink({
      creatorId: creator.id,
      title: "Other brand",
      category: "cosmetics",
      targetUrl: "https://ozon.ru/catalog/2",
    });

    const results = await listLinksByDomain("wildberries.ru");
    expect(results.map((l) => l.id)).toEqual([match.id]);
  });

  it("returns an empty array when no links match", async () => {
    expect(await listLinksByDomain("nobody-links-here.ru")).toEqual([]);
  });
});

describe("favorites", () => {
  it("lists favorites a shopper has saved", async () => {
    const { creator } = await createCreator("anna@example.com");
    const { user: shopper } = await createUser("shopper@example.com", "hashed", "shopper");
    const link = await addLink({
      creatorId: creator.id,
      title: "Serum",
      category: "cosmetics",
      targetUrl: "https://example.com/serum",
    });

    expect(await listFavoriteLinks(shopper.id)).toEqual([]);
    await addFavorite(shopper.id, link.id);
    expect((await listFavoriteLinks(shopper.id)).map((l) => l.id)).toEqual([link.id]);
    expect(await isFavorite(shopper.id, link.id)).toBe(true);

    await removeFavorite(shopper.id, link.id);
    expect(await listFavoriteLinks(shopper.id)).toEqual([]);
  });
});

describe("listCreators", () => {
  it("finds a creator by a Cyrillic name regardless of case", async () => {
    // SQLite's lower() only folds ASCII, so searching a Cyrillic name
    // used to return nothing at all — same rule applies to Postgres LIKE.
    const { creator } = await createCreator("anna@example.com");
    await updateCreator(creator.id, { displayName: "Анна Иванова" });

    expect((await listCreators({ query: "анна" })).map((c) => c.id)).toEqual([creator.id]);
    expect((await listCreators({ query: "АННА" })).map((c) => c.id)).toEqual([creator.id]);
    expect((await listCreators({ query: "Иванова" })).map((c) => c.id)).toEqual([creator.id]);
    expect(await countCreators("анна")).toBe(1);
  });

  it("returns nothing for a name that is not there", async () => {
    await createCreator("anna@example.com");
    expect(await listCreators({ query: "Владимир" })).toEqual([]);
  });

  it("pages through results rather than returning everything", async () => {
    for (let i = 0; i < 5; i++) await createCreator(`c${i}@example.com`);
    expect(await listCreators({ limit: 2 })).toHaveLength(2);
    expect(await listCreators({ limit: 2, offset: 4 })).toHaveLength(1);
    expect(await countCreators()).toBe(5);
  });
});

describe("searchLinks", () => {
  it("finds a link by a Cyrillic title regardless of case, with creator info attached", async () => {
    const { creator } = await createCreator("anna@example.com");
    const link = await addLink({
      creatorId: creator.id,
      title: "Сыворотка для лица",
      category: "cosmetics",
      targetUrl: "https://example.com/serum",
    });

    const results = await searchLinks("сыворотка");
    expect(results.map((l) => l.id)).toEqual([link.id]);
    expect(results[0].creatorSlug).toBe(creator.slug);
    expect(results[0].creatorName).toBe(creator.displayName);
  });

  it("returns nothing for a title that is not there", async () => {
    const { creator } = await createCreator("anna@example.com");
    await addLink({ creatorId: creator.id, title: "Крем", category: "cosmetics", targetUrl: "https://example.com/1" });
    expect(await searchLinks("шампунь")).toEqual([]);
  });
});

describe("follows (circles)", () => {
  it("follows and unfollows a creator", async () => {
    const { creator } = await createCreator("anna@example.com");
    const { user: shopper } = await createUser("shopper@example.com", "hashed", "shopper");

    expect(await isFollowing(shopper.id, creator.id)).toBe(false);
    await followCreator(shopper.id, creator.id);
    expect(await isFollowing(shopper.id, creator.id)).toBe(true);
    expect(await countFollowers(creator.id)).toBe(1);
    expect((await listFollowedCreators(shopper.id)).map((c) => c.id)).toEqual([creator.id]);

    await unfollowCreator(shopper.id, creator.id);
    expect(await isFollowing(shopper.id, creator.id)).toBe(false);
    expect(await countFollowers(creator.id)).toBe(0);
  });

  it("following twice does not double-count", async () => {
    const { creator } = await createCreator("anna@example.com");
    const { user: shopper } = await createUser("shopper@example.com", "hashed", "shopper");

    await followCreator(shopper.id, creator.id);
    await followCreator(shopper.id, creator.id);
    expect(await countFollowers(creator.id)).toBe(1);
  });

  it("blends links from every followed creator into one feed, newest first", async () => {
    const a = (await createCreator("a@example.com")).creator;
    const b = (await createCreator("b@example.com")).creator;
    const { user: shopper } = await createUser("shopper@example.com", "hashed", "shopper");

    const first = await addLink({ creatorId: a.id, title: "A1", category: "cosmetics", targetUrl: "https://example.com/a1" });
    const second = await addLink({ creatorId: b.id, title: "B1", category: "mens", targetUrl: "https://example.com/b1" });

    await followCreator(shopper.id, a.id);
    await followCreator(shopper.id, b.id);

    expect((await circleFeed(shopper.id)).map((l) => l.id)).toEqual([second.id, first.id]);
  });

  it("only shows links from followed creators, not everyone", async () => {
    const followed = (await createCreator("followed@example.com")).creator;
    const stranger = (await createCreator("stranger@example.com")).creator;
    const { user: shopper } = await createUser("shopper@example.com", "hashed", "shopper");

    await addLink({ creatorId: stranger.id, title: "Not yours", category: "cosmetics", targetUrl: "https://example.com/x" });
    await followCreator(shopper.id, followed.id);

    expect(await circleFeed(shopper.id)).toEqual([]);
  });
});
