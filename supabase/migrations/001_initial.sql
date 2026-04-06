-- CortexMD: Initial Schema
-- Run this in Supabase SQL Editor

-- Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  display_name TEXT,
  age INTEGER,
  diagnosis TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  settings JSONB DEFAULT '{"theme":"dark","language":"ru","sound":false}'::jsonb
);

-- Drug schemes
CREATE TABLE schemes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Текущая схема',
  drugs JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- User deficits
CREATE TABLE deficits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  deficit_template_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'critical' CHECK (status IN ('critical', 'working', 'compensated')),
  zones TEXT[] NOT NULL,
  deficits_data JSONB,
  needs_data JSONB,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Scheme change history
CREATE TABLE scheme_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  scheme_id UUID REFERENCES schemes(id) ON DELETE CASCADE,
  drugs JSONB NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE deficits ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheme_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own profile" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users see own schemes" ON schemes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see own deficits" ON deficits FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see own history" ON scheme_history FOR ALL USING (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_profile_for_user();

-- Indexes
CREATE INDEX idx_schemes_user_active ON schemes(user_id, is_active);
CREATE INDEX idx_deficits_user ON deficits(user_id);
CREATE INDEX idx_history_user ON scheme_history(user_id, created_at DESC);
