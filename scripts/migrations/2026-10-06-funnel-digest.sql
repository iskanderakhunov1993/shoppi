-- Funnel events + weekly digest. Apply to every schema: public, dev, test.
CREATE TABLE IF NOT EXISTS events (
  id bigserial PRIMARY KEY,
  name text NOT NULL,
  visitor text,
  user_id text,
  creator_id text,
  link_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS events_name_created ON events (name, created_at);
CREATE INDEX IF NOT EXISTS events_creator_created ON events (creator_id, created_at);

ALTER TABLE users ADD COLUMN IF NOT EXISTS digest_opt_out boolean NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS digest_sent_at timestamptz;
