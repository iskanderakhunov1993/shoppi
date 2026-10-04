import { sql } from "./db.ts";

/**
 * Counts hits per key in a sliding window, backed by Postgres so the
 * limit holds across serverless instances. Returns true when the caller
 * is over the limit (the hit is then not recorded).
 */
export async function isRateLimited(key: string, max: number, windowSeconds: number): Promise<boolean> {
  const rows = await sql<{ n: number }[]>`
    SELECT count(*)::int AS n FROM rate_limits
    WHERE key = ${key} AND at > now() - make_interval(secs => ${windowSeconds})
  `;
  if (rows[0].n >= max) return true;
  await sql`INSERT INTO rate_limits (key) VALUES (${key})`;
  // Opportunistic cleanup instead of a cron job.
  if (Math.random() < 0.02) await sql`DELETE FROM rate_limits WHERE at < now() - interval '1 day'`;
  return false;
}

export const TOO_MANY = { error: "Слишком много попыток. Подождите немного и попробуйте снова." };
