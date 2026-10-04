-- P0 security pass. Apply to every schema: public, dev, test.
ALTER TABLE users ADD COLUMN IF NOT EXISTS wishlist_public boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS rate_limits (
  key text NOT NULL,
  at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS rate_limits_key_at ON rate_limits (key, at);
