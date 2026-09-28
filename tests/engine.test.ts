import { describe, it, expect, vi } from 'vitest';
import { JobSearchEngine } from '../src/jobs/scheduler/engine';
import { JobRadarRepository } from '../src/database/repository';
import { JobSearchProfile, RawJob } from '../src/types';

describe('JobSearchEngine Core', () => {
  const profile: JobSearchProfile = {
    id: 'test_prof',
    fullName: 'Test User',
    email: 'test@example.com',
    title: 'Senior C++ Developer',
    yearsOfExperience: 4.5,
    skills: ['C++', 'Python', 'Linux'],
    jobTitles: ['C++ Developer', 'Software Engineer'],
    seniorityLevels: ['senior'],
    locations: ['Remote'],
    remotePreference: 'remote_preferred',
    employmentTypes: ['full_time'],
    preferredCompanies: ['NVIDIA'],
    excludedCompanies: [],
    keywords: [],
    excludedKeywords: [],
    enabledSources: ['mock'],
  };

  it('handles execution and releases lock successfully', async () => {
    let isLocked = false;

    const mockRepo = {
      acquireLock: vi.fn(async () => {
        if (isLocked) return false;
        isLocked = true;
        return true;
      }),
      releaseLock: vi.fn(async () => {
        isLocked = false;
      }),
      upsertJobs: vi.fn(async () => ({ newCount: 5, duplicateCount: 1 })),
      recordSearchRun: vi.fn(async () => {}),
      getSearchConfig: vi.fn(async () => ({
        maxRuntimeMs: 300000,
        maxExternalRequestsPerRun: 40,
        maxPagesPerSource: 3,
        freshnessHorizon: '7d',
        staggerDelayMs: 0,
        cooldownMs: 300000,
      })),
      getMatchingConfig: vi.fn(async () => ({
        weights: { title: 35, skills: 30, seniority: 10, experience: 15, location: 10 },
        preferredCompanyBonus: 10,
        minScoreThreshold: 40,
      })),
    } as unknown as JobRadarRepository;

    const engine = new JobSearchEngine(mockRepo);
    const result = await engine.executeRun(profile, 'manual', { mockOnly: true });

    expect(result.status).toBe('COMPLETED');
    expect(result.jobsFetched).toBeGreaterThan(0);
    expect(mockRepo.acquireLock).toHaveBeenCalled();
    expect(mockRepo.releaseLock).toHaveBeenCalled();
    expect(mockRepo.upsertJobs).toHaveBeenCalled();
    expect(isLocked).toBe(false);
  });

  it('rejects concurrent run when lock is active', async () => {
    const mockRepo = {
      acquireLock: vi.fn(async () => false),
      releaseLock: vi.fn(async () => {}),
    } as unknown as JobRadarRepository;

    const engine = new JobSearchEngine(mockRepo);
    await expect(engine.executeRun(profile, 'manual')).rejects.toThrow(/already in progress/);
  });
});
