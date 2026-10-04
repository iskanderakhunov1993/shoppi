-- Media kit opt-in + shopper profile. Apply to every schema: public, dev, test.
ALTER TABLE creators ADD COLUMN IF NOT EXISTS media_kit_public boolean NOT NULL DEFAULT false;

ALTER TABLE users ADD COLUMN IF NOT EXISTS bio text;

CREATE TABLE IF NOT EXISTS user_avatars (
  user_id text PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  mime text NOT NULL,
  data text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
