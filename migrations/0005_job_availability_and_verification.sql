-- Migration: 0005_job_availability_and_verification.sql
-- Decouple Job Availability from Application Status & Track Verification / Provenance

-- 1. Add availability status and verification tracking columns to jobs table
ALTER TABLE jobs ADD COLUMN availability_status TEXT NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE jobs ADD COLUMN last_verified_at TEXT;
ALTER TABLE jobs ADD COLUMN verification_reason TEXT;
ALTER TABLE jobs ADD COLUMN discovered_via TEXT;
ALTER TABLE jobs ADD COLUMN canonical_source TEXT;

-- 2. Create index on availability_status for fast filtering of active opportunities
CREATE INDEX IF NOT EXISTS idx_jobs_availability_status ON jobs(availability_status);
