// Cloudflare D1 Typed Database Repository

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
} from '../types';
import { APP_CONFIG } from '../config';

export class JobRadarRepository {
  constructor(private db: D1Database) {}

  // 1. User Profile
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
        remote_preference: string;
        employment_type: string;
        min_salary: number | null;
        salary_currency: string | null;
      }>();

    if (!row) return null;

    // Load skills
    const skillsRes = await this.db
      .prepare('SELECT skill_name FROM user_skills WHERE profile_id = ?')
      .bind(profileId)
      .all<{ skill_name: string }>();

    // Load target titles
    const titlesRes = await this.db
      .prepare('SELECT title FROM user_target_titles WHERE profile_id = ?')
      .bind(profileId)
      .all<{ title: string }>();

    // Load seniorities
    const senRes = await this.db
      .prepare('SELECT seniority FROM user_seniority_preferences WHERE profile_id = ?')
      .bind(profileId)
      .all<{ seniority: string }>();

    // Load locations
    const locRes = await this.db
      .prepare('SELECT location FROM user_location_preferences WHERE profile_id = ?')
      .bind(profileId)
      .all<{ location: string }>();

    // Load company preferences
    const compRes = await this.db
      .prepare('SELECT company_name, preference_type FROM user_company_preferences WHERE profile_id = ?')
      .bind(profileId)
      .all<{ company_name: string; preference_type: string }>();

    // Load keyword exclusions
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
          remote_preference, employment_type, min_salary, salary_currency, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          full_name = excluded.full_name,
          email = excluded.email,
          title = excluded.title,
          years_of_experience = excluded.years_of_experience,
          current_role = excluded.current_role,
          current_company = excluded.current_company,
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

  // 2. Jobs Querying with Filtering, Sorting, Pagination
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

    if (filter.searchQuery && filter.searchQuery.trim().length > 0) {
      const term = `%${filter.searchQuery.trim().toLowerCase()}%`;
      whereClauses.push('(LOWER(j.title) LIKE ? OR LOWER(j.company) LIKE ? OR LOWER(j.description) LIKE ?)');
      bindings.push(term, term, term);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Sorting
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

    // Count total query
    const countSql = `
      SELECT COUNT(*) as total
      FROM jobs j
      LEFT JOIN job_matches m ON j.id = m.job_id
      ${whereSql}
    `;
    const countRow = await this.db.prepare(countSql).bind(...bindings).first<{ total: number }>();
    const total = countRow?.total || 0;

    // Fetch jobs page
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

    const jobs: NormalizedJob[] = (jobRows.results || []).map(r => {
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

      return {
        id: r.id,
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
        notes: r.notes || undefined,
        interviewDate: r.interview_date || undefined,
        interviewRound: r.interview_round || undefined,
        offerSalary: r.offer_salary || undefined,
        offerCurrency: r.offer_currency || undefined,
        viewedAt: r.viewed_at || undefined,
        matchScore,
      };
    });

    return { jobs, total, page, pageSize };
  }

  public async getJobById(jobId: string): Promise<NormalizedJob | null> {
    const filter: FilterState = { page: 1, pageSize: 1 };
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
      WHERE j.id = ?
    `;

    const r = await this.db.prepare(query).bind(jobId).first<any>();
    if (!r) return null;

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

    return {
      id: r.id,
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
      notes: r.notes || undefined,
      interviewDate: r.interview_date || undefined,
      interviewRound: r.interview_round || undefined,
      offerSalary: r.offer_salary || undefined,
      offerCurrency: r.offer_currency || undefined,
      viewedAt: r.viewed_at || undefined,
      matchScore,
    };
  }

  public async updateJobStatus(jobId: string, newStatus: JobStatus, notes?: string): Promise<boolean> {
    const existing = await this.db.prepare('SELECT status FROM jobs WHERE id = ?').bind(jobId).first<{ status: string }>();
    if (!existing) return false;

    const oldStatus = existing.status;
    const nowIso = new Date().toISOString();

    await this.db
      .prepare('UPDATE jobs SET status = ?, updated_at = ? WHERE id = ?')
      .bind(newStatus, nowIso, jobId)
      .run();

    // Record history
    await this.db
      .prepare(
        'INSERT INTO job_status_history (id, job_id, old_status, new_status, notes, changed_at) VALUES (?, ?, ?, ?, ?, ?)'
      )
      .bind(`hist_${Math.random().toString(36).slice(2, 9)}`, jobId, oldStatus, newStatus, notes || null, nowIso)
      .run();

    return true;
  }

  public async updateJobNotes(jobId: string, notes: string): Promise<boolean> {
    const nowIso = new Date().toISOString();
    const res = await this.db
      .prepare('UPDATE jobs SET notes = ?, updated_at = ? WHERE id = ?')
      .bind(notes, nowIso, jobId)
      .run();
    return res.success;
  }

  public async updateJobInterview(jobId: string, interviewDate: string, round?: string): Promise<boolean> {
    const nowIso = new Date().toISOString();
    const res = await this.db
      .prepare('UPDATE jobs SET interview_date = ?, interview_round = ?, status = ?, updated_at = ? WHERE id = ?')
      .bind(interviewDate, round || null, 'INTERVIEW', nowIso, jobId)
      .run();
    return res.success;
  }

  public async updateJobOffer(jobId: string, offerSalary: number, currency: string = 'INR'): Promise<boolean> {
    const nowIso = new Date().toISOString();
    const res = await this.db
      .prepare('UPDATE jobs SET offer_salary = ?, offer_currency = ?, status = ?, updated_at = ? WHERE id = ?')
      .bind(offerSalary, currency, 'OFFER', nowIso, jobId)
      .run();
    return res.success;
  }

  public async markJobViewed(jobId: string): Promise<void> {
    const nowIso = new Date().toISOString();
    await this.db.prepare('UPDATE jobs SET viewed_at = ? WHERE id = ? AND viewed_at IS NULL').bind(nowIso, jobId).run();
  }

  // 3. Batched Job Upsert
  public async upsertJobs(jobsWithMatch: Array<{ job: NormalizedJob; match: MatchResult }>): Promise<{ newCount: number; duplicateCount: number }> {
    let newCount = 0;
    let duplicateCount = 0;
    const nowIso = new Date().toISOString();

    for (const { job, match } of jobsWithMatch) {
      const existing = await this.db
        .prepare('SELECT id, status, first_seen_at FROM jobs WHERE fingerprint = ?')
        .bind(job.fingerprint)
        .first<{ id: string; status: string; first_seen_at: string }>();

      if (existing) {
        duplicateCount++;
        // Update last_seen_at
        await this.db
          .prepare('UPDATE jobs SET last_seen_at = ?, updated_at = ? WHERE id = ?')
          .bind(nowIso, nowIso, existing.id)
          .run();
      } else {
        newCount++;
        // Insert new job
        await this.db
          .prepare(
            `INSERT INTO jobs (
              id, source, source_job_id, company, company_domain, title, description,
              location_json, remote_type, employment_type, seniority, date_posted, date_updated,
              salary_min, salary_max, salary_currency, application_url, canonical_url,
              source_url, discovered_at, first_seen_at, last_seen_at, fingerprint, status,
              created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .bind(
            job.id,
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

  // 4. Distributed Search Lock
  public async acquireLock(lockedBy: string, leaseMs: number = APP_CONFIG.search.lockTtlMs): Promise<boolean> {
    const nowIso = new Date().toISOString();
    const expiresIso = new Date(Date.now() + leaseMs).toISOString();

    // Check if active lock exists
    const currentLock = await this.db
      .prepare('SELECT * FROM search_lock WHERE lock_id = ?')
      .bind('global_search_lock')
      .first<{ lock_id: string; locked_by: string; expires_at: string }>();

    if (currentLock) {
      if (new Date(currentLock.expires_at).getTime() > Date.now()) {
        // Still valid active lock held by someone else
        return false;
      }
      // Expired lock: take it over
      await this.db
        .prepare('UPDATE search_lock SET locked_by = ?, acquired_at = ?, expires_at = ? WHERE lock_id = ?')
        .bind(lockedBy, nowIso, expiresIso, 'global_search_lock')
        .run();
      return true;
    }

    // Insert lock
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

  // 5. Search Run Tracking
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

    for (const src of result.sources) {
      await this.db
        .prepare(
          `INSERT INTO search_run_sources (
            id, run_id, source_id, status, jobs_found, new_jobs, duration_ms, error_message, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          `srs_${Math.random().toString(36).slice(2, 9)}`,
          result.runId,
          src.sourceId,
          src.status,
          src.jobsFound,
          src.newJobs,
          src.durationMs,
          src.error || null,
          nowIso
        )
        .run();
    }
  }

  public async getRecentSearchRuns(limit: number = 10): Promise<any[]> {
    const runs = await this.db
      .prepare('SELECT * FROM search_runs ORDER BY started_at DESC LIMIT ?')
      .bind(limit)
      .all<any>();
    return runs.results || [];
  }

  // 6. Analytics Aggregations
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

    // Top companies
    const topCompaniesRes = await this.db
      .prepare('SELECT company, COUNT(*) as count FROM jobs GROUP BY company ORDER BY count DESC LIMIT 8')
      .all<{ company: string; count: number }>();

    // Top sources
    const topSourcesRes = await this.db
      .prepare('SELECT source, COUNT(*) as count FROM jobs GROUP BY source ORDER BY count DESC')
      .all<{ source: string; count: number }>();

    // Remote vs Onsite
    const remoteDistRes = await this.db
      .prepare('SELECT remote_type, COUNT(*) as count FROM jobs GROUP BY remote_type')
      .all<{ remote_type: string; count: number }>();

    // Recent discovery daily trend (last 7 days)
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

  // 7. Settings and Management
  public async resetAllJobs(): Promise<void> {
    await this.db.prepare('DELETE FROM job_matches').run();
    await this.db.prepare('DELETE FROM job_status_history').run();
    await this.db.prepare('DELETE FROM search_run_sources').run();
    await this.db.prepare('DELETE FROM search_runs').run();
    await this.db.prepare('DELETE FROM jobs').run();
  }

  public async exportAllData(): Promise<any> {
    const jobs = await this.db.prepare('SELECT * FROM jobs ORDER BY discovered_at DESC').all<any>();
    const profile = await this.getProfile();
    const statusHistory = await this.db.prepare('SELECT * FROM job_status_history ORDER BY changed_at DESC').all<any>();
    return {
      exportDate: new Date().toISOString(),
      profile,
      jobs: jobs.results || [],
      statusHistory: statusHistory.results || [],
    };
  }
}
