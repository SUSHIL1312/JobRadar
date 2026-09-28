-- JobRadar Seed Migration: 0002_seed_profile_and_companies.sql

-- 1. Initial Profile
INSERT OR IGNORE INTO user_profile (
  id,
  full_name,
  email,
  title,
  years_of_experience,
  current_role,
  current_company,
  remote_preference,
  employment_type,
  min_salary,
  salary_currency,
  created_at,
  updated_at
) VALUES (
  'default_profile',
  'Sushil',
  'user@example.com',
  'Senior Software Engineer (C++ / AI / Android)',
  4.5,
  'Software Engineer',
  '',
  'remote_preferred',
  'full_time',
  2500000,
  'INR',
  datetime('now'),
  datetime('now')
);

-- 2. Initial Skills
INSERT OR IGNORE INTO user_skills (id, profile_id, skill_name, category, created_at) VALUES
('sk_1', 'default_profile', 'C++', 'primary', datetime('now')),
('sk_2', 'default_profile', 'Python', 'primary', datetime('now')),
('sk_3', 'default_profile', 'C#', 'primary', datetime('now')),
('sk_4', 'default_profile', 'Android', 'primary', datetime('now')),
('sk_5', 'default_profile', 'Kotlin', 'primary', datetime('now')),
('sk_6', 'default_profile', 'Jetpack Compose', 'primary', datetime('now')),
('sk_7', 'default_profile', 'Computer Vision', 'primary', datetime('now')),
('sk_8', 'default_profile', 'Machine Learning', 'primary', datetime('now')),
('sk_9', 'default_profile', 'Deep Learning', 'primary', datetime('now')),
('sk_10', 'default_profile', 'PyTorch', 'primary', datetime('now')),
('sk_11', 'default_profile', 'OpenGL', 'primary', datetime('now')),
('sk_12', 'default_profile', 'GLSL', 'primary', datetime('now')),
('sk_13', 'default_profile', 'Linux', 'primary', datetime('now')),
('sk_14', 'default_profile', 'Tizen', 'primary', datetime('now')),
('sk_15', 'default_profile', 'MediaPipe', 'primary', datetime('now')),
('sk_16', 'default_profile', 'ONNX', 'primary', datetime('now')),
('sk_17', 'default_profile', 'TensorRT', 'primary', datetime('now'));

-- 3. Initial Target Job Titles
INSERT OR IGNORE INTO user_target_titles (id, profile_id, title, created_at) VALUES
('tt_1', 'default_profile', 'Software Engineer', datetime('now')),
('tt_2', 'default_profile', 'C++ Software Engineer', datetime('now')),
('tt_3', 'default_profile', 'Machine Learning Engineer', datetime('now')),
('tt_4', 'default_profile', 'AI Engineer', datetime('now')),
('tt_5', 'default_profile', 'Computer Vision Engineer', datetime('now')),
('tt_6', 'default_profile', 'Android Engineer', datetime('now')),
('tt_7', 'default_profile', 'Embedded AI Engineer', datetime('now')),
('tt_8', 'default_profile', 'Software Development Engineer', datetime('now')),
('tt_9', 'default_profile', 'Applied Scientist', datetime('now'));

-- 4. Initial Seniority Preferences
INSERT OR IGNORE INTO user_seniority_preferences (id, profile_id, seniority, created_at) VALUES
('sn_1', 'default_profile', 'mid', datetime('now')),
('sn_2', 'default_profile', 'senior', datetime('now')),
('sn_3', 'default_profile', 'lead', datetime('now')),
('sn_4', 'default_profile', 'staff', datetime('now'));

-- 5. Initial Location Preferences
INSERT OR IGNORE INTO user_location_preferences (id, profile_id, location, created_at) VALUES
('loc_1', 'default_profile', 'India', datetime('now')),
('loc_2', 'default_profile', 'Remote', datetime('now')),
('loc_3', 'default_profile', 'Worldwide', datetime('now'));

-- 6. Initial Companies Registry
INSERT OR IGNORE INTO companies (id, name, domain, career_url, ats_type, ats_identifier, priority, enabled, created_at) VALUES
('comp_nvidia', 'NVIDIA', 'nvidia.com', 'https://www.nvidia.com/en-us/about-nvidia/careers/', 'greenhouse', 'nvidia', 'preferred', 1, datetime('now')),
('comp_adobe', 'Adobe', 'adobe.com', 'https://www.adobe.com/careers.html', 'greenhouse', 'adobe', 'preferred', 1, datetime('now')),
('comp_qualcomm', 'Qualcomm', 'qualcomm.com', 'https://www.qualcomm.com/company/careers', 'custom', 'qualcomm', 'preferred', 1, datetime('now')),
('comp_stripe', 'Stripe', 'stripe.com', 'https://stripe.com/jobs', 'greenhouse', 'stripe', 'preferred', 1, datetime('now')),
('comp_figma', 'Figma', 'figma.com', 'https://www.figma.com/careers/', 'greenhouse', 'figma', 'preferred', 1, datetime('now')),
('comp_google', 'Google', 'google.com', 'https://careers.google.com/', 'custom', 'google', 'preferred', 1, datetime('now')),
('comp_microsoft', 'Microsoft', 'microsoft.com', 'https://careers.microsoft.com/', 'custom', 'microsoft', 'preferred', 1, datetime('now')),
('comp_meta', 'Meta', 'meta.com', 'https://www.metacareers.com/', 'custom', 'meta', 'preferred', 1, datetime('now')),
('comp_amazon', 'Amazon', 'amazon.com', 'https://www.amazon.jobs/', 'custom', 'amazon', 'preferred', 1, datetime('now')),
('comp_apple', 'Apple', 'apple.com', 'https://www.apple.com/careers/', 'custom', 'apple', 'preferred', 1, datetime('now')),
('comp_amd', 'AMD', 'amd.com', 'https://www.amd.com/en/corporate/careers.html', 'custom', 'amd', 'preferred', 1, datetime('now')),
('comp_intel', 'Intel', 'intel.com', 'https://jobs.intel.com/', 'custom', 'intel', 'preferred', 1, datetime('now')),
('comp_samsung', 'Samsung', 'samsung.com', 'https://www.samsung.com/in/about-us/careers/', 'custom', 'samsung', 'preferred', 1, datetime('now'));

-- Also record preferred company settings for profile
INSERT OR IGNORE INTO user_company_preferences (id, profile_id, company_name, preference_type, created_at) VALUES
('ucp_1', 'default_profile', 'NVIDIA', 'preferred', datetime('now')),
('ucp_2', 'default_profile', 'Adobe', 'preferred', datetime('now')),
('ucp_3', 'default_profile', 'Qualcomm', 'preferred', datetime('now')),
('ucp_4', 'default_profile', 'Google', 'preferred', datetime('now')),
('ucp_5', 'default_profile', 'Microsoft', 'preferred', datetime('now')),
('ucp_6', 'default_profile', 'Meta', 'preferred', datetime('now')),
('ucp_7', 'default_profile', 'Stripe', 'preferred', datetime('now')),
('ucp_8', 'default_profile', 'Apple', 'preferred', datetime('now'));

-- Exclusions
INSERT OR IGNORE INTO user_keyword_exclusions (id, profile_id, keyword, type, created_at) VALUES
('ex_1', 'default_profile', 'intern', 'title', datetime('now')),
('ex_2', 'default_profile', 'internship', 'title', datetime('now')),
('ex_3', 'default_profile', 'unpaid', 'any', datetime('now')),
('ex_4', 'default_profile', 'sales representative', 'title', datetime('now'));

-- 7. Job Sources Registry
INSERT OR IGNORE INTO job_sources (id, name, type, enabled, priority, config_json, created_at) VALUES
('source_mock', 'JobRadar Mock Generator', 'mock', 1, 'high', '{"generator": "realistic_tech_jobs"}', datetime('now')),
('source_greenhouse', 'Greenhouse Public Board API', 'ats', 1, 'high', '{"rate_limit_rpm": 60}', datetime('now')),
('source_lever', 'Lever Postings API', 'ats', 1, 'high', '{"rate_limit_rpm": 60}', datetime('now')),
('source_ashby', 'Ashby Postings API', 'ats', 1, 'high', '{"rate_limit_rpm": 60}', datetime('now')),
('source_remotive', 'Remotive Remote API', 'remote_board', 1, 'medium', '{"category": "software-dev"}', datetime('now'));

-- 8. Default System Settings
INSERT OR IGNORE INTO user_settings (key, value_json, updated_at) VALUES
('matching_weights', '{"title": 25, "skills": 35, "seniority": 15, "experience": 15, "location": 10}', datetime('now')),
('email_notifications', '{"enabled": false, "email": "user@example.com", "min_score": 80, "max_jobs_per_email": 15, "notify_on_zero": false}', datetime('now')),
('search_budget', '{"max_requests": 40, "max_pages": 3, "max_runtime_ms": 300000, "max_retries": 2}', datetime('now')),
('dashboard_last_visit', '{"visited_at": "2026-09-28T00:00:00.000Z"}', datetime('now'));
