-- JobRadar Migration: 0004_target_companies_and_profile_enhancements.sql
-- Tailored for 4.5 YOE Samsung SDE (IIT Guwahati M.Tech) profile & 30 Target Companies Universe

-- 1. Add enhanced profile columns to user_profile if they do not exist
ALTER TABLE user_profile ADD COLUMN education TEXT DEFAULT 'M.Tech Computer Science, IIT Guwahati';
ALTER TABLE user_profile ADD COLUMN current_comp_base REAL DEFAULT 2150000;
ALTER TABLE user_profile ADD COLUMN current_comp_bonus REAL DEFAULT 200000;
ALTER TABLE user_profile ADD COLUMN target_base REAL DEFAULT 4000000;
ALTER TABLE user_profile ADD COLUMN target_tc REAL DEFAULT 5000000;
ALTER TABLE user_profile ADD COLUMN remote_priority TEXT DEFAULT 'highest';

-- 2. Add tier column to companies table if not exists
ALTER TABLE companies ADD COLUMN tier TEXT DEFAULT 'tier_1';
ALTER TABLE companies ADD COLUMN target_roles TEXT;
ALTER TABLE companies ADD COLUMN remote_eligible INTEGER DEFAULT 1;

-- 3. Seed / Update Master User Profile (Sushil)
INSERT OR REPLACE INTO user_profile (
  id,
  full_name,
  email,
  title,
  years_of_experience,
  current_role,
  current_company,
  education,
  current_comp_base,
  current_comp_bonus,
  target_base,
  target_tc,
  remote_preference,
  remote_priority,
  employment_type,
  min_salary,
  salary_currency,
  created_at,
  updated_at
) VALUES (
  'default_profile',
  'Sushil',
  'sushil13129340@gmail.com',
  'Senior Software Engineer (C++ / AI / ML / CV / Systems)',
  4.5,
  'Software Engineer',
  'Samsung R&D',
  'M.Tech Computer Science, IIT Guwahati',
  2150000,
  200000,
  4000000,
  5000000,
  'remote_preferred',
  'highest',
  'full_time',
  4000000,
  'INR',
  datetime('now'),
  datetime('now')
);

-- 4. Seed User Skills (28 Core Competencies)
DELETE FROM user_skills WHERE profile_id = 'default_profile';
INSERT INTO user_skills (id, profile_id, skill_name, category, created_at) VALUES
('sk_1', 'default_profile', 'C++', 'primary', datetime('now')),
('sk_2', 'default_profile', 'Python', 'primary', datetime('now')),
('sk_3', 'default_profile', 'C#', 'primary', datetime('now')),
('sk_4', 'default_profile', 'Machine Learning', 'primary', datetime('now')),
('sk_5', 'default_profile', 'Deep Learning', 'primary', datetime('now')),
('sk_6', 'default_profile', 'Computer Vision', 'primary', datetime('now')),
('sk_7', 'default_profile', 'PyTorch', 'primary', datetime('now')),
('sk_8', 'default_profile', 'Generative AI', 'primary', datetime('now')),
('sk_9', 'default_profile', 'LLMs', 'primary', datetime('now')),
('sk_10', 'default_profile', 'LangChain', 'primary', datetime('now')),
('sk_11', 'default_profile', 'LangGraph', 'primary', datetime('now')),
('sk_12', 'default_profile', 'AI/ML Pipelines', 'primary', datetime('now')),
('sk_13', 'default_profile', 'Multithreading', 'primary', datetime('now')),
('sk_14', 'default_profile', 'Performance Optimization', 'primary', datetime('now')),
('sk_15', 'default_profile', 'Object Detection', 'primary', datetime('now')),
('sk_16', 'default_profile', 'Image Analysis', 'primary', datetime('now')),
('sk_17', 'default_profile', 'Multimedia Processing', 'primary', datetime('now')),
('sk_18', 'default_profile', 'Data Structures & Algorithms', 'primary', datetime('now')),
('sk_19', 'default_profile', 'System Design', 'primary', datetime('now')),
('sk_20', 'default_profile', 'HLD', 'primary', datetime('now')),
('sk_21', 'default_profile', 'LLD', 'primary', datetime('now')),
('sk_22', 'default_profile', 'Design Patterns', 'primary', datetime('now')),
('sk_23', 'default_profile', 'Microservices', 'primary', datetime('now')),
('sk_24', 'default_profile', 'REST APIs', 'primary', datetime('now')),
('sk_25', 'default_profile', 'Docker', 'primary', datetime('now')),
('sk_26', 'default_profile', 'Redis', 'primary', datetime('now')),
('sk_27', 'default_profile', 'Kafka', 'primary', datetime('now')),
('sk_28', 'default_profile', 'Git', 'primary', datetime('now'));

-- 5. Seed Target Job Titles (22 Role Families)
DELETE FROM user_target_titles WHERE profile_id = 'default_profile';
INSERT INTO user_target_titles (id, profile_id, title, created_at) VALUES
('tt_1', 'default_profile', 'Software Engineer', datetime('now')),
('tt_2', 'default_profile', 'Senior Software Engineer', datetime('now')),
('tt_3', 'default_profile', 'Software Development Engineer', datetime('now')),
('tt_4', 'default_profile', 'SDE II', datetime('now')),
('tt_5', 'default_profile', 'C++ Software Engineer', datetime('now')),
('tt_6', 'default_profile', 'C++ Engineer', datetime('now')),
('tt_7', 'default_profile', 'Systems Software Engineer', datetime('now')),
('tt_8', 'default_profile', 'ML Engineer', datetime('now')),
('tt_9', 'default_profile', 'Machine Learning Engineer', datetime('now')),
('tt_10', 'default_profile', 'AI Engineer', datetime('now')),
('tt_11', 'default_profile', 'AI/ML Engineer', datetime('now')),
('tt_12', 'default_profile', 'Computer Vision Engineer', datetime('now')),
('tt_13', 'default_profile', 'Deep Learning Engineer', datetime('now')),
('tt_14', 'default_profile', 'Applied Scientist', datetime('now')),
('tt_15', 'default_profile', 'Software Engineer - AI', datetime('now')),
('tt_16', 'default_profile', 'Software Engineer - ML', datetime('now')),
('tt_17', 'default_profile', 'Embedded AI Engineer', datetime('now')),
('tt_18', 'default_profile', 'AI Infrastructure Engineer', datetime('now')),
('tt_19', 'default_profile', 'Inference Engineer', datetime('now')),
('tt_20', 'default_profile', 'Multimedia Engineer', datetime('now')),
('tt_21', 'default_profile', 'Performance Engineer', datetime('now')),
('tt_22', 'default_profile', 'Distributed Systems Engineer', datetime('now')),
('tt_23', 'default_profile', 'Backend Engineer', datetime('now')),
('tt_24', 'default_profile', 'Platform Engineer', datetime('now'));

-- 6. Seed Seniority Preferences
DELETE FROM user_seniority_preferences WHERE profile_id = 'default_profile';
INSERT INTO user_seniority_preferences (id, profile_id, seniority, created_at) VALUES
('sn_1', 'default_profile', 'mid', datetime('now')),
('sn_2', 'default_profile', 'senior', datetime('now')),
('sn_3', 'default_profile', 'lead', datetime('now')),
('sn_4', 'default_profile', 'staff', datetime('now'));

-- 7. Seed Location Preferences
DELETE FROM user_location_preferences WHERE profile_id = 'default_profile';
INSERT INTO user_location_preferences (id, profile_id, location, created_at) VALUES
('loc_1', 'default_profile', 'India', datetime('now')),
('loc_2', 'default_profile', 'Remote — India', datetime('now')),
('loc_3', 'default_profile', 'Remote — Worldwide', datetime('now')),
('loc_4', 'default_profile', 'Bengaluru', datetime('now')),
('loc_5', 'default_profile', 'Hyderabad', datetime('now')),
('loc_6', 'default_profile', 'Gurugram', datetime('now')),
('loc_7', 'default_profile', 'Noida', datetime('now')),
('loc_8', 'default_profile', 'Pune', datetime('now')),
('loc_9', 'default_profile', 'Mumbai', datetime('now')),
('loc_10', 'default_profile', 'Remote', datetime('now'));

-- 8. Seed 30 Target Companies Universe
-- Clear previous companies to avoid duplicate or conflicting tiers
DELETE FROM companies;
INSERT INTO companies (id, name, domain, career_url, ats_type, ats_identifier, priority, tier, target_roles, remote_eligible, enabled, created_at) VALUES
-- TIER 1: MUST CHECK (🔥🔥🔥 High Priority)
('comp_nvidia', 'NVIDIA', 'nvidia.com', 'https://jobs.nvidia.com/careers', 'custom', 'nvidia', 'preferred', 'tier_1', 'C++, AI/ML, CV, CUDA, Deep Learning, Systems', 1, 1, datetime('now')),
('comp_google', 'Google', 'google.com', 'https://careers.google.com/', 'custom', 'google', 'preferred', 'tier_1', 'SWE, ML Engineer, AI, CV, Systems', 1, 1, datetime('now')),
('comp_microsoft', 'Microsoft', 'microsoft.com', 'https://careers.microsoft.com/v2/global/en/locations/india.html', 'custom', 'microsoft', 'preferred', 'tier_1', 'SWE, AI/ML, C++, Azure, Copilot', 1, 1, datetime('now')),
('comp_meta', 'Meta', 'meta.com', 'https://www.metacareers.com/', 'custom', 'meta', 'preferred', 'tier_1', 'SWE, ML, AI, Infrastructure, CV', 1, 1, datetime('now')),
('comp_apple', 'Apple', 'apple.com', 'https://www.apple.com/careers/', 'custom', 'apple', 'preferred', 'tier_1', 'C++, ML, Computer Vision, Systems, Multimedia', 1, 1, datetime('now')),
('comp_amazon', 'Amazon', 'amazon.com', 'https://www.amazon.jobs/', 'custom', 'amazon', 'preferred', 'tier_1', 'SDE II, AI/ML, Systems, AWS', 1, 1, datetime('now')),
('comp_atlassian', 'Atlassian', 'atlassian.com', 'https://www.atlassian.com/company/careers', 'lever', 'atlassian', 'preferred', 'tier_1', 'Backend, Platform, AI/ML, Distributed Systems (Team Anywhere)', 1, 1, datetime('now')),
('comp_uber', 'Uber', 'uber.com', 'https://www.uber.com/us/en/careers/', 'custom', 'uber', 'preferred', 'tier_1', 'Backend, ML, Distributed Systems, C++', 1, 1, datetime('now')),
('comp_linkedin', 'LinkedIn', 'linkedin.com', 'https://careers.linkedin.com/', 'custom', 'linkedin', 'preferred', 'tier_1', 'SWE, ML, AI, Search, Distributed Systems', 1, 1, datetime('now')),
('comp_adobe', 'Adobe', 'adobe.com', 'https://www.adobe.com/careers.html', 'greenhouse', 'adobe', 'preferred', 'tier_1', 'C++, AI/ML, Creative Cloud, Computer Vision', 1, 1, datetime('now')),
('comp_salesforce', 'Salesforce', 'salesforce.com', 'https://careers.salesforce.com/en/jobs/?country=India', 'custom', 'salesforce', 'preferred', 'tier_1', 'Backend, AI, Platform, Distributed Systems', 1, 1, datetime('now')),
('comp_rubrik', 'Rubrik', 'rubrik.com', 'https://www.rubrik.com/company/careers/departments/engineering', 'greenhouse', 'rubrik', 'preferred', 'tier_1', 'C++, Distributed Systems, AI, Cloud', 1, 1, datetime('now')),
('comp_databricks', 'Databricks', 'databricks.com', 'https://www.databricks.com/company/careers/open-positions', 'greenhouse', 'databricks', 'preferred', 'tier_1', 'Distributed Systems, ML, AI, Data', 1, 1, datetime('now')),
('comp_cloudflare', 'Cloudflare', 'cloudflare.com', 'https://www.cloudflare.com/careers/jobs/', 'greenhouse', 'cloudflare', 'preferred', 'tier_1', 'Systems, C++, Backend, Infrastructure (Distributed Roles)', 1, 1, datetime('now')),
('comp_qualcomm', 'Qualcomm', 'qualcomm.com', 'https://www.qualcomm.com/company/careers', 'custom', 'qualcomm', 'preferred', 'tier_1', 'C++, Embedded AI, Computer Vision, ML', 1, 1, datetime('now')),
('comp_amd', 'AMD', 'amd.com', 'https://www.amd.com/en/corporate/careers.html', 'custom', 'amd', 'preferred', 'tier_1', 'C++, GPU, AI, Systems, Performance', 1, 1, datetime('now')),
('comp_deshaw', 'DE Shaw', 'deshaw.com', 'https://www.deshaw.com/careers', 'custom', 'deshaw', 'preferred', 'tier_1', 'C++, Python, Systems, Quant Engineering', 1, 1, datetime('now')),
('comp_confluent', 'Confluent', 'confluent.io', 'https://www.confluent.io/careers/', 'greenhouse', 'confluent', 'preferred', 'tier_1', 'Kafka, Distributed Systems, C++, Backend', 1, 1, datetime('now')),

-- TIER 2: HIGH VALUE (🔥🔥 Priority)
('comp_stripe', 'Stripe', 'stripe.com', 'https://stripe.com/jobs', 'greenhouse', 'stripe', 'preferred', 'tier_2', 'Backend, Infrastructure, Distributed Systems', 1, 1, datetime('now')),
('comp_rippling', 'Rippling', 'rippling.com', 'https://www.rippling.com/careers', 'greenhouse', 'rippling', 'preferred', 'tier_2', 'Backend, Platform, Distributed Systems', 1, 1, datetime('now')),
('comp_airbnb', 'Airbnb', 'airbnb.com', 'https://careers.airbnb.com/', 'greenhouse', 'airbnb', 'preferred', 'tier_2', 'Backend, ML, Infrastructure', 1, 1, datetime('now')),
('comp_coinbase', 'Coinbase', 'coinbase.com', 'https://www.coinbase.com/careers', 'greenhouse', 'coinbase', 'preferred', 'tier_2', 'Backend, C++, Crypto infrastructure (Remote-first)', 1, 1, datetime('now')),
('comp_servicenow', 'ServiceNow', 'servicenow.com', 'https://careers.servicenow.com/', 'custom', 'servicenow', 'preferred', 'tier_2', 'Platform, AI, Backend, Cloud', 1, 1, datetime('now')),
('comp_walmart', 'Walmart Global Tech', 'walmart.com', 'https://careers.walmart.com/technology', 'custom', 'walmart', 'preferred', 'tier_2', 'Backend, Cloud, ML, Systems', 1, 1, datetime('now')),
('comp_intel', 'Intel', 'intel.com', 'https://jobs.intel.com/', 'custom', 'intel', 'preferred', 'tier_2', 'C++, AI, Computer Vision, Systems', 1, 1, datetime('now')),
('comp_arm', 'Arm', 'arm.com', 'https://careers.arm.com/', 'custom', 'arm', 'preferred', 'tier_2', 'C++, CPU/GPU, Systems, AI', 1, 1, datetime('now')),
('comp_bloomberg', 'Bloomberg', 'bloomberg.com', 'https://www.bloomberg.com/careers/technology/', 'custom', 'bloomberg', 'preferred', 'tier_2', 'C++, Python, Systems, Data', 1, 1, datetime('now')),
('comp_palantir', 'Palantir', 'palantir.com', 'https://www.palantir.com/careers/', 'lever', 'palantir', 'preferred', 'tier_2', 'Software, AI, Distributed Systems', 1, 1, datetime('now')),
('comp_snowflake', 'Snowflake', 'snowflake.com', 'https://careers.snowflake.com/', 'greenhouse', 'snowflake', 'preferred', 'tier_2', 'Distributed Systems, Cloud, AI/Data', 1, 1, datetime('now')),
('comp_janestreet', 'Jane Street', 'janestreet.com', 'https://www.janestreet.com/join-jane-street/open-roles/', 'custom', 'janestreet', 'preferred', 'tier_2', 'C++, Python, Distributed Systems', 1, 1, datetime('now'));

-- 9. Seed user_company_preferences for all 30 target companies
DELETE FROM user_company_preferences WHERE profile_id = 'default_profile';
INSERT INTO user_company_preferences (id, profile_id, company_name, preference_type, created_at) VALUES
('ucp_1', 'default_profile', 'NVIDIA', 'preferred', datetime('now')),
('ucp_2', 'default_profile', 'Google', 'preferred', datetime('now')),
('ucp_3', 'default_profile', 'Microsoft', 'preferred', datetime('now')),
('ucp_4', 'default_profile', 'Meta', 'preferred', datetime('now')),
('ucp_5', 'default_profile', 'Apple', 'preferred', datetime('now')),
('ucp_6', 'default_profile', 'Amazon', 'preferred', datetime('now')),
('ucp_7', 'default_profile', 'Atlassian', 'preferred', datetime('now')),
('ucp_8', 'default_profile', 'Uber', 'preferred', datetime('now')),
('ucp_9', 'default_profile', 'LinkedIn', 'preferred', datetime('now')),
('ucp_10', 'default_profile', 'Adobe', 'preferred', datetime('now')),
('ucp_11', 'default_profile', 'Salesforce', 'preferred', datetime('now')),
('ucp_12', 'default_profile', 'Rubrik', 'preferred', datetime('now')),
('ucp_13', 'default_profile', 'Databricks', 'preferred', datetime('now')),
('ucp_14', 'default_profile', 'Cloudflare', 'preferred', datetime('now')),
('ucp_15', 'default_profile', 'Qualcomm', 'preferred', datetime('now')),
('ucp_16', 'default_profile', 'AMD', 'preferred', datetime('now')),
('ucp_17', 'default_profile', 'DE Shaw', 'preferred', datetime('now')),
('ucp_18', 'default_profile', 'Confluent', 'preferred', datetime('now')),
('ucp_19', 'default_profile', 'Stripe', 'preferred', datetime('now')),
('ucp_20', 'default_profile', 'Rippling', 'preferred', datetime('now')),
('ucp_21', 'default_profile', 'Airbnb', 'preferred', datetime('now')),
('ucp_22', 'default_profile', 'Coinbase', 'preferred', datetime('now')),
('ucp_23', 'default_profile', 'ServiceNow', 'preferred', datetime('now')),
('ucp_24', 'default_profile', 'Walmart Global Tech', 'preferred', datetime('now')),
('ucp_25', 'default_profile', 'Intel', 'preferred', datetime('now')),
('ucp_26', 'default_profile', 'Arm', 'preferred', datetime('now')),
('ucp_27', 'default_profile', 'Bloomberg', 'preferred', datetime('now')),
('ucp_28', 'default_profile', 'Palantir', 'preferred', datetime('now')),
('ucp_29', 'default_profile', 'Snowflake', 'preferred', datetime('now')),
('ucp_30', 'default_profile', 'Jane Street', 'preferred', datetime('now'));
