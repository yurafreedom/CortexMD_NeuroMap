-- User presets: saved drug scheme combinations
CREATE TABLE IF NOT EXISTS user_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  drugs JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own presets" ON user_presets
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_user_presets_user ON user_presets(user_id);
