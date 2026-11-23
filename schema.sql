CREATE TABLE IF NOT EXISTS attempts (
 id BIGSERIAL PRIMARY KEY,
 name TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 100),
 mobile VARCHAR(10) NOT NULL UNIQUE,
 token_hash CHAR(64) NOT NULL UNIQUE,
 started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 completed_at TIMESTAMPTZ,
 answers JSONB NOT NULL DEFAULT '{}'::jsonb,
 scores JSONB,
 total_score INTEGER,
 track TEXT,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS attempts_completed_at_idx ON attempts(completed_at DESC);
-- Safe to rerun for existing databases; preserves all saved assessments.
ALTER TABLE attempts ADD COLUMN IF NOT EXISTS locked_answers JSONB NOT NULL DEFAULT '{}'::jsonb;
