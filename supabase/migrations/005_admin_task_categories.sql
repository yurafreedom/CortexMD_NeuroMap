-- CortexMD: Admin Task Categories
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS admin_task_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  color TEXT,
  icon TEXT,
  is_custom BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS — service role only (same as admin_tasks)
ALTER TABLE admin_task_categories ENABLE ROW LEVEL SECURITY;

-- Add category_id to admin_tasks
ALTER TABLE admin_tasks ADD COLUMN IF NOT EXISTS category_id UUID
  REFERENCES admin_task_categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_admin_tasks_category ON admin_tasks(category_id);

-- Seed predefined categories
INSERT INTO admin_task_categories (name, color, icon, is_custom, sort_order) VALUES
  ('UX/UI Design',           '#8B5CF6', 'Palette',       false, 1),
  ('Pharmacology Data',      '#10B981', 'Pill',          false, 2),
  ('Core Architecture',      '#3B82F6', 'Layers',        false, 3),
  ('AI Chat & Safety',       '#F59E0B', 'MessageSquare', false, 4),
  ('Knowledge Graph',        '#06B6D4', 'Network',       false, 5),
  ('Profile & Data Input',   '#EC4899', 'User',          false, 6),
  ('Security & Privacy',     '#EF4444', 'Shield',        false, 7),
  ('Compliance & Regulatory','#A78BFA', 'FileCheck',     false, 8),
  ('Business & Billing',     '#14B8A6', 'DollarSign',    false, 9),
  ('Infrastructure',         '#6B7280', 'Server',        false, 10),
  ('Bugs & Hotfixes',        '#DC2626', 'Bug',           false, 11),
  ('Research & Validation',  '#0EA5E9', 'Microscope',    false, 12)
ON CONFLICT (name) DO NOTHING;
