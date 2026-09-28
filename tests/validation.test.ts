import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JobValidationEngine, validationEngine } from '../src/jobs/validation/engine';
import { NormalizedJob } from '../src/types';

describe('JobValidationEngine', () => {
  let engine: JobValidationEngine;

  beforeEach(() => {
    engine = new JobValidationEngine();
  });

  const baseJob: NormalizedJob = {
    id: 'test_job_1',
    jobId: 'JR-2026-000001',
    source: 'greenhouse',
    company: 'NVIDIA',
    title: 'Senior Deep Learning Systems Engineer',
    description: 'Looking for a Senior C++ and PyTorch engineer.',
    location: ['Bengaluru, India'],
    remoteType: 'hybrid',
    employmentType: 'full_time',
    seniority: 'senior',
    applicationUrl: 'https://boards.greenhouse.io/nvidia/jobs/12345?utm_source=linkedin&utm_campaign=hiring&ref=feed',
    sourceUrl: 'https://boards.greenhouse.io/nvidia/jobs/12345',
    discoveredAt: new Date().toISOString(),
    firstSeenAt: new Date().toISOString(),
    lastSeenAt: new Date().toISOString(),
    availabilityStatus: 'UNVERIFIED',
    fingerprint: 'fp_nvidia_12345',
    status: 'NEW',
  };

  describe('canonicalizeUrl', () => {
    it('strips tracking and telemetry parameters cleanly', () => {
      const dirtyUrl = 'https://jobs.lever.co/company/role-123?utm_source=twitter&utm_medium=social&utm_campaign=spring26&ref=aggregator&fbclid=abc123xyz';
      const cleanUrl = engine.canonicalizeUrl(dirtyUrl);
      expect(cleanUrl).toBe('https://jobs.lever.co/company/role-123');
    });

    it('preserves essential functional query parameters', () => {
      const functionalUrl = 'https://careers.google.com/jobs/results/?q=engineer&location=India';
      const cleanUrl = engine.canonicalizeUrl(functionalUrl);
      expect(cleanUrl).toContain('q=engineer');
      expect(cleanUrl).toContain('location=India');
    });
  });

  describe('Structural Validation', () => {
    it('rejects job with empty or missing title', async () => {
      const invalidJob = { ...baseJob, title: '' };
      const res = await engine.validateJob(invalidJob);
      expect(res.passed).toBe(false);
      expect(res.availability).toBe('INVALID');
      expect(res.checks.titlePresent).toBe(false);
    });

    it('rejects job with dummy or null placeholder title', async () => {
      const invalidJob = { ...baseJob, title: 'null' };
      const res = await engine.validateJob(invalidJob);
      expect(res.passed).toBe(false);
      expect(res.availability).toBe('INVALID');
    });

    it('rejects job with missing company', async () => {
      const invalidJob = { ...baseJob, company: ' ' };
      const res = await engine.validateJob(invalidJob);
      expect(res.passed).toBe(false);
      expect(res.availability).toBe('INVALID');
      expect(res.checks.companyPresent).toBe(false);
    });

    it('rejects job with invalid URL protocol or localhost domain', async () => {
      const invalidJob = { ...baseJob, applicationUrl: 'http://localhost:3000/job/1' };
      const res = await engine.validateJob(invalidJob);
      expect(res.passed).toBe(false);
      expect(res.availability).toBe('INVALID');
      expect(res.checks.domainAllowed).toBe(false);
    });
  });

  describe('Mock Mode Bypass', () => {
    it('approves mock source jobs deterministically without HTTP fetches', async () => {
      const mockJob: NormalizedJob = {
        ...baseJob,
        source: 'mock',
        applicationUrl: 'https://example.com/jobs/1',
      };
      const res = await engine.validateJob(mockJob);
      expect(res.passed).toBe(true);
      expect(res.availability).toBe('ACTIVE');
      expect(res.httpStatus).toBe(200);
    });
  });

  describe('Live Requisition Closure Detection ("Don\'t Trust HTTP 200")', () => {
    it('flags HTTP 404 or 410 as REMOVED', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        status: 404,
        url: 'https://boards.greenhouse.io/nvidia/jobs/12345',
        text: async () => '404 - Job Not Found',
      } as Response);

      const job: NormalizedJob = {
        ...baseJob,
        source: 'greenhouse',
        applicationUrl: 'https://boards.greenhouse.io/nvidia/jobs/12345',
      };

      const res = await engine.validateJob(job);
      expect(res.passed).toBe(false);
      expect(res.availability).toBe('REMOVED');
      expect(res.httpStatus).toBe(404);
      expect(res.reason).toContain('HTTP 404');
    });

    it('detects requisition closed pattern even when response is HTTP 200', async () => {
      const closedHtml = `
        <!DOCTYPE html>
        <html>
          <body>
            <div class="message">This position has been filled. Thank you for your interest.</div>
          </body>
        </html>
      `;

      globalThis.fetch = vi.fn().mockResolvedValue({
        status: 200,
        url: 'https://boards.greenhouse.io/nvidia/jobs/12345',
        text: async () => closedHtml,
      } as Response);

      const job: NormalizedJob = {
        ...baseJob,
        source: 'greenhouse',
        applicationUrl: 'https://boards.greenhouse.io/nvidia/jobs/12345',
      };

      const res = await engine.validateJob(job);
      expect(res.passed).toBe(false);
      expect(res.availability).toBe('EXPIRED');
      expect(res.reason).toContain('closed/expired');
    });

    it('detects redirect to generic careers homepage', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        status: 200,
        url: 'https://careers.company.com/careers',
        text: async () => '<html><body>Welcome to Careers</body></html>',
      } as Response);

      const job: NormalizedJob = {
        ...baseJob,
        source: 'greenhouse',
        applicationUrl: 'https://careers.company.com/jobs/expired-role',
      };

      const res = await engine.validateJob(job);
      expect(res.passed).toBe(false);
      expect(res.availability).toBe('EXPIRED');
      expect(res.reason).toContain('redirected to generic careers');
    });

    it('marks active requisition as ACTIVE with content match corroboration', async () => {
      const activeHtml = `
        <!DOCTYPE html>
        <html>
          <body>
            <h1>Senior Deep Learning Systems Engineer</h1>
            <h2>NVIDIA</h2>
            <form action="/apply">
              <button type="submit">Submit Application</button>
            </form>
          </body>
        </html>
      `;

      globalThis.fetch = vi.fn().mockResolvedValue({
        status: 200,
        url: 'https://boards.greenhouse.io/nvidia/jobs/12345',
        text: async () => activeHtml,
      } as Response);

      const job: NormalizedJob = {
        ...baseJob,
        source: 'greenhouse',
        applicationUrl: 'https://boards.greenhouse.io/nvidia/jobs/12345',
      };

      const res = await engine.validateJob(job);
      expect(res.passed).toBe(true);
      expect(res.availability).toBe('ACTIVE');
      expect(res.checks.closureDetected).toBe(false);
      expect(res.checks.contentMatch).toBe(true);
    });
  });

  describe('validateBatch', () => {
    it('canonicalizes URLs and updates availability and statuses', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        status: 404,
        url: 'https://boards.greenhouse.io/test/jobs/999',
        text: async () => 'Not found',
      } as Response);

      const rawBatch: NormalizedJob[] = [
        {
          ...baseJob,
          applicationUrl: 'https://boards.greenhouse.io/test/jobs/999?utm_source=mail',
          status: 'NEW',
        },
      ];

      const validated = await engine.validateBatch(rawBatch);
      expect(validated.length).toBe(1);
      expect(validated[0].applicationUrl).toBe('https://boards.greenhouse.io/test/jobs/999');
      expect(validated[0].availabilityStatus).toBe('REMOVED');
      // Expired/removed jobs never pollute the unreviewed feed:
      expect(validated[0].status).toBe('IGNORED');
    });
  });
});
