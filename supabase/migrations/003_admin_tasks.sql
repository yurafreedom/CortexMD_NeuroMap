-- CortexMD: Admin Task Tracker
-- Run this in Supabase SQL Editor

CREATE TABLE admin_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'done')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  created_at TIMESTAMPTZ DEFAULT now(),
  closed_at TIMESTAMPTZ
);

-- No RLS — accessed only via service role key from server actions
ALTER TABLE admin_tasks ENABLE ROW LEVEL SECURITY;

-- Only service role can access (no public policies)
-- All access goes through createSupabaseAdmin()

-- Index for listing
CREATE INDEX idx_admin_tasks_status ON admin_tasks(status, created_at DESC);
