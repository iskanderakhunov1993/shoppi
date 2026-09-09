import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword, createSession, getUserIdForSession, destroySession } from "./auth";

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
    const token = createSession("user-123");
    expect(getUserIdForSession(token)).toBe("user-123");
  });

  it("returns null for an unknown token", () => {
    expect(getUserIdForSession("does-not-exist")).toBeNull();
  });

  it("returns null after a session is destroyed", () => {
    const token = createSession("user-456");
    destroySession(token);
    expect(getUserIdForSession(token)).toBeNull();
  });
});
