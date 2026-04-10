-- CortexMD: User Profile Extensions
-- Phase 6: Genetic profile, lab results, symptom tracking,
-- treatment history, AI audit log.
-- Run this in Supabase SQL Editor.

-- ═══════════════════════════════════════════════════════
-- 1. Genetic Profile
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS user_genetic_profile (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  cyp2d6_phenotype TEXT CHECK (cyp2d6_phenotype IN ('PM', 'IM', 'EM', 'UM')),
  cyp2c19_phenotype TEXT CHECK (cyp2c19_phenotype IN ('PM', 'IM', 'EM', 'UM')),
  mthfr_c677t TEXT CHECK (mthfr_c677t IN ('CC', 'CT', 'TT')),
  comt_val158met TEXT CHECK (comt_val158met IN ('Val/Val', 'Val/Met', 'Met/Met')),
  bdnf_val66met TEXT CHECK (bdnf_val66met IN ('Val/Val', 'Val/Met', 'Met/Met')),
  httlpr_5 TEXT CHECK (httlpr_5 IN ('L/L', 'L/S', 'S/S')),
  hla_b1502 BOOLEAN,
  hla_b5701 BOOLEAN,
  raw_data_url TEXT,
  uploaded_at TIMESTAMPTZ,
  source TEXT CHECK (source IN ('23andme', 'atlas', 'manual'))
);

ALTER TABLE user_genetic_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own genetic profile"
  ON user_genetic_profile
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════
-- 2. Lab Results
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS user_lab_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  test_name TEXT NOT NULL,
  value NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  reference_range TEXT,
  taken_at TIMESTAMPTZ NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  source TEXT CHECK (source IN ('manual', 'lab_pdf', 'photo')),
  notes TEXT
);

ALTER TABLE user_lab_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own lab results"
  ON user_lab_results
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_lab_results_user_date
  ON user_lab_results(user_id, taken_at DESC);

-- ═══════════════════════════════════════════════════════
-- 3. Symptom Tracking (PHQ-9, GAD-7, ASRS, PCL-5)
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS user_symptom_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scale_type TEXT NOT NULL CHECK (scale_type IN ('PHQ9', 'GAD7', 'ASRS', 'PCL5')),
  total_score INTEGER NOT NULL,
  item_scores JSONB,
  taken_at TIMESTAMPTZ NOT NULL
);

ALTER TABLE user_symptom_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own symptom scores"
  ON user_symptom_scores
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_symptom_scores_user_scale
  ON user_symptom_scores(user_id, scale_type, taken_at DESC);

-- ═══════════════════════════════════════════════════════
-- 4. Treatment History
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS user_treatment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  drug_id TEXT NOT NULL,
  dose_mg NUMERIC NOT NULL,
  started_at DATE NOT NULL,
  ended_at DATE,                -- NULL if currently taking
  reason_for_change TEXT,
  effectiveness INTEGER CHECK (effectiveness BETWEEN 1 AND 10),
  side_effects TEXT[]
);

ALTER TABLE user_treatment_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own treatment history"
  ON user_treatment_history
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_treatment_history_user_drug
  ON user_treatment_history(user_id, drug_id, started_at DESC);

-- ═══════════════════════════════════════════════════════
-- 5. AI Audit Log (compliance category 2.7)
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS ai_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  user_input_hash TEXT,
  user_input_sanitized TEXT,
  input_risk_level TEXT CHECK (input_risk_level IN ('low', 'medium', 'high', 'critical')),
  ai_response_full TEXT,
  output_classifier_result JSONB,
  was_blocked BOOLEAN DEFAULT FALSE,
  was_modified BOOLEAN DEFAULT FALSE,
  crisis_triggered BOOLEAN DEFAULT FALSE,
  pmids_referenced TEXT[],
  inference_model TEXT,
  total_tokens INTEGER,
  user_action TEXT
);

ALTER TABLE ai_audit_log ENABLE ROW LEVEL SECURITY;

-- Users can read their own audit entries but not modify them
CREATE POLICY "Users can read their own audit log"
  ON ai_audit_log
  FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role can INSERT (from server-side API routes)
-- No public INSERT/UPDATE/DELETE policy — writes go through service role

CREATE INDEX idx_audit_log_user_time
  ON ai_audit_log(user_id, timestamp DESC);

CREATE INDEX idx_audit_log_crisis
  ON ai_audit_log(crisis_triggered, timestamp DESC)
  WHERE crisis_triggered = TRUE;
