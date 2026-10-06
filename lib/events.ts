import { sql } from "./db.ts";

/**
 * Funnel events. One row per meaningful step; `visitor` is the same
 * IP+UA fingerprint used for click dedup, so anonymous storefront views
 * and later signed-in actions line up as one person.
 */
export type EventName =
  | "storefront_view"
  | "link_click"
  | "favorite_add"
  | "follow_add"
  | "signup"
  | "email_verified"
  | "digest_sent"
  | "digest_click";

export const FUNNEL: { name: EventName; label: string }[] = [
  { name: "storefront_view", label: "Открыли витрину" },
  { name: "link_click", label: "Перешли в магазин" },
  { name: "favorite_add", label: "Сохранили товар" },
  { name: "follow_add", label: "Подписались на блогера" },
  { name: "signup", label: "Зарегистрировались" },
  { name: "email_verified", label: "Подтвердили почту" },
];

type Props = { visitor?: string; userId?: string; creatorId?: string; linkId?: string };

/** Never throws and never blocks the caller's response on failure. */
export async function track(name: EventName, props: Props = {}): Promise<void> {
  try {
    await sql`
      INSERT INTO events (name, visitor, user_id, creator_id, link_id)
      VALUES (${name}, ${props.visitor ?? null}, ${props.userId ?? null}, ${props.creatorId ?? null}, ${props.linkId ?? null})
    `;
  } catch (err) {
    console.error("track failed:", name, err);
  }
}

/** Distinct people per step; a person is a user id when known, else the visitor fingerprint. */
export async function funnelCounts(days: number): Promise<Record<EventName, number>> {
  const rows = await sql<{ name: EventName; n: number }[]>`
    SELECT name, count(DISTINCT coalesce(user_id, visitor, id::text))::int AS n
    FROM events
    WHERE created_at > now() - make_interval(days => ${days})
    GROUP BY name
  `;
  const out = {} as Record<EventName, number>;
  for (const r of rows) out[r.name] = r.n;
  return out;
}

export async function topCreators(days: number, limit = 10) {
  return sql<{ slug: string; display_name: string; views: number; clicks: number; saves: number; follows: number }[]>`
    SELECT c.slug, c.display_name,
      count(*) FILTER (WHERE e.name = 'storefront_view')::int AS views,
      count(*) FILTER (WHERE e.name = 'link_click')::int AS clicks,
      count(*) FILTER (WHERE e.name = 'favorite_add')::int AS saves,
      count(*) FILTER (WHERE e.name = 'follow_add')::int AS follows
    FROM events e JOIN creators c ON c.id = e.creator_id
    WHERE e.created_at > now() - make_interval(days => ${days})
    GROUP BY c.slug, c.display_name
    ORDER BY clicks DESC, views DESC
    LIMIT ${limit}
  `;
}
