-- JobRadar Initial Schema Migration: 0001_initial_schema.sql

-- 1. User Profile & Preferences
CREATE TABLE IF NOT EXISTS user_profile (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL DEFAULT 'User',
  email TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT 'Software Engineer',
  years_of_experience REAL NOT NULL DEFAULT 4.5,
  current_role TEXT,
  current_company TEXT,
  remote_preference TEXT NOT NULL DEFAULT 'remote_preferred', -- 'remote_only', 'remote_preferred', 'hybrid_ok', 'any'
  employment_type TEXT NOT NULL DEFAULT 'full_time',
  min_salary REAL,
  salary_currency TEXT DEFAULT 'INR',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_skills (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  skill_name TEXT NOT NULL,
  category TEXT DEFAULT 'primary',
  created_at TEXT NOT NULL,
  UNIQUE(profile_id, skill_name)
);

CREATE TABLE IF NOT EXISTS user_target_titles (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  title TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(profile_id, title)
);

CREATE TABLE IF NOT EXISTS user_seniority_preferences (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  seniority TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(profile_id, seniority)
);

CREATE TABLE IF NOT EXISTS user_location_preferences (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  location TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(profile_id, location)
);

CREATE TABLE IF NOT EXISTS user_company_preferences (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  company_name TEXT NOT NULL,
  preference_type TEXT NOT NULL DEFAULT 'preferred', -- 'preferred', 'neutral', 'excluded'
  created_at TEXT NOT NULL,
  UNIQUE(profile_id, company_name)
);

CREATE TABLE IF NOT EXISTS user_keyword_exclusions (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  keyword TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'any', -- 'title', 'description', 'company', 'any'
  created_at TEXT NOT NULL,
  UNIQUE(profile_id, keyword, type)
);

-- 2. Companies & Job Sources Registry
CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  domain TEXT,
  career_url TEXT,
  ats_type TEXT, -- 'greenhouse', 'lever', 'ashby', 'workable', 'custom'
  ats_identifier TEXT, -- e.g. 'nvidia', 'stripe', 'figma'
  priority TEXT NOT NULL DEFAULT 'neutral', -- 'preferred', 'neutral', 'excluded'
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS job_sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'ats', 'remote_board', 'api', 'mock'
  enabled INTEGER NOT NULL DEFAULT 1,
  priority TEXT NOT NULL DEFAULT 'medium', -- 'high', 'medium', 'low'
  config_json TEXT,
  last_run_at TEXT,
  last_status TEXT,
  failure_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

-- 3. Normalized Jobs Table
CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  source_job_id TEXT,
  company TEXT NOT NULL,
  company_domain TEXT,
  title TEXT NOT NULL,
  description TEXT,
  location_json TEXT, -- JSON array of strings
  remote_type TEXT NOT NULL DEFAULT 'unknown', -- 'remote', 'hybrid', 'onsite', 'unknown'
  employment_type TEXT NOT NULL DEFAULT 'unknown', -- 'full_time', 'part_time', 'contract', 'internship', 'unknown'
  seniority TEXT NOT NULL DEFAULT 'unknown', -- 'entry', 'junior', 'mid', 'senior', 'lead', 'staff', 'principal', 'unknown'
  date_posted TEXT,
  date_updated TEXT,
  salary_min REAL,
  salary_max REAL,
  salary_currency TEXT,
  application_url TEXT NOT NULL,
  canonical_url TEXT,
  source_url TEXT NOT NULL,
  discovered_at TEXT NOT NULL,
  first_seen_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  fingerprint TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'NEW', -- 'NEW', 'SAVED', 'SELECTED', 'APPLIED', 'REJECTED', 'INTERVIEW', 'OFFER', 'IGNORED'
  notes TEXT,
  interview_date TEXT,
  interview_round TEXT,
  offer_salary REAL,
  offer_currency TEXT,
  viewed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_discovered_at ON jobs(discovered_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_date_posted ON jobs(date_posted DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs(company);
CREATE INDEX IF NOT EXISTS idx_jobs_source ON jobs(source);
CREATE INDEX IF NOT EXISTS idx_jobs_remote_type ON jobs(remote_type);
CREATE INDEX IF NOT EXISTS idx_jobs_fingerprint ON jobs(fingerprint);

-- 4. Match Scores
CREATE TABLE IF NOT EXISTS job_matches (
  job_id TEXT PRIMARY KEY,
  overall_score REAL NOT NULL,
  title_score REAL NOT NULL,
  skill_score REAL NOT NULL,
  seniority_score REAL NOT NULL,
  experience_score REAL NOT NULL,
  location_score REAL NOT NULL,
  matching_skills_json TEXT NOT NULL,
  missing_skills_json TEXT NOT NULL,
  explanation_json TEXT NOT NULL,
  calculated_at TEXT NOT NULL,
  FOREIGN KEY(job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_job_matches_score ON job_matches(overall_score DESC);

-- 5. Application Status History
CREATE TABLE IF NOT EXISTS job_status_history (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  old_status TEXT NOT NULL,
  new_status TEXT NOT NULL,
  notes TEXT,
  changed_at TEXT NOT NULL,
  FOREIGN KEY(job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_status_history_job ON job_status_history(job_id);

-- 6. Distributed Search Lock
CREATE TABLE IF NOT EXISTS search_lock (
  lock_id TEXT PRIMARY KEY,
  locked_by TEXT NOT NULL,
  acquired_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

-- 7. Search Run Tracking
CREATE TABLE IF NOT EXISTS search_runs (
  id TEXT PRIMARY KEY,
  trigger_type TEXT NOT NULL, -- 'cron', 'manual'
  status TEXT NOT NULL, -- 'RUNNING', 'COMPLETED', 'PARTIAL', 'FAILED'
  started_at TEXT NOT NULL,
  finished_at TEXT,
  duration_ms INTEGER,
  sources_attempted INTEGER NOT NULL DEFAULT 0,
  sources_succeeded INTEGER NOT NULL DEFAULT 0,
  sources_failed INTEGER NOT NULL DEFAULT 0,
  jobs_fetched INTEGER NOT NULL DEFAULT 0,
  jobs_normalized INTEGER NOT NULL DEFAULT 0,
  jobs_duplicates INTEGER NOT NULL DEFAULT 0,
  jobs_new INTEGER NOT NULL DEFAULT 0,
  jobs_matching INTEGER NOT NULL DEFAULT 0,
  error_summary TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS search_run_sources (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  source_id TEXT NOT NULL,
  status TEXT NOT NULL, -- 'SUCCESS', 'RATE_LIMITED', 'TIMEOUT', 'FAILED'
  jobs_found INTEGER NOT NULL DEFAULT 0,
  new_jobs INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY(run_id) REFERENCES search_runs(id) ON DELETE CASCADE
);

-- 8. Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  run_id TEXT,
  type TEXT NOT NULL DEFAULT 'email',
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  content_preview TEXT,
  job_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL, -- 'SENT', 'FAILED', 'SKIPPED'
  provider_message_id TEXT,
  error_message TEXT,
  sent_at TEXT NOT NULL
);

-- 9. Saved Searches & Settings
CREATE TABLE IF NOT EXISTS saved_searches (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  filter_config_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_settings (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
