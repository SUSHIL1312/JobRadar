// Core Search Engine & Orchestrator

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
import { APP_CONFIG } from '../../config';

export class JobSearchEngine {
  constructor(private repo: JobRadarRepository) {}

  /**
   * Executes a scheduled or manually triggered search run
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
    const deadline = startedAt + APP_CONFIG.search.maxRuntimeMs;

    // 1. Acquire distributed lock
    const lockAcquired = await this.repo.acquireLock(runId);
    if (!lockAcquired) {
      throw new Error('A job search run is already in progress. Concurrent execution prevented.');
    }

    const logs: Array<{ event: string; meta?: Record<string, unknown> }> = [];
    const context: SearchContext = {
      runId,
      startedAt,
      deadline,
      maxRequests: APP_CONFIG.search.maxExternalRequestsPerRun,
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

    try {
      context.logger('run_started', { triggerType, sourcesCount: sources.length });

      for (const source of sources) {
        // Check time deadline and request budget before invoking each source
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
          // Stagger slightly between sources to be polite
          if (sourceStart - startedAt > 500) {
            await new Promise(r => setTimeout(r, APP_CONFIG.search.staggerDelayMs));
          }

          const rawJobs = await source.search(profile, context);
          sourceJobsCount = rawJobs.length;
          totalFetched += rawJobs.length;
          sourcesSucceeded++;

          // Normalize jobs
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
          context.logger('source_execution_failed', { sourceId: source.id, status: sourceStatus, error: errorMessage });
        }

        sourceRunResults.push({
          sourceId: source.id,
          status: sourceStatus,
          jobsFound: sourceJobsCount,
          newJobs: 0, // calculated below after deduplication
          durationMs: Date.now() - sourceStart,
          error: errorMessage,
        });
      }

      // Deduplicate batch
      const deduplicatedBatch = deduplicateJobs(allNormalizedJobs);

      // Score jobs with deterministic matching engine
      const jobsWithMatches: Array<{ job: NormalizedJob; match: MatchResult }> = [];
      let matchingJobsCount = 0;

      for (const job of deduplicatedBatch) {
        const match = calculateMatchScore(job, profile);
        if (match.overallScore >= 50) {
          matchingJobsCount++;
        }
        jobsWithMatches.push({ job, match });
      }

      // Persist to D1 in batch
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

      // Record run in database
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
      // Always release lock
      await this.repo.releaseLock();
    }
  }
}
