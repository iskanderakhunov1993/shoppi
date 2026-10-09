-- User feedback from the "Сообщить о проблеме" widget; read by the nightly support agent.
-- Apply to every schema: public, dev, test.
CREATE TABLE IF NOT EXISTS feedback (
  id text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id text,
  email text,
  page text,
  message text NOT NULL,
  user_agent text,
  status text NOT NULL DEFAULT 'new',
  issue_url text
);
CREATE INDEX IF NOT EXISTS feedback_status_created ON feedback (status, created_at);
