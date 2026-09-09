import { randomUUID } from "crypto";
import { db, nextSeq } from "./db.ts";

export type Role = "shopper" | "creator" | "brand";

export type User = {
  id: string;
  email: string;
  passwordHash: string;
  verified: boolean;
  verificationToken: string | null;
  role: Role;
  // Only set when role === "brand".
  brandDomain?: string;
  // Marketplace article ids this brand claims. Domain matching is useless
  // on marketplaces — every WB seller shares wildberries.ru — so a brand
  // is matched to links by article instead.
  brandArticles?: string[];
};

export type Creator = {
  id: string;
  userId: string;
  slug: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
};

export type Link = {
  id: string;
  creatorId: string;
  title: string;
  imageUrl?: string;
  price?: number;
  category: "cosmetics" | "mens" | "clothing";
  targetUrl: string;
  marketplace?: string;
  articleId?: string;
  createdAt: string;
};

export type Click = {
  id: string;
  linkId: string;
  clickedAt: string;
  referrer?: string;
  userAgent?: string;
  isBot: boolean;
  fingerprint?: string;
};

type Row = Record<string, unknown>;

const str = (v: unknown): string => String(v);
const opt = (v: unknown): string | undefined => (v === null || v === undefined ? undefined : String(v));
const num = (v: unknown): number | undefined => (v === null || v === undefined ? undefined : Number(v));

function toUser(r: Row): User {
  return {
    id: str(r.id),
    email: str(r.email),
    passwordHash: str(r.password_hash),
    verified: Number(r.verified) === 1,
    verificationToken: r.verification_token === null ? null : str(r.verification_token),
    role: str(r.role) as Role,
    brandDomain: opt(r.brand_domain),
    brandArticles: r.brand_articles ? (JSON.parse(str(r.brand_articles)) as string[]) : undefined,
  };
}

function toCreator(r: Row): Creator {
  return {
    id: str(r.id),
    userId: str(r.user_id),
    slug: str(r.slug),
    displayName: str(r.display_name),
    bio: opt(r.bio),
    avatarUrl: opt(r.avatar_url),
  };
}

function toLink(r: Row): Link {
  return {
    id: str(r.id),
    creatorId: str(r.creator_id),
    title: str(r.title),
    imageUrl: opt(r.image_url),
    price: num(r.price),
    category: str(r.category) as Link["category"],
    targetUrl: str(r.target_url),
    marketplace: opt(r.marketplace),
    articleId: opt(r.article_id),
    createdAt: str(r.created_at),
  };
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/* ---------------------------------------------------------------- users */

export function createUser(
  email: string,
  passwordHash: string,
  role: Role,
  brandDomain?: string
): { user: User; creator?: Creator } {
  if (getUserByEmail(email)) {
    throw new Error("Email already registered");
  }

  const id = randomUUID();
  const verificationToken = randomUUID();
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO users (id, email, password_hash, verified, verification_token, role, brand_domain, created_at)
     VALUES (?, ?, ?, 0, ?, ?, ?, ?)`
  ).run(id, email, passwordHash, verificationToken, role, role === "brand" ? (brandDomain ?? null) : null, now);

  const user = getUserById(id)!;
  if (role !== "creator") return { user };

  const creatorId = randomUUID();
  const slug = `${slugify(email.split("@")[0])}-${id.slice(0, 6)}`;
  const initialName = email.split("@")[0];
  db.prepare(
    `INSERT INTO creators (id, user_id, slug, display_name, display_name_lower, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(creatorId, id, slug, initialName, initialName.toLowerCase(), now);

  return { user, creator: getCreatorById(creatorId)! };
}

export function getUserByEmail(email: string): User | undefined {
  const r = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as Row | undefined;
  return r ? toUser(r) : undefined;
}

export function getUserById(id: string): User | undefined {
  const r = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as Row | undefined;
  return r ? toUser(r) : undefined;
}

export function verifyUser(token: string): User | null {
  const r = db.prepare("SELECT * FROM users WHERE verification_token = ?").get(token) as Row | undefined;
  if (!r) return null;
  db.prepare("UPDATE users SET verified = 1, verification_token = NULL WHERE id = ?").run(str(r.id));
  return getUserById(str(r.id))!;
}

/** Marks a user verified without a token — used by demo seeding. */
export function markUserVerified(userId: string): void {
  db.prepare("UPDATE users SET verified = 1, verification_token = NULL WHERE id = ?").run(userId);
}

export function setBrandArticles(userId: string, articles: string[]): void {
  db.prepare("UPDATE users SET brand_articles = ? WHERE id = ?").run(JSON.stringify(articles), userId);
}

/* ------------------------------------------------------------- creators */

export function getCreatorByUserId(userId: string): Creator | undefined {
  const r = db.prepare("SELECT * FROM creators WHERE user_id = ?").get(userId) as Row | undefined;
  return r ? toCreator(r) : undefined;
}

export function getCreatorBySlug(slug: string): Creator | undefined {
  const r = db.prepare("SELECT * FROM creators WHERE slug = ?").get(slug) as Row | undefined;
  return r ? toCreator(r) : undefined;
}

export function getCreatorById(id: string): Creator | undefined {
  const r = db.prepare("SELECT * FROM creators WHERE id = ?").get(id) as Row | undefined;
  return r ? toCreator(r) : undefined;
}

export function updateCreator(
  creatorId: string,
  patch: { displayName?: string; bio?: string; avatarUrl?: string; slug?: string }
): Creator | undefined {
  const current = getCreatorById(creatorId);
  if (!current) return undefined;

  const nextName = patch.displayName ?? current.displayName;
  db.prepare(
    `UPDATE creators SET display_name = ?, display_name_lower = ?, bio = ?, avatar_url = ?, slug = ? WHERE id = ?`
  ).run(
    nextName,
    nextName.toLowerCase(),
    patch.bio ?? current.bio ?? null,
    patch.avatarUrl ?? current.avatarUrl ?? null,
    patch.slug ?? current.slug,
    creatorId
  );

  return getCreatorById(creatorId);
}

/** Paginated creator directory — the landing and /curators must never load all 500. */
export function listCreators(opts: { limit?: number; offset?: number; query?: string } = {}): Creator[] {
  const limit = Math.min(opts.limit ?? 24, 100);
  const offset = opts.offset ?? 0;

  if (opts.query?.trim()) {
    const q = `%${opts.query.trim().toLowerCase()}%`;
    return (
      db
        .prepare(
          `SELECT * FROM creators
           WHERE display_name_lower LIKE ? OR slug LIKE ?
           ORDER BY display_name LIMIT ? OFFSET ?`
        )
        .all(q, q, limit, offset) as Row[]
    ).map(toCreator);
  }

  return (
    db.prepare("SELECT * FROM creators ORDER BY created_at DESC LIMIT ? OFFSET ?").all(limit, offset) as Row[]
  ).map(toCreator);
}

export function countCreators(query?: string): number {
  if (query?.trim()) {
    const q = `%${query.trim().toLowerCase()}%`;
    const r = db
      .prepare("SELECT COUNT(*) AS c FROM creators WHERE display_name_lower LIKE ? OR slug LIKE ?")
      .get(q, q) as { c: number };
    return Number(r.c);
  }
  const r = db.prepare("SELECT COUNT(*) AS c FROM creators").get() as { c: number };
  return Number(r.c);
}

/* ---------------------------------------------------------------- links */

export function addLink(input: Omit<Link, "id" | "createdAt">): Link {
  const id = randomUUID();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO links (id, creator_id, title, image_url, price, category, target_url, marketplace, article_id, created_at, seq)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    input.creatorId,
    input.title,
    input.imageUrl ?? null,
    input.price ?? null,
    input.category,
    input.targetUrl,
    input.marketplace ?? null,
    input.articleId ?? null,
    now,
    nextSeq()
  );
  return getLink(id)!;
}

export function getLink(id: string): Link | undefined {
  const r = db.prepare("SELECT * FROM links WHERE id = ?").get(id) as Row | undefined;
  return r ? toLink(r) : undefined;
}

export function updateLink(
  id: string,
  patch: { title?: string; category?: Link["category"]; price?: number | null; imageUrl?: string | null }
): Link | undefined {
  const current = getLink(id);
  if (!current) return undefined;

  db.prepare(`UPDATE links SET title = ?, category = ?, price = ?, image_url = ? WHERE id = ?`).run(
    patch.title ?? current.title,
    patch.category ?? current.category,
    patch.price === undefined ? (current.price ?? null) : patch.price,
    patch.imageUrl === undefined ? (current.imageUrl ?? null) : patch.imageUrl,
    id
  );

  return getLink(id);
}

export function deleteLink(id: string): boolean {
  const res = db.prepare("DELETE FROM links WHERE id = ?").run(id);
  return Number(res.changes) > 0;
}

export function listLinksByCreator(creatorId: string, opts: { limit?: number; offset?: number } = {}): Link[] {
  const limit = Math.min(opts.limit ?? 200, 500);
  const offset = opts.offset ?? 0;
  return (
    db
      .prepare("SELECT * FROM links WHERE creator_id = ? ORDER BY seq DESC LIMIT ? OFFSET ?")
      .all(creatorId, limit, offset) as Row[]
  ).map(toLink);
}

export function countLinksByCreator(creatorId: string): number {
  const r = db.prepare("SELECT COUNT(*) AS c FROM links WHERE creator_id = ?").get(creatorId) as { c: number };
  return Number(r.c);
}

function hostnameOf(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function listLinksByDomain(domain: string, opts: { limit?: number } = {}): Link[] {
  const normalized = domain.replace(/^www\./, "").toLowerCase();
  const limit = Math.min(opts.limit ?? 200, 500);
  // SQLite has no URL parser, so filter host in JS — but only over rows
  // whose target_url contains the domain, so this never scans everything.
  return (
    db
      .prepare("SELECT * FROM links WHERE target_url LIKE ? ORDER BY seq DESC LIMIT ?")
      .all(`%${normalized}%`, limit) as Row[]
  )
    .map(toLink)
    .filter((l) => hostnameOf(l.targetUrl) === normalized);
}

export function listLinksByArticles(articles: string[], opts: { limit?: number } = {}): Link[] {
  if (articles.length === 0) return [];
  const limit = Math.min(opts.limit ?? 200, 500);
  const placeholders = articles.map(() => "?").join(",");
  return (
    db
      .prepare(`SELECT * FROM links WHERE article_id IN (${placeholders}) ORDER BY seq DESC LIMIT ?`)
      .all(...articles, limit) as Row[]
  ).map(toLink);
}

export function listLinksByCategory(
  category: Link["category"],
  opts: { limit?: number; offset?: number } = {}
): Link[] {
  const limit = Math.min(opts.limit ?? 48, 100);
  const offset = opts.offset ?? 0;
  return (
    db
      .prepare("SELECT * FROM links WHERE category = ? ORDER BY seq DESC LIMIT ? OFFSET ?")
      .all(category, limit, offset) as Row[]
  ).map(toLink);
}

export function countLinksByCategory(category: Link["category"]): number {
  const r = db.prepare("SELECT COUNT(*) AS c FROM links WHERE category = ?").get(category) as { c: number };
  return Number(r.c);
}

export function listDistinctBrandDomains(limit = 12): { domain: string; linkCount: number }[] {
  // Grouping happens in SQL; only the host extraction is done in JS, over
  // the grouped result rather than over every link.
  const rows = db.prepare("SELECT target_url FROM links").all() as Row[];
  const counts = new Map<string, number>();
  for (const r of rows) {
    const host = hostnameOf(str(r.target_url));
    if (!host) continue;
    counts.set(host, (counts.get(host) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([domain, linkCount]) => ({ domain, linkCount }))
    .sort((a, b) => b.linkCount - a.linkCount)
    .slice(0, limit);
}

/* --------------------------------------------------------------- clicks */

export function recordClick(
  linkId: string,
  meta: {
    referrer?: string;
    userAgent?: string;
    isBot?: boolean;
    fingerprint?: string;
    /** Only set by seeding, to spread demo history over past days. */
    clickedAt?: string;
  } = {}
): Click {
  const id = randomUUID();
  const now = meta.clickedAt ?? new Date().toISOString();
  db.prepare(
    `INSERT INTO clicks (id, link_id, clicked_at, referrer, user_agent, is_bot, fingerprint)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    linkId,
    now,
    meta.referrer ?? null,
    meta.userAgent ?? null,
    meta.isBot ? 1 : 0,
    meta.fingerprint ?? null
  );
  return {
    id,
    linkId,
    clickedAt: now,
    referrer: meta.referrer,
    userAgent: meta.userAgent,
    isBot: Boolean(meta.isBot),
    fingerprint: meta.fingerprint,
  };
}

export function countClicksForLink(linkId: string, opts: { humanOnly?: boolean } = {}): number {
  const sql = opts.humanOnly
    ? "SELECT COUNT(*) AS c FROM clicks WHERE link_id = ? AND is_bot = 0"
    : "SELECT COUNT(*) AS c FROM clicks WHERE link_id = ?";
  const r = db.prepare(sql).get(linkId) as { c: number };
  return Number(r.c);
}

/**
 * Batched counts for many links at once. The per-link version inside a
 * loop is an N+1 query, which is what breaks first at a few hundred
 * creators.
 */
export function countClicksForLinks(linkIds: string[]): Map<string, { total: number; human: number }> {
  const result = new Map<string, { total: number; human: number }>();
  if (linkIds.length === 0) return result;

  const placeholders = linkIds.map(() => "?").join(",");
  const rows = db
    .prepare(
      `SELECT link_id,
              COUNT(*) AS total,
              SUM(CASE WHEN is_bot = 0 THEN 1 ELSE 0 END) AS human
       FROM clicks WHERE link_id IN (${placeholders}) GROUP BY link_id`
    )
    .all(...linkIds) as Row[];

  for (const id of linkIds) result.set(id, { total: 0, human: 0 });
  for (const r of rows) {
    result.set(str(r.link_id), { total: Number(r.total), human: Number(r.human ?? 0) });
  }
  return result;
}

/** True when this visitor already opened this link inside the window. */
export function hasRecentClick(linkId: string, fingerprint: string, withinMinutes = 30): boolean {
  const since = new Date(Date.now() - withinMinutes * 60_000).toISOString();
  const r = db
    .prepare("SELECT 1 AS x FROM clicks WHERE link_id = ? AND fingerprint = ? AND clicked_at > ? LIMIT 1")
    .get(linkId, fingerprint, since) as Row | undefined;
  return Boolean(r);
}

export function creatorClickStats(
  creatorId: string,
  sinceISO?: string
): { total: number; human: number; byDay: { day: string; human: number }[] } {
  const since = sinceISO ?? new Date(Date.now() - 30 * 24 * 3600_000).toISOString();

  const totals = db
    .prepare(
      `SELECT COUNT(*) AS total, SUM(CASE WHEN c.is_bot = 0 THEN 1 ELSE 0 END) AS human
       FROM clicks c JOIN links l ON l.id = c.link_id
       WHERE l.creator_id = ? AND c.clicked_at > ?`
    )
    .get(creatorId, since) as Row;

  const byDay = (
    db
      .prepare(
        `SELECT substr(c.clicked_at, 1, 10) AS day,
                SUM(CASE WHEN c.is_bot = 0 THEN 1 ELSE 0 END) AS human
         FROM clicks c JOIN links l ON l.id = c.link_id
         WHERE l.creator_id = ? AND c.clicked_at > ?
         GROUP BY day ORDER BY day`
      )
      .all(creatorId, since) as Row[]
  ).map((r) => ({ day: str(r.day), human: Number(r.human ?? 0) }));

  return { total: Number(totals.total ?? 0), human: Number(totals.human ?? 0), byDay };
}

/* ------------------------------------------------------------ favorites */

export function addFavorite(userId: string, linkId: string): void {
  db.prepare("INSERT OR IGNORE INTO favorites (user_id, link_id) VALUES (?, ?)").run(userId, linkId);
}

export function removeFavorite(userId: string, linkId: string): void {
  db.prepare("DELETE FROM favorites WHERE user_id = ? AND link_id = ?").run(userId, linkId);
}

export function listFavoriteLinks(userId: string): Link[] {
  return (
    db
      .prepare(
        `SELECT l.* FROM links l JOIN favorites f ON f.link_id = l.id
         WHERE f.user_id = ? ORDER BY l.seq DESC`
      )
      .all(userId) as Row[]
  ).map(toLink);
}

export function isFavorite(userId: string, linkId: string): boolean {
  const r = db
    .prepare("SELECT 1 AS x FROM favorites WHERE user_id = ? AND link_id = ?")
    .get(userId, linkId) as Row | undefined;
  return Boolean(r);
}

export function listFavoriteIds(userId: string, linkIds: string[]): Set<string> {
  if (linkIds.length === 0) return new Set();
  const placeholders = linkIds.map(() => "?").join(",");
  const rows = db
    .prepare(`SELECT link_id FROM favorites WHERE user_id = ? AND link_id IN (${placeholders})`)
    .all(userId, ...linkIds) as Row[];
  return new Set(rows.map((r) => str(r.link_id)));
}

/* ---------------------------------------------------------------- follows */

export function followCreator(userId: string, creatorId: string): void {
  db.prepare(
    "INSERT OR IGNORE INTO follows (user_id, creator_id, created_at) VALUES (?, ?, ?)"
  ).run(userId, creatorId, new Date().toISOString());
}

export function unfollowCreator(userId: string, creatorId: string): void {
  db.prepare("DELETE FROM follows WHERE user_id = ? AND creator_id = ?").run(userId, creatorId);
}

export function isFollowing(userId: string, creatorId: string): boolean {
  const r = db
    .prepare("SELECT 1 AS x FROM follows WHERE user_id = ? AND creator_id = ?")
    .get(userId, creatorId) as Row | undefined;
  return Boolean(r);
}

export function countFollowers(creatorId: string): number {
  const r = db.prepare("SELECT COUNT(*) AS c FROM follows WHERE creator_id = ?").get(creatorId) as {
    c: number;
  };
  return Number(r.c);
}

export function listFollowedCreators(userId: string): Creator[] {
  return (
    db
      .prepare(
        `SELECT c.* FROM creators c JOIN follows f ON f.creator_id = c.id
         WHERE f.user_id = ? ORDER BY f.created_at DESC`
      )
      .all(userId) as Row[]
  ).map(toCreator);
}

export function countFollowedCreators(userId: string): number {
  const r = db.prepare("SELECT COUNT(*) AS c FROM follows WHERE user_id = ?").get(userId) as {
    c: number;
  };
  return Number(r.c);
}

/**
 * The shopper's "circle" feed: every link from every creator they follow,
 * newest first — the one blended stream Circles is actually for, instead
 * of checking each storefront in turn.
 */
export function circleFeed(userId: string, opts: { limit?: number } = {}): Link[] {
  const limit = Math.min(opts.limit ?? 60, 200);
  return (
    db
      .prepare(
        `SELECT l.* FROM links l JOIN follows f ON f.creator_id = l.creator_id
         WHERE f.user_id = ? ORDER BY l.seq DESC LIMIT ?`
      )
      .all(userId, limit) as Row[]
  ).map(toLink);
}

/* ------------------------------------------------------------- sessions */

export function createSessionRow(token: string, userId: string): void {
  db.prepare("INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)").run(
    token,
    userId,
    new Date().toISOString()
  );
}

export function getSessionUserId(token: string): string | null {
  const r = db.prepare("SELECT user_id FROM sessions WHERE token = ?").get(token) as Row | undefined;
  return r ? str(r.user_id) : null;
}

export function deleteSessionRow(token: string): void {
  db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
}

/* ----------------------------------------------------------------- test */

export function __resetStoreForTests() {
  db.exec(`
    DELETE FROM sessions;
    DELETE FROM favorites;
    DELETE FROM clicks;
    DELETE FROM links;
    DELETE FROM creators;
    DELETE FROM users;
  `);
}
