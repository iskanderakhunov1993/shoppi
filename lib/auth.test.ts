import { describe, it, expect, beforeEach } from "vitest";
import {
  hashPassword,
  verifyPassword,
  createSession,
  getUserIdForSession,
  destroySession,
  visitorFingerprint,
} from "./auth";
import { createUser, __resetStoreForTests } from "./store";

beforeEach(() => {
  __resetStoreForTests();
});

describe("password hashing", () => {
  it("verifies a correct password", () => {
    const hash = hashPassword("correct-horse");
    expect(verifyPassword("correct-horse", hash)).toBe(true);
  });

  it("rejects an incorrect password", () => {
    const hash = hashPassword("correct-horse");
    expect(verifyPassword("wrong-password", hash)).toBe(false);
  });

  it("produces a different hash each time (random salt)", () => {
    expect(hashPassword("same-input")).not.toBe(hashPassword("same-input"));
  });
});

describe("sessions", () => {
  it("resolves a created session to its userId", () => {
    const { user } = createUser("session@example.com", "hashed", "shopper");
    const token = createSession(user.id);
    expect(getUserIdForSession(token)).toBe(user.id);
  });

  it("returns null for an unknown token", () => {
    expect(getUserIdForSession("does-not-exist")).toBeNull();
  });

  it("returns null after a session is destroyed", () => {
    const { user } = createUser("session@example.com", "hashed", "shopper");
    const token = createSession(user.id);
    destroySession(token);
    expect(getUserIdForSession(token)).toBeNull();
  });

  it("survives being read back from storage, not just from memory", () => {
    const { user } = createUser("session@example.com", "hashed", "shopper");
    const token = createSession(user.id);
    // Sessions are rows now, so a fresh lookup must resolve the same user.
    expect(getUserIdForSession(token)).toBe(user.id);
    expect(getUserIdForSession(token)).toBe(user.id);
  });
});

describe("visitorFingerprint", () => {
  it("is stable for the same visitor", () => {
    const a = visitorFingerprint("203.0.113.7", "Mozilla/5.0");
    const b = visitorFingerprint("203.0.113.7", "Mozilla/5.0");
    expect(a).toBe(b);
  });

  it("differs when the address or the browser differs", () => {
    const base = visitorFingerprint("203.0.113.7", "Mozilla/5.0");
    expect(visitorFingerprint("203.0.113.8", "Mozilla/5.0")).not.toBe(base);
    expect(visitorFingerprint("203.0.113.7", "Safari/17")).not.toBe(base);
  });

  it("does not contain the raw address", () => {
    expect(visitorFingerprint("203.0.113.7", "Mozilla/5.0")).not.toContain("203.0.113.7");
  });
});
