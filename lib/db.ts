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

// WAL lets the dev server's several module instances (Turbopack gives
// route handlers and server components separate module graphs) read and
// write the same file without locking each other out.
if (!isTest) {
  db.exec("PRAGMA journal_mode = WAL");
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
    bio          TEXT,
    avatar_url   TEXT,
    created_at   TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS links (
    id          TEXT PRIMARY KEY,
    creator_id  TEXT NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
    title       TEXT NOT NULL,
    image_url   TEXT,
    price       REAL,
    category    TEXT NOT NULL,
    target_url  TEXT NOT NULL,
    marketplace TEXT,
    article_id  TEXT,
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

  CREATE INDEX IF NOT EXISTS idx_links_creator  ON links(creator_id);
  CREATE INDEX IF NOT EXISTS idx_links_article  ON links(article_id);
  CREATE INDEX IF NOT EXISTS idx_clicks_link    ON clicks(link_id);
  CREATE INDEX IF NOT EXISTS idx_clicks_fp      ON clicks(link_id, fingerprint, clicked_at);
`);

export function nextSeq(): number {
  const row = db.prepare("SELECT COALESCE(MAX(seq), 0) AS m FROM links").get() as { m: number };
  return Number(row.m) + 1;
}
