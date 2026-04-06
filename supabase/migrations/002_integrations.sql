-- Integrations table for OAuth tokens (Whoop, etc.)
CREATE TABLE IF NOT EXISTS integrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, provider)
);

ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

-- Users can read their own integrations
CREATE POLICY "Users read own integrations"
  ON integrations FOR SELECT
  USING (auth.uid() = user_id);

-- Users can delete their own integrations
CREATE POLICY "Users delete own integrations"
  ON integrations FOR DELETE
  USING (auth.uid() = user_id);

-- Service role handles insert/update (via admin client)
CREATE POLICY "Service role manages integrations"
  ON integrations FOR ALL
  USING (auth.role() = 'service_role');
