// Cloudflare D1 Typed Database Repository with Rich Job Model and Application Tracker

import {
  JobSearchProfile,
  NormalizedJob,
  MatchResult,
  JobStatus,
  FilterState,
  SearchRunResult,
  Seniority,
  RemotePreference,
  EmploymentType,
  ApplicationStatusHistory,
  BackendSearchConfig,
  BackendMatchingConfig,
  BackendNotificationConfig,
  Company,
  ExperienceCompatibility,
} from '../types';
import { APP_CONFIG } from '../config';

export class JobRadarRepository {
  constructor(private db: D1Database) {}

  // --- 0. Atomic Human-Readable Job ID Generation (JR-YYYY-NNNNNN) ---
  public async generateNextJobId(year: number = new Date().getFullYear()): Promise<string> {
    try {
      // Ensure row exists for year
      await this.db
        .prepare('INSERT OR IGNORE INTO job_id_sequence (year, current_value) VALUES (?, 0)')
        .bind(year)
        .run();

      // Increment atomically
      await this.db
        .prepare('UPDATE job_id_sequence SET current_value = current_value + 1 WHERE year = ?')
        .bind(year)
        .run();

      const row = await this.db
        .prepare('SELECT current_value FROM job_id_sequence WHERE year = ?')
        .bind(year)
        .first<{ current_value: number }>();

      const seq = row?.current_value || 1;
      const padded = String(seq).padStart(6, '0');
      return `JR-${year}-${padded}`;
    } catch {
      // Fallback pseudo-random sequential if table is in migration transition
      const rnd = Math.floor(100000 + Math.random() * 900000);
      return `JR-${year}-${rnd}`;
    }
  }

  // --- 1. User Profile & Backend Source of Truth ---
  public async getProfile(profileId: string = 'default_profile'): Promise<JobSearchProfile | null> {
    const row = await this.db
      .prepare('SELECT * FROM user_profile WHERE id = ?')
      .bind(profileId)
      .first<{
        id: string;
        full_name: string;
        email: string;
        title: string;
        years_of_experience: number;
        current_role: string | null;
        current_company: string | null;
        education?: string | null;
        current_comp_base?: number | null;
        current_comp_bonus?: number | null;
        target_base?: number | null;
        target_tc?: number | null;
        remote_priority?: string | null;
        remote_preference: string;
        employment_type: string;
        min_salary: number | null;
        salary_currency: string | null;
      }>();

    if (!row) return null;

    const skillsRes = await this.db
      .prepare('SELECT skill_name FROM user_skills WHERE profile_id = ?')
      .bind(profileId)
      .all<{ skill_name: string }>();

    const titlesRes = await this.db
      .prepare('SELECT title FROM user_target_titles WHERE profile_id = ?')
      .bind(profileId)
      .all<{ title: string }>();

    const senRes = await this.db
      .prepare('SELECT seniority FROM user_seniority_preferences WHERE profile_id = ?')
      .bind(profileId)
      .all<{ seniority: string }>();

    const locRes = await this.db
      .prepare('SELECT location FROM user_location_preferences WHERE profile_id = ?')
      .bind(profileId)
      .all<{ location: string }>();

    const compRes = await this.db
      .prepare('SELECT company_name, preference_type FROM user_company_preferences WHERE profile_id = ?')
      .bind(profileId)
      .all<{ company_name: string; preference_type: string }>();

    const excRes = await this.db
      .prepare('SELECT keyword FROM user_keyword_exclusions WHERE profile_id = ?')
      .bind(profileId)
      .all<{ keyword: string }>();

    return {
      id: row.id,
      fullName: row.full_name,
      email: row.email,
      title: row.title,
      yearsOfExperience: row.years_of_experience,
      currentRole: row.current_role || undefined,
      currentCompany: row.current_company || undefined,
      education: row.education || undefined,
      currentCompensationBase: row.current_comp_base ?? undefined,
      currentCompensationBonus: row.current_comp_bonus ?? undefined,
      targetBase: row.target_base ?? undefined,
      targetTc: row.target_tc ?? undefined,
      remotePriority: (row.remote_priority as any) || 'highest',
      skills: (skillsRes.results || []).map(r => r.skill_name),
      jobTitles: (titlesRes.results || []).map(r => r.title),
      seniorityLevels: (senRes.results || []).map(r => r.seniority as Seniority),
      locations: (locRes.results || []).map(r => r.location),
      remotePreference: (row.remote_preference as RemotePreference) || 'remote_preferred',
      employmentTypes: [row.employment_type as EmploymentType || 'full_time'],
      minimumSalary: row.min_salary || undefined,
      salaryCurrency: row.salary_currency || 'INR',
      preferredCompanies: (compRes.results || [])
        .filter(r => r.preference_type === 'preferred')
        .map(r => r.company_name),
      excludedCompanies: (compRes.results || [])
        .filter(r => r.preference_type === 'excluded')
        .map(r => r.company_name),
      keywords: [],
      excludedKeywords: (excRes.results || []).map(r => r.keyword),
      enabledSources: ['mock', 'greenhouse', 'lever', 'remotive'],
    };
  }

  public async saveProfile(profile: JobSearchProfile): Promise<void> {
    const nowIso = new Date().toISOString();

    await this.db
      .prepare(
        `INSERT INTO user_profile (
          id, full_name, email, title, years_of_experience, current_role, current_company,
          education, current_comp_base, current_comp_bonus, target_base, target_tc, remote_priority,
          remote_preference, employment_type, min_salary, salary_currency, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          full_name = excluded.full_name,
          email = excluded.email,
          title = excluded.title,
          years_of_experience = excluded.years_of_experience,
          current_role = excluded.current_role,
          current_company = excluded.current_company,
          education = excluded.education,
          current_comp_base = excluded.current_comp_base,
          current_comp_bonus = excluded.current_comp_bonus,
          target_base = excluded.target_base,
          target_tc = excluded.target_tc,
          remote_priority = excluded.remote_priority,
          remote_preference = excluded.remote_preference,
          employment_type = excluded.employment_type,
          min_salary = excluded.min_salary,
          salary_currency = excluded.salary_currency,
          updated_at = excluded.updated_at`
      )
      .bind(
        profile.id,
        profile.fullName,
        profile.email,
        profile.title,
        profile.yearsOfExperience,
        profile.currentRole || null,
        profile.currentCompany || null,
        profile.education || null,
        profile.currentCompensationBase || null,
        profile.currentCompensationBonus || null,
        profile.targetBase || null,
        profile.targetTc || null,
        profile.remotePriority || 'highest',
        profile.remotePreference,
        profile.employmentTypes[0] || 'full_time',
        profile.minimumSalary || null,
        profile.salaryCurrency || 'INR',
        nowIso,
        nowIso
      )
      .run();

    // Replace skills
    await this.db.prepare('DELETE FROM user_skills WHERE profile_id = ?').bind(profile.id).run();
    for (const skill of profile.skills) {
      await this.db
        .prepare('INSERT OR IGNORE INTO user_skills (id, profile_id, skill_name, created_at) VALUES (?, ?, ?, ?)')
        .bind(`sk_${Math.random().toString(36).slice(2, 9)}`, profile.id, skill, nowIso)
        .run();
    }

    // Replace target titles
    await this.db.prepare('DELETE FROM user_target_titles WHERE profile_id = ?').bind(profile.id).run();
    for (const title of profile.jobTitles) {
      await this.db
        .prepare('INSERT OR IGNORE INTO user_target_titles (id, profile_id, title, created_at) VALUES (?, ?, ?, ?)')
        .bind(`tt_${Math.random().toString(36).slice(2, 9)}`, profile.id, title, nowIso)
        .run();
    }

    // Replace seniority
    await this.db.prepare('DELETE FROM user_seniority_preferences WHERE profile_id = ?').bind(profile.id).run();
    for (const sen of profile.seniorityLevels) {
      await this.db
        .prepare('INSERT OR IGNORE INTO user_seniority_preferences (id, profile_id, seniority, created_at) VALUES (?, ?, ?, ?)')
        .bind(`sn_${Math.random().toString(36).slice(2, 9)}`, profile.id, sen, nowIso)
        .run();
    }

    // Replace locations
    await this.db.prepare('DELETE FROM user_location_preferences WHERE profile_id = ?').bind(profile.id).run();
    for (const loc of profile.locations) {
      await this.db
        .prepare('INSERT OR IGNORE INTO user_location_preferences (id, profile_id, location, created_at) VALUES (?, ?, ?, ?)')
        .bind(`loc_${Math.random().toString(36).slice(2, 9)}`, profile.id, loc, nowIso)
        .run();
    }

    // Replace preferred companies
    await this.db.prepare('DELETE FROM user_company_preferences WHERE profile_id = ?').bind(profile.id).run();
    for (const comp of profile.preferredCompanies) {
      await this.db
        .prepare('INSERT OR IGNORE INTO user_company_preferences (id, profile_id, company_name, preference_type, created_at) VALUES (?, ?, ?, ?, ?)')
        .bind(`ucp_${Math.random().toString(36).slice(2, 9)}`, profile.id, comp, 'preferred', nowIso)
        .run();
    }
    for (const comp of profile.excludedCompanies) {
      await this.db
        .prepare('INSERT OR IGNORE INTO user_company_preferences (id, profile_id, company_name, preference_type, created_at) VALUES (?, ?, ?, ?, ?)')
        .bind(`ucp_${Math.random().toString(36).slice(2, 9)}`, profile.id, comp, 'excluded', nowIso)
        .run();
    }

    // Replace exclusions
    await this.db.prepare('DELETE FROM user_keyword_exclusions WHERE profile_id = ?').bind(profile.id).run();
    for (const kw of profile.excludedKeywords) {
      await this.db
        .prepare('INSERT OR IGNORE INTO user_keyword_exclusions (id, profile_id, keyword, type, created_at) VALUES (?, ?, ?, ?, ?)')
        .bind(`ex_${Math.random().toString(36).slice(2, 9)}`, profile.id, kw, 'any', nowIso)
        .run();
    }
  }

  // --- 2. Dynamic Backend Configuration Management in D1 ---
  public async getSearchConfig(): Promise<BackendSearchConfig> {
    const row = await this.db.prepare('SELECT value_json FROM user_settings WHERE key = ?').bind('search_config').first<{ value_json: string }>();
    if (row?.value_json) {
      return JSON.parse(row.value_json);
    }
    return {
      maxRuntimeMs: APP_CONFIG.search.maxRuntimeMs,
      maxExternalRequestsPerRun: APP_CONFIG.search.maxExternalRequestsPerRun,
      maxPagesPerSource: APP_CONFIG.search.maxPagesPerSource,
      freshnessHorizon: '7d',
      staggerDelayMs: APP_CONFIG.search.staggerDelayMs,
      cooldownMs: APP_CONFIG.search.cooldownMs,
    };
  }

  public async saveSearchConfig(config: BackendSearchConfig): Promise<void> {
    const nowIso = new Date().toISOString();
    await this.db
      .prepare('INSERT INTO user_settings (key, value_json, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at')
      .bind('search_config', JSON.stringify(config), nowIso)
      .run();
  }

  public async getMatchingConfig(): Promise<BackendMatchingConfig> {
    const row = await this.db.prepare('SELECT value_json FROM user_settings WHERE key = ?').bind('matching_weights').first<{ value_json: string }>();
    if (row?.value_json) {
      return JSON.parse(row.value_json);
    }
    return {
      weights: APP_CONFIG.matching.weights,
      preferredCompanyBonus: APP_CONFIG.matching.preferredCompanyBonus,
      minScoreThreshold: 50,
    };
  }

  public async saveMatchingConfig(config: BackendMatchingConfig): Promise<void> {
    const nowIso = new Date().toISOString();
    await this.db
      .prepare('INSERT INTO user_settings (key, value_json, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at')
      .bind('matching_weights', JSON.stringify(config), nowIso)
      .run();
  }

  public async getNotificationConfig(): Promise<BackendNotificationConfig> {
    const row = await this.db.prepare('SELECT value_json FROM user_settings WHERE key = ?').bind('email_notifications').first<{ value_json: string }>();
    if (row?.value_json) {
      return JSON.parse(row.value_json);
    }
    return {
      emailEnabled: true,
      emailRecipient: 'user@example.com',
      minScoreForNotification: 80,
      maxJobsPerEmail: 15,
      notifyOnZeroJobs: false,
    };
  }

  public async saveNotificationConfig(config: BackendNotificationConfig): Promise<void> {
    const nowIso = new Date().toISOString();
    await this.db
      .prepare('INSERT INTO user_settings (key, value_json, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at')
      .bind('email_notifications', JSON.stringify(config), nowIso)
      .run();
  }

  // --- 3. Jobs Querying (with Human-Readable Job ID & Rich Fields) ---
  public async getJobs(filter: FilterState): Promise<{ jobs: NormalizedJob[]; total: number; page: number; pageSize: number }> {
    const page = filter.page && filter.page > 0 ? filter.page : 1;
    const pageSize = Math.min(filter.pageSize || APP_CONFIG.ui.defaultPageSize, APP_CONFIG.ui.maxPageSize);
    const offset = (page - 1) * pageSize;

    const whereClauses: string[] = [];
    const bindings: (string | number)[] = [];

    if (filter.status && filter.status !== 'ALL') {
      whereClauses.push('j.status = ?');
      bindings.push(filter.status);
    }

    if (filter.remote && filter.remote !== 'ALL') {
      whereClauses.push('j.remote_type = ?');
      bindings.push(filter.remote);
    }

    if (filter.seniority && filter.seniority !== 'ALL') {
      whereClauses.push('j.seniority = ?');
      bindings.push(filter.seniority);
    }

    if (filter.company) {
      whereClauses.push('LOWER(j.company) LIKE ?');
      bindings.push(`%${filter.company.toLowerCase()}%`);
    }

    if (filter.location && filter.location !== 'ALL') {
      const loc = filter.location.toLowerCase();
      if (loc.includes('remote')) {
        whereClauses.push('j.remote_type = "remote"');
      } else {
        whereClauses.push('(LOWER(j.location_json) LIKE ? OR LOWER(j.title) LIKE ?)');
        bindings.push(`%${loc}%`, `%${loc}%`);
      }
    }

    if (filter.minBaseSalary !== undefined && filter.minBaseSalary > 0) {
      if (filter.includeUndisclosedSalary !== false) {
        // High-Compensation Opportunity Protection: Keep undisclosed jobs
        whereClauses.push('((j.salary_min >= ? OR j.salary_max >= ?) OR (j.salary_min IS NULL AND j.salary_max IS NULL))');
        bindings.push(filter.minBaseSalary, filter.minBaseSalary);
      } else {
        whereClauses.push('(j.salary_min >= ? OR j.salary_max >= ?)');
        bindings.push(filter.minBaseSalary, filter.minBaseSalary);
      }
    }

    if (filter.experienceRange && filter.experienceRange !== 'all') {
      switch (filter.experienceRange) {
        case '1-3':
          whereClauses.push('(j.min_experience_years IS NULL OR j.min_experience_years <= 3)');
          break;
        case '3-6':
          whereClauses.push('(j.min_experience_years IS NULL OR (j.min_experience_years <= 6 AND (j.max_experience_years >= 3 OR j.max_experience_years IS NULL)))');
          break;
        case '5-8':
          whereClauses.push('(j.min_experience_years IS NULL OR (j.min_experience_years <= 8 AND (j.max_experience_years >= 5 OR j.max_experience_years IS NULL)))');
          break;
        case '8+':
          whereClauses.push('(j.min_experience_years >= 8 OR j.max_experience_years >= 8)');
          break;
      }
    }

    if (filter.source) {
      whereClauses.push('j.source = ?');
      bindings.push(filter.source);
    }

    if (filter.minScore !== undefined && filter.minScore > 0) {
      whereClauses.push('m.overall_score >= ?');
      bindings.push(filter.minScore);
    }

    if (filter.ageHorizon && filter.ageHorizon !== 'all') {
      const now = Date.now();
      let diffMs = 0;
      switch (filter.ageHorizon) {
        case '6h': diffMs = 6 * 3600 * 1000; break;
        case '12h': diffMs = 12 * 3600 * 1000; break;
        case '24h': diffMs = 24 * 3600 * 1000; break;
        case '2d': diffMs = 48 * 3600 * 1000; break;
        case '3d': diffMs = 72 * 3600 * 1000; break;
        case '7d': diffMs = 7 * 24 * 3600 * 1000; break;
        case '14d': diffMs = 14 * 24 * 3600 * 1000; break;
        case '30d': diffMs = 30 * 24 * 3600 * 1000; break;
      }
      if (diffMs > 0) {
        const threshold = new Date(now - diffMs).toISOString();
        whereClauses.push('(j.date_posted >= ? OR j.discovered_at >= ?)');
        bindings.push(threshold, threshold);
      }
    }

    // Universal Global Search (Supports Job ID "JR-...", Source ID, Company, Title, Description)
    if (filter.searchQuery && filter.searchQuery.trim().length > 0) {
      const term = `%${filter.searchQuery.trim().toLowerCase()}%`;
      const exact = filter.searchQuery.trim().toUpperCase();
      whereClauses.push('(UPPER(j.job_id) LIKE ? OR LOWER(j.source_job_id) LIKE ? OR LOWER(j.title) LIKE ? OR LOWER(j.company) LIKE ? OR LOWER(j.description) LIKE ?)');
      bindings.push(`%${exact}%`, term, term, term, term);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    let orderBySql = 'ORDER BY m.overall_score DESC, j.discovered_at DESC';
    switch (filter.sort) {
      case 'newest':
        orderBySql = 'ORDER BY j.date_posted DESC, j.discovered_at DESC';
        break;
      case 'oldest':
        orderBySql = 'ORDER BY j.date_posted ASC, j.discovered_at ASC';
        break;
      case 'match_desc':
        orderBySql = 'ORDER BY m.overall_score DESC, j.discovered_at DESC';
        break;
      case 'salary_desc':
        orderBySql = 'ORDER BY j.salary_min DESC NULLS LAST';
        break;
      case 'salary_asc':
        orderBySql = 'ORDER BY j.salary_min ASC NULLS LAST';
        break;
      case 'company':
        orderBySql = 'ORDER BY j.company ASC';
        break;
      case 'fresh_match':
      default:
        orderBySql = 'ORDER BY m.overall_score DESC, j.discovered_at DESC';
        break;
    }

    const countSql = `
      SELECT COUNT(*) as total
      FROM jobs j
      LEFT JOIN job_matches m ON j.id = m.job_id
      ${whereSql}
    `;
    const countRow = await this.db.prepare(countSql).bind(...bindings).first<{ total: number }>();
    const total = countRow?.total || 0;

    const selectSql = `
      SELECT
        j.*,
        m.overall_score,
        m.title_score,
        m.skill_score,
        m.seniority_score,
        m.experience_score,
        m.location_score,
        m.matching_skills_json,
        m.missing_skills_json,
        m.explanation_json,
        m.calculated_at
      FROM jobs j
      LEFT JOIN job_matches m ON j.id = m.job_id
      ${whereSql}
      ${orderBySql}
      LIMIT ? OFFSET ?
    `;

    const jobRows = await this.db.prepare(selectSql).bind(...bindings, pageSize, offset).all<any>();

    const jobs: NormalizedJob[] = (jobRows.results || []).map(r => this.mapRowToJob(r));

    return { jobs, total, page, pageSize };
  }

  public async getJobById(identifier: string): Promise<NormalizedJob | null> {
    // Supports querying by primary ID or human-readable job_id (e.g. JR-2026-000184)
    const query = `
      SELECT
        j.*,
        m.overall_score,
        m.title_score,
        m.skill_score,
        m.seniority_score,
        m.experience_score,
        m.location_score,
        m.matching_skills_json,
        m.missing_skills_json,
        m.explanation_json,
        m.calculated_at
      FROM jobs j
      LEFT JOIN job_matches m ON j.id = m.job_id
      WHERE j.id = ? OR j.job_id = ?
    `;

    const r = await this.db.prepare(query).bind(identifier, identifier).first<any>();
    if (!r) return null;
    return this.mapRowToJob(r);
  }

  // --- 4. Application Tracking & Status History Timeline ---
  public async updateJobStatus(jobIdOrHumanId: string, newStatus: JobStatus, notes?: string): Promise<boolean> {
    const existing = await this.db
      .prepare('SELECT id, job_id, status, application_url FROM jobs WHERE id = ? OR job_id = ?')
      .bind(jobIdOrHumanId, jobIdOrHumanId)
      .first<{ id: string; job_id: string; status: string; application_url: string }>();

    if (!existing) return false;

    const actualId = existing.id;
    const humanId = existing.job_id;
    const oldStatus = existing.status;
    const nowIso = new Date().toISOString();

    const appliedAtVal = newStatus === 'APPLIED' ? nowIso : null;
    const rejectedAtVal = newStatus === 'REJECTED' ? nowIso : null;

    // Update job record
    await this.db
      .prepare(
        `UPDATE jobs
         SET status = ?,
             applied_at = COALESCE(applied_at, ?),
             rejected_at = COALESCE(rejected_at, ?),
             notes = COALESCE(?, notes),
             updated_at = ?
         WHERE id = ?`
      )
      .bind(newStatus, appliedAtVal, rejectedAtVal, notes || null, nowIso, actualId)
      .run();

    // Create or update record in job_applications table
    const appId = `app_${actualId}`;
    await this.db
      .prepare(
        `INSERT INTO job_applications (
          application_id, job_id, human_job_id, status, applied_at, application_url, notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(application_id) DO UPDATE SET
          status = excluded.status,
          applied_at = COALESCE(job_applications.applied_at, excluded.applied_at),
          notes = COALESCE(excluded.notes, job_applications.notes),
          updated_at = excluded.updated_at`
      )
      .bind(
        appId,
        actualId,
        humanId,
        newStatus.toLowerCase(),
        appliedAtVal,
        existing.application_url,
        notes || null,
        nowIso,
        nowIso
      )
      .run();

    // Record chronological entry in application_status_history
    const historyId = `ash_${Math.random().toString(36).slice(2, 9)}`;
    await this.db
      .prepare(
        `INSERT INTO application_status_history (
          id, application_id, job_id, human_job_id, old_status, new_status, notes, changed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(historyId, appId, actualId, humanId, oldStatus, newStatus, notes || null, nowIso)
      .run();

    return true;
  }

  public async getApplicationTimeline(jobId: string): Promise<ApplicationStatusHistory[]> {
    const res = await this.db
      .prepare(
        `SELECT * FROM application_status_history
         WHERE job_id = ? OR human_job_id = ?
         ORDER BY changed_at ASC`
      )
      .bind(jobId, jobId)
      .all<any>();

    return (res.results || []).map(r => ({
      id: r.id,
      applicationId: r.application_id,
      jobId: r.job_id,
      humanJobId: r.human_job_id,
      oldStatus: r.old_status,
      newStatus: r.new_status,
      changedAt: r.changed_at,
      notes: r.notes || undefined,
    }));
  }

  public async updateJobNotes(jobId: string, notes: string): Promise<boolean> {
    const nowIso = new Date().toISOString();
    const res = await this.db
      .prepare('UPDATE jobs SET notes = ?, updated_at = ? WHERE id = ? OR job_id = ?')
      .bind(notes, nowIso, jobId, jobId)
      .run();
    return res.success;
  }

  public async updateJobInterview(jobId: string, interviewDate: string, round?: string): Promise<boolean> {
    const nowIso = new Date().toISOString();
    await this.db
      .prepare('UPDATE jobs SET interview_date = ?, interview_round = ?, status = ?, updated_at = ? WHERE id = ? OR job_id = ?')
      .bind(interviewDate, round || null, 'INTERVIEW', nowIso, jobId, jobId)
      .run();

    await this.updateJobStatus(jobId, 'INTERVIEW', round ? `Interview scheduled: ${round}` : undefined);
    return true;
  }

  public async updateJobOffer(jobId: string, offerSalary: number, currency: string = 'INR'): Promise<boolean> {
    const nowIso = new Date().toISOString();
    await this.db
      .prepare('UPDATE jobs SET offer_salary = ?, offer_currency = ?, status = ?, updated_at = ? WHERE id = ? OR job_id = ?')
      .bind(offerSalary, currency, 'OFFER', nowIso, jobId, jobId)
      .run();

    await this.updateJobStatus(jobId, 'OFFER', `Offer received: ${currency} ${offerSalary}`);
    return true;
  }

  public async markJobViewed(jobId: string): Promise<void> {
    const nowIso = new Date().toISOString();
    await this.db.prepare('UPDATE jobs SET viewed_at = ? WHERE (id = ? OR job_id = ?) AND viewed_at IS NULL').bind(nowIso, jobId, jobId).run();
  }

  // --- 5. Batched Job Upsert with Stable Human Job ID Generation ---
  public async upsertJobs(jobsWithMatch: Array<{ job: NormalizedJob; match: MatchResult }>): Promise<{ newCount: number; duplicateCount: number }> {
    let newCount = 0;
    let duplicateCount = 0;
    const nowIso = new Date().toISOString();
    const currentYear = new Date().getFullYear();

    for (const { job, match } of jobsWithMatch) {
      const existing = await this.db
        .prepare('SELECT id, job_id, status FROM jobs WHERE fingerprint = ?')
        .bind(job.fingerprint)
        .first<{ id: string; job_id: string; status: string }>();

      if (existing) {
        duplicateCount++;
        await this.db
          .prepare('UPDATE jobs SET last_seen_at = ?, updated_at = ? WHERE id = ?')
          .bind(nowIso, nowIso, existing.id)
          .run();
      } else {
        newCount++;
        // Generate atomic sequential human-readable Job ID: JR-2026-000184
        const humanJobId = await this.generateNextJobId(currentYear);

        await this.db
          .prepare(
            `INSERT INTO jobs (
              id, job_id, source, source_job_id, company, company_domain, title, description,
              location_json, remote_type, employment_type, seniority,
              min_experience_years, max_experience_years, experience_text, salary_period,
              date_posted, date_updated, salary_min, salary_max, salary_currency,
              application_url, canonical_url, source_url, discovered_at, first_seen_at,
              last_seen_at, fingerprint, status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .bind(
            job.id,
            humanJobId,
            job.source,
            job.sourceJobId || null,
            job.company,
            job.companyDomain || null,
            job.title,
            job.description || null,
            JSON.stringify(job.location),
            job.remoteType,
            job.employmentType,
            job.seniority,
            job.minExperienceYears || null,
            job.maxExperienceYears || null,
            job.experienceText || null,
            job.salaryPeriod || 'year',
            job.datePosted || null,
            job.dateUpdated || null,
            job.salaryMin || null,
            job.salaryMax || null,
            job.salaryCurrency || null,
            job.applicationUrl,
            job.canonicalUrl || null,
            job.sourceUrl,
            job.discoveredAt,
            job.firstSeenAt,
            nowIso,
            job.fingerprint,
            job.status,
            nowIso,
            nowIso
          )
          .run();

        // Insert match score
        await this.db
          .prepare(
            `INSERT INTO job_matches (
              job_id, overall_score, title_score, skill_score, seniority_score, experience_score,
              location_score, matching_skills_json, missing_skills_json, explanation_json, calculated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .bind(
            job.id,
            match.overallScore,
            match.titleScore,
            match.skillScore,
            match.seniorityScore,
            match.experienceScore,
            match.locationScore,
            JSON.stringify(match.matchingSkills),
            JSON.stringify(match.missingSkills),
            JSON.stringify(match.explanation),
            nowIso
          )
          .run();
      }
    }

    return { newCount, duplicateCount };
  }

  // --- 6. Distributed Search Lock ---
  public async acquireLock(lockedBy: string, leaseMs: number = APP_CONFIG.search.lockTtlMs): Promise<boolean> {
    const nowIso = new Date().toISOString();
    const expiresIso = new Date(Date.now() + leaseMs).toISOString();

    const currentLock = await this.db
      .prepare('SELECT * FROM search_lock WHERE lock_id = ?')
      .bind('global_search_lock')
      .first<{ lock_id: string; locked_by: string; expires_at: string }>();

    if (currentLock) {
      if (new Date(currentLock.expires_at).getTime() > Date.now()) {
        return false;
      }
      await this.db
        .prepare('UPDATE search_lock SET locked_by = ?, acquired_at = ?, expires_at = ? WHERE lock_id = ?')
        .bind(lockedBy, nowIso, expiresIso, 'global_search_lock')
        .run();
      return true;
    }

    try {
      await this.db
        .prepare('INSERT INTO search_lock (lock_id, locked_by, acquired_at, expires_at) VALUES (?, ?, ?, ?)')
        .bind('global_search_lock', lockedBy, nowIso, expiresIso)
        .run();
      return true;
    } catch {
      return false;
    }
  }

  public async releaseLock(): Promise<void> {
    await this.db.prepare('DELETE FROM search_lock WHERE lock_id = ?').bind('global_search_lock').run();
  }

  // --- 7. Search Run Tracking ---
  public async recordSearchRun(result: SearchRunResult): Promise<void> {
    const nowIso = new Date().toISOString();
    await this.db
      .prepare(
        `INSERT INTO search_runs (
          id, trigger_type, status, started_at, finished_at, duration_ms, sources_attempted,
          sources_succeeded, sources_failed, jobs_fetched, jobs_normalized, jobs_duplicates,
          jobs_new, jobs_matching, error_summary, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        result.runId,
        result.triggerType,
        result.status,
        result.startedAt,
        result.finishedAt,
        result.durationMs,
        result.sourcesAttempted,
        result.sourcesSucceeded,
        result.sourcesFailed,
        result.jobsFetched,
        result.jobsNormalized,
        result.jobsDuplicates,
        result.jobsNew,
        result.jobsMatching,
        result.errorSummary || null,
        nowIso
      )
      .run();
  }

  public async getRecentSearchRuns(limit: number = 10): Promise<any[]> {
    const runs = await this.db
      .prepare('SELECT * FROM search_runs ORDER BY started_at DESC LIMIT ?')
      .bind(limit)
      .all<any>();
    return runs.results || [];
  }

  // --- 8. Analytics Aggregations ---
  public async getAnalytics(): Promise<any> {
    const statusCountsRes = await this.db
      .prepare('SELECT status, COUNT(*) as count FROM jobs GROUP BY status')
      .all<{ status: string; count: number }>();

    const statusCounts: Record<string, number> = {
      NEW: 0,
      SAVED: 0,
      SELECTED: 0,
      APPLIED: 0,
      REJECTED: 0,
      INTERVIEW: 0,
      OFFER: 0,
    };
    for (const r of statusCountsRes.results || []) {
      statusCounts[r.status] = r.count;
    }

    const topCompaniesRes = await this.db
      .prepare('SELECT company, COUNT(*) as count FROM jobs GROUP BY company ORDER BY count DESC LIMIT 8')
      .all<{ company: string; count: number }>();

    const topSourcesRes = await this.db
      .prepare('SELECT source, COUNT(*) as count FROM jobs GROUP BY source ORDER BY count DESC')
      .all<{ source: string; count: number }>();

    const remoteDistRes = await this.db
      .prepare('SELECT remote_type, COUNT(*) as count FROM jobs GROUP BY remote_type')
      .all<{ remote_type: string; count: number }>();

    const dailyTrendRes = await this.db
      .prepare(
        `SELECT date(discovered_at) as day, COUNT(*) as count
         FROM jobs
         WHERE discovered_at >= datetime('now', '-7 days')
         GROUP BY date(discovered_at)
         ORDER BY day ASC`
      )
      .all<{ day: string; count: number }>();

    const totalJobsRes = await this.db.prepare('SELECT COUNT(*) as total FROM jobs').first<{ total: number }>();
    const highMatchRes = await this.db
      .prepare('SELECT COUNT(*) as count FROM job_matches WHERE overall_score >= 80')
      .first<{ count: number }>();

    return {
      totalJobs: totalJobsRes?.total || 0,
      highMatchCount: highMatchRes?.count || 0,
      statusCounts,
      topCompanies: topCompaniesRes.results || [],
      topSources: topSourcesRes.results || [],
      remoteDistribution: remoteDistRes.results || [],
      dailyTrend: dailyTrendRes.results || [],
    };
  }

  // --- 9. Data Export & Reset ---
  public async deleteJob(identifier: string): Promise<boolean> {
    const job = await this.getJobById(identifier);
    if (!job) return false;

    const actualId = job.id;
    await this.db.prepare('DELETE FROM job_matches WHERE job_id = ?').bind(actualId).run();
    await this.db.prepare('DELETE FROM application_status_history WHERE job_id = ?').bind(actualId).run();
    await this.db.prepare('DELETE FROM job_applications WHERE job_id = ?').bind(actualId).run();
    const res = await this.db.prepare('DELETE FROM jobs WHERE id = ?').bind(actualId).run();
    return res.success;
  }

  public async deleteJobs(identifiers: string[]): Promise<number> {
    let count = 0;
    for (const id of identifiers) {
      const ok = await this.deleteJob(id);
      if (ok) count++;
    }
    return count;
  }

  public async resetProfile(): Promise<void> {
    await this.db.prepare('DELETE FROM user_skills').run();
    await this.db.prepare('DELETE FROM user_target_titles').run();
    await this.db.prepare('DELETE FROM user_seniority_preferences').run();
    await this.db.prepare('DELETE FROM user_location_preferences').run();
    await this.db.prepare('DELETE FROM user_company_preferences').run();
    await this.db.prepare('DELETE FROM user_keyword_exclusions').run();
    await this.db.prepare('DELETE FROM user_profile').run();
  }

  public async resetAllJobs(): Promise<void> {
    await this.db.prepare('DELETE FROM job_matches').run();
    await this.db.prepare('DELETE FROM application_status_history').run();
    await this.db.prepare('DELETE FROM job_applications').run();
    await this.db.prepare('DELETE FROM search_run_sources').run();
    await this.db.prepare('DELETE FROM search_runs').run();
    await this.db.prepare('DELETE FROM jobs').run();
  }

  public async resetAllData(): Promise<void> {
    await this.resetAllJobs();
    await this.resetProfile();
  }

  public async exportAllData(): Promise<any> {
    const jobs = await this.db.prepare('SELECT * FROM jobs ORDER BY discovered_at DESC').all<any>();
    const profile = await this.getProfile();
    const appHistory = await this.db.prepare('SELECT * FROM application_status_history ORDER BY changed_at DESC').all<any>();
    return {
      exportDate: new Date().toISOString(),
      profile,
      jobs: jobs.results || [],
      applicationHistory: appHistory.results || [],
    };
  }

  public async getTargetCompanies(tier?: string): Promise<Company[]> {
    let query = 'SELECT * FROM companies';
    const bindings: string[] = [];
    if (tier) {
      query += ' WHERE tier = ?';
      bindings.push(tier);
    }
    query += ' ORDER BY CASE tier WHEN "tier_1" THEN 1 WHEN "tier_2" THEN 2 ELSE 3 END, name ASC';

    const res = await this.db.prepare(query).bind(...bindings).all<any>();
    return (res.results || []).map(r => ({
      id: r.id,
      name: r.name,
      domain: r.domain || undefined,
      careerUrl: r.career_url || undefined,
      atsType: r.ats_type || undefined,
      atsIdentifier: r.ats_identifier || undefined,
      priority: r.priority || 'preferred',
      tier: (r.tier as any) || 'tier_1',
      targetRoles: r.target_roles || undefined,
      remoteEligible: Boolean(r.remote_eligible ?? 1),
      enabled: Boolean(r.enabled ?? 1),
    }));
  }

  private mapRowToJob(r: any): NormalizedJob {
    let matchScore: MatchResult | undefined;
    if (r.overall_score !== null && r.overall_score !== undefined) {
      matchScore = {
        overallScore: r.overall_score,
        titleScore: r.title_score,
        skillScore: r.skill_score,
        seniorityScore: r.seniority_score,
        experienceScore: r.experience_score,
        locationScore: r.location_score,
        matchingSkills: JSON.parse(r.matching_skills_json || '[]'),
        missingSkills: JSON.parse(r.missing_skills_json || '[]'),
        explanation: JSON.parse(r.explanation_json || '{}'),
        calculatedAt: r.calculated_at,
      };
    }

    // Determine experience compatibility badge
    let expCompatibility: ExperienceCompatibility | undefined = matchScore?.experienceCompatibility;
    if (!expCompatibility) {
      const minYears = r.min_experience_years || undefined;
      const maxYears = r.max_experience_years || undefined;
      const text = r.experience_text || (minYears !== undefined ? (maxYears ? `${minYears}–${maxYears} yrs` : `${minYears}+ yrs`) : undefined);
      if (minYears !== undefined) {
        if (minYears <= 5) {
          expCompatibility = {
            status: 'compatible',
            label: `✓ Compatible (${text})`,
            requiredText: text || 'Compatible',
            minYears,
            maxYears,
          };
        } else {
          expCompatibility = {
            status: 'reach',
            label: `⚠ Reach (${text})`,
            requiredText: text || 'Reach',
            minYears,
            maxYears,
          };
        }
      } else {
        expCompatibility = {
          status: 'unspecified',
          label: 'ℹ Exp: Not specified',
          requiredText: 'Not specified',
        };
      }
    }

    const hasSalary = Boolean(r.salary_min || r.salary_max);

    return {
      id: r.id,
      jobId: r.job_id || `JR-2026-${r.id.slice(-6).toUpperCase()}`,
      source: r.source,
      sourceJobId: r.source_job_id || undefined,
      company: r.company,
      companyDomain: r.company_domain || undefined,
      title: r.title,
      description: r.description || undefined,
      location: JSON.parse(r.location_json || '[]'),
      remoteType: r.remote_type,
      employmentType: r.employment_type,
      seniority: r.seniority,
      minExperienceYears: r.min_experience_years || undefined,
      maxExperienceYears: r.max_experience_years || undefined,
      experienceText: r.experience_text || undefined,
      salaryPeriod: r.salary_period || 'year',
      compensationStatus: hasSalary ? 'disclosed_base' : 'undisclosed',
      datePosted: r.date_posted || undefined,
      dateUpdated: r.date_updated || undefined,
      salaryMin: r.salary_min || undefined,
      salaryMax: r.salary_max || undefined,
      salaryCurrency: r.salary_currency || undefined,
      applicationUrl: r.application_url,
      canonicalUrl: r.canonical_url || undefined,
      sourceUrl: r.source_url,
      discoveredAt: r.discovered_at,
      firstSeenAt: r.first_seen_at,
      lastSeenAt: r.last_seen_at,
      fingerprint: r.fingerprint,
      status: r.status as JobStatus,
      appliedAt: r.applied_at || undefined,
      rejectedAt: r.rejected_at || undefined,
      notes: r.notes || undefined,
      interviewDate: r.interview_date || undefined,
      interviewRound: r.interview_round || undefined,
      offerSalary: r.offer_salary || undefined,
      offerCurrency: r.offer_currency || undefined,
      viewedAt: r.viewed_at || undefined,
      matchScore,
      experienceCompatibility: expCompatibility,
    };
  }
}
