import { describe, it, expect } from "vitest";
import { isBotUserAgent, clientIpFrom } from "./bot-detection";

describe("isBotUserAgent", () => {
  it("flags the Telegram link-preview fetcher", () => {
    // This is the one that matters most: it hits every link a blogger
    // posts, before any human sees the message.
    expect(isBotUserAgent("TelegramBot (like TwitterBot)")).toBe(true);
  });

  it("flags other messenger and search crawlers", () => {
    expect(isBotUserAgent("WhatsApp/2.23")).toBe(true);
    expect(isBotUserAgent("facebookexternalhit/1.1")).toBe(true);
    expect(isBotUserAgent("Mozilla/5.0 (compatible; YandexBot/3.0)")).toBe(true);
    expect(isBotUserAgent("curl/8.4.0")).toBe(true);
  });

  it("treats a missing or empty user agent as non-human", () => {
    expect(isBotUserAgent(null)).toBe(true);
    expect(isBotUserAgent("")).toBe(true);
    expect(isBotUserAgent("   ")).toBe(true);
  });

  it("lets a real browser through", () => {
    expect(
      isBotUserAgent(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
      )
    ).toBe(false);
    expect(
      isBotUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"
      )
    ).toBe(false);
  });
});

describe("clientIpFrom", () => {
  it("takes the first address from x-forwarded-for", () => {
    const headers = new Headers({ "x-forwarded-for": "203.0.113.7, 70.41.3.18" });
    expect(clientIpFrom(headers)).toBe("203.0.113.7");
  });

  it("falls back to x-real-ip, then to a placeholder", () => {
    expect(clientIpFrom(new Headers({ "x-real-ip": "203.0.113.9" }))).toBe("203.0.113.9");
    expect(clientIpFrom(new Headers())).toBe("unknown");
  });
});
