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
  __resetStoreForTests,
} from "./store";

beforeEach(() => {
  __resetStoreForTests();
});

describe("createUser", () => {
  it("creates a user and an associated creator with a generated slug", () => {
    const { user, creator } = createUser("anna@example.com", "hashed");
    expect(user.email).toBe("anna@example.com");
    expect(user.verified).toBe(false);
    expect(creator.userId).toBe(user.id);
    expect(creator.slug).toMatch(/^anna-/);
  });

  it("throws when the email is already registered", () => {
    createUser("anna@example.com", "hashed");
    expect(() => createUser("anna@example.com", "other-hash")).toThrow();
  });
});

describe("verifyUser", () => {
  it("marks the user verified given a valid token", () => {
    const { user } = createUser("anna@example.com", "hashed");
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
    const { creator } = createUser("anna@example.com", "hashed");
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
    const a = createUser("a@example.com", "hashed").creator;
    const b = createUser("b@example.com", "hashed").creator;
    addLink({ creatorId: a.id, title: "A's link", category: "clothing", targetUrl: "https://example.com/a" });

    expect(listLinksByCreator(b.id)).toEqual([]);
  });

  it("counts clicks recorded against a link", () => {
    const { creator } = createUser("anna@example.com", "hashed");
    const link = addLink({
      creatorId: creator.id,
      title: "Item",
      category: "cosmetics",
      targetUrl: "https://example.com/item",
    });

    expect(countClicksForLink(link.id)).toBe(0);
    recordClick(link.id);
    recordClick(link.id);
    expect(countClicksForLink(link.id)).toBe(2);
  });
});

describe("getCreatorBySlug", () => {
  it("finds the creator created at registration", () => {
    const { creator } = createUser("anna@example.com", "hashed");
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
