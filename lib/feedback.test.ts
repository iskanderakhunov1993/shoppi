import { describe, it, expect } from "vitest";
import { validateFeedback } from "./feedback";

describe("validateFeedback", () => {
  it("accepts a normal message with or without email", () => {
    expect(validateFeedback({ message: "Не открывается товар" })).toBeNull();
    expect(validateFeedback({ message: "Не открывается товар", email: "a@b.ru" })).toBeNull();
  });
  it("rejects empty, too long and bad email", () => {
    expect(validateFeedback({ message: "  " })).toMatch(/парой слов/);
    expect(validateFeedback({ message: "x".repeat(2001) })).toMatch(/2000/);
    expect(validateFeedback({ message: "Всё сломалось", email: "not-an-email" })).toMatch(/email/);
    expect(validateFeedback({})).not.toBeNull();
  });
});
