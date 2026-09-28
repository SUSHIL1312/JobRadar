-- JobRadar Enhanced Architecture Migration: 0003_rich_jobs_and_applications.sql

-- 1. Atomic Sequence Counter for Human-Readable Job IDs (JR-YYYY-NNNNNN)
CREATE TABLE IF NOT EXISTS job_id_sequence (
  year INTEGER PRIMARY KEY,
  current_value INTEGER NOT NULL DEFAULT 0
);

INSERT OR IGNORE INTO job_id_sequence (year, current_value) VALUES (2026, 0);

-- 2. Add Rich Metadata Columns to Jobs Table
ALTER TABLE jobs ADD COLUMN job_id TEXT;
ALTER TABLE jobs ADD COLUMN min_experience_years REAL;
ALTER TABLE jobs ADD COLUMN max_experience_years REAL;
ALTER TABLE jobs ADD COLUMN experience_text TEXT;
ALTER TABLE jobs ADD COLUMN salary_period TEXT DEFAULT 'year';
ALTER TABLE jobs ADD COLUMN applied_at TEXT;
ALTER TABLE jobs ADD COLUMN rejected_at TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_jobs_job_id ON jobs(job_id);
CREATE INDEX IF NOT EXISTS idx_jobs_source_job_id ON jobs(source_job_id);

-- 3. Dedicated Application Records Table
CREATE TABLE IF NOT EXISTS job_applications (
  application_id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  human_job_id TEXT,
  status TEXT NOT NULL, -- 'selected', 'applied', 'interview', 'offer', 'rejected', 'withdrawn'
  applied_at TEXT,
  application_url TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_applications_job ON job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON job_applications(status);

-- 4. Application Status History Timeline Table
CREATE TABLE IF NOT EXISTS application_status_history (
  id TEXT PRIMARY KEY,
  application_id TEXT,
  job_id TEXT NOT NULL,
  human_job_id TEXT,
  old_status TEXT,
  new_status TEXT NOT NULL,
  notes TEXT,
  changed_at TEXT NOT NULL,
  FOREIGN KEY(job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_app_history_job ON application_status_history(job_id);

-- 5. Backfill any existing jobs with human-readable IDs if null
UPDATE jobs SET job_id = 'JR-2026-' || printf('%06d', rowid) WHERE job_id IS NULL;
