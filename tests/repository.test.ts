import { describe, it, expect, vi } from 'vitest';
import { JobRadarRepository } from '../src/database/repository';

describe('JobRadarRepository deletion and reset methods', () => {
  it('calls delete cascades properly when deleting a single job', async () => {
    const mockDb = {
      prepare: vi.fn().mockImplementation((query: string) => ({
        bind: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue({
            id: 'job_123',
            source_job_id: 'gh-123',
            source_platform: 'greenhouse',
            title: 'Software Engineer',
            company: 'Acme',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }),
          all: vi.fn().mockResolvedValue({ results: [] }),
          run: vi.fn().mockResolvedValue({ success: true, meta: { changes: 1 } }),
        }),
        run: vi.fn().mockResolvedValue({ success: true, meta: { changes: 1 } }),
      })),
    } as any;

    const repo = new JobRadarRepository(mockDb);
    const result = await repo.deleteJob('job_123');

    expect(result).toBe(true);
    expect(mockDb.prepare).toHaveBeenCalledWith('DELETE FROM job_matches WHERE job_id = ?');
    expect(mockDb.prepare).toHaveBeenCalledWith('DELETE FROM application_status_history WHERE job_id = ?');
    expect(mockDb.prepare).toHaveBeenCalledWith('DELETE FROM job_applications WHERE job_id = ?');
    expect(mockDb.prepare).toHaveBeenCalledWith('DELETE FROM jobs WHERE id = ?');
  });

  it('deletes multiple jobs in batch', async () => {
    const mockDb = {
      prepare: vi.fn().mockImplementation((query: string) => ({
        bind: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue({
            id: 'job_123',
            source_job_id: 'gh-123',
            source_platform: 'greenhouse',
            title: 'Engineer',
            company: 'Acme',
          }),
          run: vi.fn().mockResolvedValue({ success: true }),
        }),
      })),
    } as any;

    const repo = new JobRadarRepository(mockDb);
    const count = await repo.deleteJobs(['job_1', 'job_2', 'job_3']);

    expect(count).toBe(3);
  });

  it('resets all profile preference tables', async () => {
    const executedQueries: string[] = [];
    const mockDb = {
      prepare: vi.fn().mockImplementation((query: string) => {
        executedQueries.push(query);
        return {
          run: vi.fn().mockResolvedValue({ success: true }),
        };
      }),
    } as any;

    const repo = new JobRadarRepository(mockDb);
    await repo.resetProfile();

    expect(executedQueries).toContain('DELETE FROM user_skills');
    expect(executedQueries).toContain('DELETE FROM user_target_titles');
    expect(executedQueries).toContain('DELETE FROM user_seniority_preferences');
    expect(executedQueries).toContain('DELETE FROM user_location_preferences');
    expect(executedQueries).toContain('DELETE FROM user_company_preferences');
    expect(executedQueries).toContain('DELETE FROM user_keyword_exclusions');
    expect(executedQueries).toContain('DELETE FROM user_profile');
  });

  it('resets all job related tables', async () => {
    const executedQueries: string[] = [];
    const mockDb = {
      prepare: vi.fn().mockImplementation((query: string) => {
        executedQueries.push(query);
        return {
          run: vi.fn().mockResolvedValue({ success: true }),
        };
      }),
    } as any;

    const repo = new JobRadarRepository(mockDb);
    await repo.resetAllJobs();

    expect(executedQueries).toContain('DELETE FROM job_matches');
    expect(executedQueries).toContain('DELETE FROM application_status_history');
    expect(executedQueries).toContain('DELETE FROM job_applications');
    expect(executedQueries).toContain('DELETE FROM search_run_sources');
    expect(executedQueries).toContain('DELETE FROM search_runs');
    expect(executedQueries).toContain('DELETE FROM jobs');
  });
});
