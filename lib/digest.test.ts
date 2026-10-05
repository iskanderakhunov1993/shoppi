import { describe, it, expect, beforeAll } from "vitest";
import { unsubscribeToken, verifyUnsubscribeToken } from "./digest";

describe("digest unsubscribe token", () => {
  beforeAll(() => {
    process.env.DIGEST_SECRET ??= "test-secret";
  });

  it("verifies its own token and rejects tampering", () => {
    const t = unsubscribeToken("user-1");
    expect(verifyUnsubscribeToken("user-1", t)).toBe(true);
    expect(verifyUnsubscribeToken("user-2", t)).toBe(false);
    expect(verifyUnsubscribeToken("user-1", t.slice(0, -1) + "x")).toBe(false);
    expect(verifyUnsubscribeToken("user-1", "")).toBe(false);
  });
});
