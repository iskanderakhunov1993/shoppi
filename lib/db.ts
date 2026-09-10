import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

// Tests run against an in-memory database so they never touch dev data
// and start from a clean slate in every process.
const isTest = Boolean(process.env.VITEST) || process.env.NODE_ENV === "test";
const DB_PATH = isTest ? ":memory:" : join(process.cwd(), "data", "shoppi.db");

if (!isTest) {
  mkdirSync(dirname(DB_PATH), { recursive: true });
}

export const db = new DatabaseSync(DB_PATH);

// `next build` runs several workers at once and each one opens this file,
// so every statement here has to tolerate a concurrent writer. A busy
// timeout makes them queue instead of failing outright.
db.exec("PRAGMA busy_timeout = 5000");

// WAL lets the dev server's several module instances (Turbopack gives
// route handlers and server components separate module graphs) read and
// write the same file without locking each other out. The setting is
// stored in the file itself, so it only has to succeed once — if another
// process is mid-write we can safely carry on without it.
if (!isTest) {
  try {
    db.exec("PRAGMA journal_mode = WAL");
  } catch {
    // already set by whoever opened the file first
  }
}
db.exec("PRAGMA foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id                 TEXT PRIMARY KEY,
    email              TEXT NOT NULL UNIQUE,
    password_hash      TEXT NOT NULL,
    verified           INTEGER NOT NULL DEFAULT 0,
    verification_token TEXT,
    role               TEXT NOT NULL,
    brand_domain       TEXT,
    brand_articles     TEXT,
    created_at         TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS creators (
    id           TEXT PRIMARY KEY,
    user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    slug         TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    -- SQLite's lower() only folds ASCII, so a Cyrillic name would never
    -- match a lowercased search term. This column is folded in JS, where
    -- toLowerCase() is Unicode-aware.
    display_name_lower TEXT NOT NULL DEFAULT '',
    bio          TEXT,
    avatar_url   TEXT,
    created_at   TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS links (
    id          TEXT PRIMARY KEY,
    creator_id  TEXT NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
    title       TEXT NOT NULL,
    title_lower TEXT NOT NULL DEFAULT '',
    image_url   TEXT,
    price       REAL,
    category    TEXT NOT NULL,
    target_url  TEXT NOT NULL,
    marketplace TEXT,
    article_id  TEXT,
    -- Not surfaced anywhere yet: this is architectural insurance for P2
    -- promo-code attribution, so the column exists before any UI needs it
    -- rather than requiring a migration once it does.
    promo_code  TEXT,
    created_at  TEXT NOT NULL,
    seq         INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS clicks (
    id          TEXT PRIMARY KEY,
    link_id     TEXT NOT NULL REFERENCES links(id) ON DELETE CASCADE,
    clicked_at  TEXT NOT NULL,
    referrer    TEXT,
    user_agent  TEXT,
    is_bot      INTEGER NOT NULL DEFAULT 0,
    fingerprint TEXT
  );

  CREATE TABLE IF NOT EXISTS favorites (
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    link_id TEXT NOT NULL REFERENCES links(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, link_id)
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token      TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL
  );

  -- A shopper's own "circle": creators whose picks they want blended into
  -- one feed, rather than checking each storefront separately.
  CREATE TABLE IF NOT EXISTS follows (
    user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    creator_id TEXT NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL,
    PRIMARY KEY (user_id, creator_id)
  );

  CREATE INDEX IF NOT EXISTS idx_links_creator  ON links(creator_id);
  CREATE INDEX IF NOT EXISTS idx_links_title_lower ON links(title_lower);
  CREATE INDEX IF NOT EXISTS idx_links_article  ON links(article_id);
  CREATE INDEX IF NOT EXISTS idx_clicks_link    ON clicks(link_id);
  CREATE INDEX IF NOT EXISTS idx_clicks_fp      ON clicks(link_id, fingerprint, clicked_at);
  CREATE INDEX IF NOT EXISTS idx_follows_creator ON follows(creator_id);
`);

// Adds columns introduced after a database file already existed.
for (const [table, column, ddl] of [
  ["creators", "display_name_lower", "ALTER TABLE creators ADD COLUMN display_name_lower TEXT NOT NULL DEFAULT ''"],
  ["links", "title_lower", "ALTER TABLE links ADD COLUMN title_lower TEXT NOT NULL DEFAULT ''"],
  ["links", "promo_code", "ALTER TABLE links ADD COLUMN promo_code TEXT"],
] as const) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  if (!cols.some((c) => c.name === column)) {
    try {
      db.exec(ddl);
    } catch {
      // another worker added it first
    }
  }
}

export function nextSeq(): number {
  const row = db.prepare("SELECT COALESCE(MAX(seq), 0) AS m FROM links").get() as { m: number };
  return Number(row.m) + 1;
}
