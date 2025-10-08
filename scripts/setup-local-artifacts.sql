-- Run this in your LOCAL Supabase (Docker) to create artifacts table
-- Connect to: http://127.0.0.1:54321

-- Copy the ai_artifacts table from production
CREATE TABLE IF NOT EXISTS ai_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  code TEXT NOT NULL,
  language TEXT NOT NULL,
  artifact_type TEXT NOT NULL,
  created_by TEXT NOT NULL,
  is_global BOOLEAN DEFAULT false,
  tags TEXT[],
  thumbnail_url TEXT,
  view_count INTEGER DEFAULT 0,
  fork_count INTEGER DEFAULT 0,
  version INTEGER DEFAULT 1,
  parent_artifact_id UUID REFERENCES ai_artifacts(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_ai_artifacts_created_by ON ai_artifacts(created_by);
CREATE INDEX IF NOT EXISTS idx_ai_artifacts_is_global ON ai_artifacts(is_global);
CREATE INDEX IF NOT EXISTS idx_ai_artifacts_language ON ai_artifacts(language);

-- Enable RLS
ALTER TABLE ai_artifacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Allow all operations on ai_artifacts"
  ON ai_artifacts FOR ALL
  USING (true)
  WITH CHECK (true);

-- Sample artifact
INSERT INTO ai_artifacts (title, description, code, language, artifact_type, created_by, is_global, tags)
VALUES (
  'Sample Countdown Timer',
  'A simple countdown timer with start/stop controls',
  '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Timer</title><style>body{margin:0;padding:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#222;color:white;font-family:sans-serif;}</style></head><body><h1>Timer Ready!</h1></body></html>',
  'html',
  'tool',
  'system',
  true,
  ARRAY['sample', 'timer']
)
ON CONFLICT DO NOTHING;

SELECT 'ai_artifacts table created successfully!' as message;

