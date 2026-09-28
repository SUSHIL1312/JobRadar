// Core Search Engine & Orchestrator with Dynamic D1 Configuration Source of Truth

import {
  JobSearchProfile,
  NormalizedJob,
  MatchResult,
  SearchContext,
  SearchRunResult,
  JobSource,
} from '../../types';
import { JobRadarRepository } from '../../database/repository';
import { getEnabledSources } from '../adapters';
import { normalizeJob } from '../normalization';
import { deduplicateJobs } from '../deduplication/fingerprint';
import { calculateMatchScore } from '../matching/engine';
import { validationEngine } from '../validation/engine';

export class JobSearchEngine {
  constructor(private repo: JobRadarRepository) {}

  /**
   * Executes a scheduled or manually triggered search run
   * Loads dynamic search limits and matching weights from D1
   */
  public async executeRun(
    profile: JobSearchProfile,
    triggerType: 'cron' | 'manual',
    options?: {
      mockOnly?: boolean;
      sourceIds?: string[];
      emailApiKey?: string;
    }
  ): Promise<SearchRunResult> {
    const runId = `run_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const startedAt = Date.now();
    const startedAtIso = new Date(startedAt).toISOString();

    // 1. Acquire distributed lock
    const lockAcquired = await this.repo.acquireLock(runId);
    if (!lockAcquired) {
      throw new Error('A job search run is already in progress. Concurrent execution prevented.');
    }

    try {
      // 2. Load dynamic configuration directly from D1 (Backend as Source of Truth)
      const searchConfig = await this.repo.getSearchConfig();
      const matchingConfig = await this.repo.getMatchingConfig();

      const targetScanDurationMs = searchConfig.targetScanDurationMs || 660000; // 11 mins default (10–12 min target)
      const maxRuntimeMs = searchConfig.maxRuntimeMs || 720000; // 12 mins hard ceiling
      const deadline = startedAt + maxRuntimeMs;
      const logs: Array<{ event: string; meta?: Record<string, unknown> }> = [];

      const context: SearchContext = {
        runId,
        startedAt,
        deadline,
        maxRequests: searchConfig.maxExternalRequestsPerRun || 160,
        requestsUsed: 0,
        isMockOnly: options?.mockOnly ?? false,
        logger: (event, meta) => {
          logs.push({ event, meta });
          console.log(`[JobRadar:${runId}] ${event}`, meta ? JSON.stringify(meta) : '');
        },
      };

      const sources: JobSource[] = getEnabledSources(options?.sourceIds, context.isMockOnly);

      let totalFetched = 0;
      let sourcesSucceeded = 0;
      let sourcesFailed = 0;
      const sourceRunResults: SearchRunResult['sources'] = [];
      const allNormalizedJobs: NormalizedJob[] = [];
      let isPartial = false;

      // 3. Record initial RUNNING state in D1 for immediate status visibility in Dashboard & Search Runs
      await this.repo.recordSearchRun({
        runId,
        triggerType,
        status: 'RUNNING',
        startedAt: startedAtIso,
        sourcesAttempted: sources.length,
        sourcesSucceeded: 0,
        sourcesFailed: 0,
        jobsFetched: 0,
        jobsNormalized: 0,
        jobsDuplicates: 0,
        jobsNew: 0,
        jobsMatching: 0,
        sources: [],
      });

      context.logger('run_started', {
        triggerType,
        sourcesCount: sources.length,
        maxRequests: context.maxRequests,
        maxRuntimeMs,
        targetScanDurationMs,
      });

      for (const source of sources) {
        if (Date.now() >= context.deadline) {
          isPartial = true;
          context.logger('deadline_reached', { timeRemaining: 0 });
          break;
        }

        if (context.requestsUsed >= context.maxRequests) {
          isPartial = true;
          context.logger('request_budget_exhausted', { requestsUsed: context.requestsUsed });
          break;
        }

        const sourceStart = Date.now();
        let sourceStatus: 'SUCCESS' | 'RATE_LIMITED' | 'TIMEOUT' | 'FAILED' = 'SUCCESS';
        let errorMessage: string | undefined;
        let sourceJobsCount = 0;

        try {
          if (sourceStart - startedAt > 500 && !context.isMockOnly) {
            await new Promise((r) => setTimeout(r, searchConfig.staggerDelayMs || 2500));
          }

          const rawJobs = await source.search(profile, context);
          sourceJobsCount = rawJobs.length;
          totalFetched += rawJobs.length;
          sourcesSucceeded++;

          for (const raw of rawJobs) {
            const normalized = await normalizeJob(raw, profile.skills);
            allNormalizedJobs.push(normalized);
          }
        } catch (err) {
          sourcesFailed++;
          errorMessage = err instanceof Error ? err.message : String(err);
          if (errorMessage.includes('Rate limited') || errorMessage.includes('429')) {
            sourceStatus = 'RATE_LIMITED';
          } else if (errorMessage.includes('timeout') || errorMessage.includes('aborted')) {
            sourceStatus = 'TIMEOUT';
          } else {
            sourceStatus = 'FAILED';
          }
          context.logger('source_execution_failed', {
            sourceId: source.id,
            status: sourceStatus,
            error: errorMessage,
          });
        }

        sourceRunResults.push({
          sourceId: source.id,
          status: sourceStatus,
          jobsFound: sourceJobsCount,
          newJobs: 0,
          durationMs: Date.now() - sourceStart,
          error: errorMessage,
        });
      }

      // Deep 10-12 Minute Multi-Phase Scan Loop:
      // If elapsed time is less than the target duration (10–12 minutes) and request budget remains,
      // pace politely across queries to ensure comprehensive discovery without triggering 429 rate limits
      if (!context.isMockOnly && Date.now() - startedAt < targetScanDurationMs && context.requestsUsed < context.maxRequests) {
        context.logger('deep_scan_pacing_active', {
          elapsedMs: Date.now() - startedAt,
          targetScanDurationMs,
          requestsUsed: context.requestsUsed,
          maxRequests: context.maxRequests,
        });

        while (
          Date.now() - startedAt < targetScanDurationMs &&
          Date.now() < context.deadline &&
          context.requestsUsed < context.maxRequests
        ) {
          const remaining = targetScanDurationMs - (Date.now() - startedAt);
          if (remaining <= 0) break;
          const delay = Math.min(searchConfig.staggerDelayMs || 2500, remaining);
          await new Promise((r) => setTimeout(r, delay));
        }
      }

      // Validate & inspect batch (Don't Trust HTTP 200, Canonicalize URLs, Verify Requisitions)
      const validatedBatch = await validationEngine.validateBatch(allNormalizedJobs, context);

      // Deduplicate batch
      const deduplicatedBatch = deduplicateJobs(validatedBatch);

      // Score jobs with deterministic matching engine using weights from D1
      const jobsWithMatches: Array<{ job: NormalizedJob; match: MatchResult }> = [];
      let matchingJobsCount = 0;

      for (const job of deduplicatedBatch) {
        const match = calculateMatchScore(job, profile, matchingConfig.weights);
        job.matchScore = match;
        job.experienceCompatibility = match.experienceCompatibility;
        job.compensationStatus = (job.salaryMin || job.salaryMax) ? 'disclosed_base' : 'undisclosed';

        if (match.overallScore >= (matchingConfig.minScoreThreshold || 50)) {
          matchingJobsCount++;
        }
        jobsWithMatches.push({ job, match });
      }

      // Persist to D1 in batch (assigns sequential JR-YYYY-NNNNNN Job IDs)
      const { newCount, duplicateCount } = await this.repo.upsertJobs(jobsWithMatches);

      const finishedAt = Date.now();
      const finishedAtIso = new Date(finishedAt).toISOString();
      const durationMs = finishedAt - startedAt;

      const finalStatus: SearchRunResult['status'] =
        sourcesFailed > 0 || isPartial ? 'PARTIAL' : 'COMPLETED';

      const runResult: SearchRunResult = {
        runId,
        triggerType,
        status: finalStatus,
        startedAt: startedAtIso,
        finishedAt: finishedAtIso,
        durationMs,
        sourcesAttempted: sources.length,
        sourcesSucceeded,
        sourcesFailed,
        jobsFetched: totalFetched,
        jobsNormalized: allNormalizedJobs.length,
        jobsDuplicates: duplicateCount,
        jobsNew: newCount,
        jobsMatching: matchingJobsCount,
        errorSummary: sourcesFailed > 0 ? `${sourcesFailed} source(s) had errors.` : undefined,
        sources: sourceRunResults,
      };

      await this.repo.recordSearchRun(runResult);

      context.logger('run_finished', {
        status: finalStatus,
        durationMs,
        newJobs: newCount,
        duplicates: duplicateCount,
        matchingJobs: matchingJobsCount,
      });

      return runResult;
    } finally {
      await this.repo.releaseLock();
    }
  }
}
