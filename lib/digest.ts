import { createHmac, timingSafeEqual } from "crypto";
import { sql } from "./db.ts";

export type DigestItem = {
  id: string;
  title: string;
  imageUrl?: string;
  price?: number;
  creatorName: string;
};

export type DigestRecipient = { userId: string; email: string; displayName?: string };

/**
 * Shoppers due a weekly digest: verified, not opted out, not mailed in
 * the last 6 days, following at least one creator.
 */
export async function listDigestRecipients(limit: number): Promise<DigestRecipient[]> {
  const rows = await sql<{ id: string; email: string; display_name: string | null }[]>`
    SELECT u.id, u.email, u.display_name FROM users u
    WHERE u.role = 'shopper' AND u.verified = true AND u.digest_opt_out = false
      AND (u.digest_sent_at IS NULL OR u.digest_sent_at < now() - interval '6 days')
      AND EXISTS (SELECT 1 FROM follows f WHERE f.user_id = u.id)
    ORDER BY u.digest_sent_at NULLS FIRST
    LIMIT ${limit}
  `;
  return rows.map((r) => ({ userId: r.id, email: r.email, displayName: r.display_name ?? undefined }));
}

/** New finds from followed creators in the last 7 days, newest first. */
export async function newFindsFor(userId: string, limit = 6): Promise<{ total: number; items: DigestItem[] }> {
  const rows = await sql<{ id: string; title: string; image_url: string | null; price: number | null; creator_name: string; total: number }[]>`
    SELECT l.id, l.title, l.image_url, l.price, c.display_name AS creator_name, count(*) OVER ()::int AS total
    FROM links l
    JOIN follows f ON f.creator_id = l.creator_id AND f.user_id = ${userId}
    JOIN creators c ON c.id = l.creator_id
    WHERE l.created_at::timestamptz > now() - interval '7 days'
    ORDER BY l.seq DESC
    LIMIT ${limit}
  `;
  return {
    total: rows[0]?.total ?? 0,
    items: rows.map((r) => ({
      id: r.id,
      title: r.title,
      imageUrl: r.image_url ?? undefined,
      price: r.price ?? undefined,
      creatorName: r.creator_name,
    })),
  };
}

export async function markDigestSent(userId: string): Promise<void> {
  await sql`UPDATE users SET digest_sent_at = now() WHERE id = ${userId}`;
}

export async function setDigestOptOut(userId: string, optOut: boolean): Promise<void> {
  await sql`UPDATE users SET digest_opt_out = ${optOut} WHERE id = ${userId}`;
}

function secret(): string {
  const s = process.env.DIGEST_SECRET ?? process.env.CRON_SECRET ?? process.env.CLICK_SALT;
  if (!s) throw new Error("DIGEST_SECRET (or CRON_SECRET / CLICK_SALT) must be set");
  return s;
}

/** Signed one-click unsubscribe token, so the link works without logging in. */
export function unsubscribeToken(userId: string): string {
  return createHmac("sha256", secret()).update(`digest-unsub:${userId}`).digest("base64url");
}

export function verifyUnsubscribeToken(userId: string, token: string): boolean {
  const expected = Buffer.from(unsubscribeToken(userId));
  const given = Buffer.from(token);
  return expected.length === given.length && timingSafeEqual(expected, given);
}
