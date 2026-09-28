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

      const deadline = startedAt + (searchConfig.maxRuntimeMs || 300000);
      const logs: Array<{ event: string; meta?: Record<string, unknown> }> = [];

      const context: SearchContext = {
        runId,
        startedAt,
        deadline,
        maxRequests: searchConfig.maxExternalRequestsPerRun || 40,
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

      context.logger('run_started', {
        triggerType,
        sourcesCount: sources.length,
        maxRequests: context.maxRequests,
        maxRuntimeMs: searchConfig.maxRuntimeMs,
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
          if (sourceStart - startedAt > 500) {
            await new Promise((r) => setTimeout(r, searchConfig.staggerDelayMs || 500));
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

      // Deduplicate batch
      const deduplicatedBatch = deduplicateJobs(allNormalizedJobs);

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
