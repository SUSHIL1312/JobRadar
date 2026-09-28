// Cloudflare Worker Entry Point (API Router, Cron Triggers & Static Asset Serving)

import { JobRadarRepository } from './database/repository';
import { JobSearchEngine } from './jobs/scheduler/engine';
import { emailService } from './notifications/email';
import { ALL_JOB_SOURCES } from './jobs/adapters';
import { APP_CONFIG } from './config';
import { FilterState, JobStatus } from './types';

export interface Env {
  DB: D1Database;
  ASSETS: { fetch: (request: Request) => Promise<Response> };
  RESEND_API_KEY?: string;
  AUTH_SECRET?: string;
  ENVIRONMENT?: string;
  MOCK_SOURCES?: string;
  MAX_EXTERNAL_REQUESTS_PER_RUN?: string;
  MAX_RUNTIME_MS?: string;
}

export default {
  /**
   * Main HTTP Request Handler for Worker API and Static Assets
   */
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // 1. Security Headers middleware wrapper
    const handleRequest = async (): Promise<Response> => {
      // Only intercept /api/* routes; everything else is served by static assets
      if (!url.pathname.startsWith('/api')) {
        return env.ASSETS.fetch(request);
      }

      const repo = new JobRadarRepository(env.DB);
      const isMockMode = env.MOCK_SOURCES === 'true' || env.ENVIRONMENT === 'development';

      // Simple personal auth check if AUTH_SECRET is configured
      if (env.AUTH_SECRET && !url.pathname.startsWith('/api/health')) {
        const authHeader = request.headers.get('Authorization');
        const token = authHeader?.replace(/^Bearer\s+/i, '');
        if (token !== env.AUTH_SECRET) {
          // If no bearer token, also check cookie or access header
          const accessEmail = request.headers.get('Cf-Access-Authenticated-User-Email');
          if (!accessEmail) {
            return jsonResponse({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, 401);
          }
        }
      }

      // Handle CORS for development
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 204,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        });
      }

      try {
        // --- GET /api/health ---
        if (url.pathname === '/api/health') {
          return jsonResponse({
            success: true,
            data: {
              status: 'healthy',
              version: APP_CONFIG.version,
              timestamp: new Date().toISOString(),
              environment: env.ENVIRONMENT || 'production',
              mockMode: isMockMode,
            },
          });
        }

        // --- GET /api/profile ---
        if (url.pathname === '/api/profile' && request.method === 'GET') {
          let profile = await repo.getProfile();
          if (!profile) {
            // Clean empty template when database has no profile
            profile = {
              id: 'user_profile_main',
              fullName: '',
              email: '',
              title: '',
              yearsOfExperience: 0,
              currentRole: '',
              currentCompany: '',
              skills: [],
              jobTitles: [],
              seniorityLevels: [],
              locations: [],
              remotePreference: 'remote_preferred',
              employmentTypes: ['full_time'],
              minimumSalary: undefined,
              salaryCurrency: 'INR',
              preferredCompanies: [],
              excludedCompanies: [],
              keywords: [],
              excludedKeywords: [],
              enabledSources: ['greenhouse', 'lever', 'remotive'],
            };
          }
          return jsonResponse({ success: true, data: profile });
        }

        // --- POST /api/profile/reset ---
        if (url.pathname === '/api/profile/reset' && request.method === 'POST') {
          const body = (await request.json().catch(() => ({}))) as { password?: string };
          const providedPassword = (body.password || '').trim();

          // Validate password / confirmation
          if (env.AUTH_SECRET && env.AUTH_SECRET.trim().length > 0) {
            if (providedPassword !== env.AUTH_SECRET.trim()) {
              return jsonResponse({ success: false, error: { code: 'UNAUTHORIZED', message: 'Incorrect authentication password' } }, 401);
            }
          } else {
            // If no AUTH_SECRET is configured, accept "RESET", "CLEAR", or non-empty string as confirmation
            if (!providedPassword || !['RESET', 'CLEAR'].includes(providedPassword.toUpperCase())) {
              return jsonResponse({
                success: false,
                error: { code: 'INVALID_CONFIRMATION', message: 'Please enter "RESET" or "CLEAR" to confirm profile reset' },
              }, 400);
            }
          }

          await repo.resetProfile();
          return jsonResponse({ success: true, data: { message: 'Career profile cleared successfully' } });
        }

        // --- PUT /api/profile ---
        if (url.pathname === '/api/profile' && request.method === 'PUT') {
          const body = (await request.json()) as any;
          await repo.saveProfile(body);
          return jsonResponse({ success: true, data: { message: 'Profile saved successfully' } });
        }

        // --- GET /api/jobs ---
        if (url.pathname === '/api/jobs' && request.method === 'GET') {
          const filter: FilterState = {
            status: (url.searchParams.get('status') as JobStatus | 'ALL') || 'ALL',
            ageHorizon: url.searchParams.get('age') || 'all',
            remote: (url.searchParams.get('remote') as any) || 'ALL',
            seniority: (url.searchParams.get('seniority') as any) || 'ALL',
            company: url.searchParams.get('company') || undefined,
            source: url.searchParams.get('source') || undefined,
            minScore: url.searchParams.get('minScore') ? parseInt(url.searchParams.get('minScore')!, 10) : undefined,
            searchQuery: url.searchParams.get('q') || undefined,
            sort: (url.searchParams.get('sort') as any) || 'fresh_match',
            page: url.searchParams.get('page') ? parseInt(url.searchParams.get('page')!, 10) : 1,
            pageSize: url.searchParams.get('pageSize') ? parseInt(url.searchParams.get('pageSize')!, 10) : APP_CONFIG.ui.defaultPageSize,
          };

          const result = await repo.getJobs(filter);
          return jsonResponse({ success: true, data: result });
        }

        // --- GET /api/jobs/:id ---
        const jobMatch = url.pathname.match(/^\/api\/jobs\/([a-zA-Z0-9_-]+)$/);
        if (jobMatch && request.method === 'GET') {
          const jobId = jobMatch[1];
          const job = await repo.getJobById(jobId);
          if (!job) {
            return jsonResponse({ success: false, error: { code: 'NOT_FOUND', message: 'Job not found' } }, 404);
          }
          await repo.markJobViewed(jobId);
          return jsonResponse({ success: true, data: job });
        }

        // --- DELETE /api/jobs/:id ---
        if (jobMatch && request.method === 'DELETE') {
          const jobId = jobMatch[1];
          const deleted = await repo.deleteJob(jobId);
          if (!deleted) {
            return jsonResponse({ success: false, error: { code: 'NOT_FOUND', message: 'Job not found' } }, 404);
          }
          return jsonResponse({ success: true, data: { jobId, deleted: true } });
        }

        // --- GET /api/jobs/:id/timeline ---
        const timelineMatch = url.pathname.match(/^\/api\/jobs\/([a-zA-Z0-9_-]+)\/timeline$/);
        if (timelineMatch && request.method === 'GET') {
          const jobId = timelineMatch[1];
          const timeline = await repo.getApplicationTimeline(jobId);
          return jsonResponse({ success: true, data: timeline });
        }

        // --- PATCH /api/jobs/:id/status ---
        const statusMatch = url.pathname.match(/^\/api\/jobs\/([a-zA-Z0-9_-]+)\/status$/);
        if (statusMatch && request.method === 'PATCH') {
          const jobId = statusMatch[1];
          const { status, notes } = (await request.json()) as { status: JobStatus; notes?: string };
          const ok = await repo.updateJobStatus(jobId, status, notes);
          if (!ok) {
            return jsonResponse({ success: false, error: { code: 'NOT_FOUND', message: 'Job not found' } }, 404);
          }
          return jsonResponse({ success: true, data: { jobId, status } });
        }

        // --- PATCH /api/jobs/:id/notes ---
        const notesMatch = url.pathname.match(/^\/api\/jobs\/([a-zA-Z0-9_-]+)\/notes$/);
        if (notesMatch && request.method === 'PATCH') {
          const jobId = notesMatch[1];
          const { notes } = (await request.json()) as { notes: string };
          await repo.updateJobNotes(jobId, notes);
          return jsonResponse({ success: true, data: { jobId, notes } });
        }

        // --- PATCH /api/jobs/:id/interview ---
        const interviewMatch = url.pathname.match(/^\/api\/jobs\/([a-zA-Z0-9_-]+)\/interview$/);
        if (interviewMatch && request.method === 'PATCH') {
          const jobId = interviewMatch[1];
          const { interviewDate, round } = (await request.json()) as { interviewDate: string; round?: string };
          await repo.updateJobInterview(jobId, interviewDate, round);
          return jsonResponse({ success: true, data: { jobId, interviewDate, round } });
        }

        // --- PATCH /api/jobs/:id/offer ---
        const offerMatch = url.pathname.match(/^\/api\/jobs\/([a-zA-Z0-9_-]+)\/offer$/);
        if (offerMatch && request.method === 'PATCH') {
          const jobId = offerMatch[1];
          const { salary, currency } = (await request.json()) as { salary: number; currency?: string };
          await repo.updateJobOffer(jobId, salary, currency);
          return jsonResponse({ success: true, data: { jobId, salary, currency } });
        }

        // --- POST /api/jobs/bulk-status ---
        if (url.pathname === '/api/jobs/bulk-status' && request.method === 'POST') {
          const { jobIds, status } = (await request.json()) as { jobIds: string[]; status: JobStatus };
          for (const id of jobIds) {
            await repo.updateJobStatus(id, status);
          }
          return jsonResponse({ success: true, data: { count: jobIds.length, status } });
        }

        // --- POST /api/jobs/bulk-delete ---
        if (url.pathname === '/api/jobs/bulk-delete' && request.method === 'POST') {
          const { jobIds } = (await request.json().catch(() => ({}))) as { jobIds?: string[] };
          if (!Array.isArray(jobIds) || jobIds.length === 0) {
            return jsonResponse({ success: false, error: { code: 'BAD_REQUEST', message: 'jobIds array is required' } }, 400);
          }
          const count = await repo.deleteJobs(jobIds);
          return jsonResponse({ success: true, data: { count, deleted: true } });
        }

        // --- GET /api/analytics ---
        if (url.pathname === '/api/analytics' && request.method === 'GET') {
          const analytics = await repo.getAnalytics();
          return jsonResponse({ success: true, data: analytics });
        }

        // --- GET /api/sources ---
        if (url.pathname === '/api/sources' && request.method === 'GET') {
          const sources = ALL_JOB_SOURCES.map(s => ({
            id: s.id,
            name: s.name,
            type: s.type,
            enabled: s.enabled,
            priority: s.priority,
            capabilities: s.getCapabilities(),
          }));
          return jsonResponse({ success: true, data: sources });
        }

        // --- GET /api/search-runs ---
        if (url.pathname === '/api/search-runs' && request.method === 'GET') {
          const runs = await repo.getRecentSearchRuns(15);
          return jsonResponse({ success: true, data: runs });
        }

        // --- POST /api/search/run (Manual Search Trigger) ---
        if (url.pathname === '/api/search/run' && request.method === 'POST') {
          let profile = await repo.getProfile();
          if (!profile) {
            return jsonResponse({ success: false, error: { code: 'PROFILE_REQUIRED', message: 'Configure profile first' } }, 400);
          }

          const body = (await request.json().catch(() => ({}))) as { mock?: boolean };
          const forceMock = body.mock === true || isMockMode;

          const engine = new JobSearchEngine(repo);
          const result = await engine.executeRun(profile, 'manual', {
            mockOnly: forceMock,
            emailApiKey: env.RESEND_API_KEY,
          });

          return jsonResponse({ success: true, data: result });
        }

        // --- GET /api/export ---
        if (url.pathname === '/api/export' && request.method === 'GET') {
          const format = url.searchParams.get('format') || 'json';
          const exportData = await repo.exportAllData();

          if (format === 'csv') {
            const csvRows: string[] = ['ID,Company,Title,Location,Remote,Seniority,SalaryMin,SalaryMax,Status,ApplicationURL,DiscoveredAt'];
            for (const j of exportData.jobs) {
              const esc = (val?: string | number) => `"${String(val ?? '').replace(/"/g, '""')}"`;
              csvRows.push([
                esc(j.id),
                esc(j.company),
                esc(j.title),
                esc(j.location_json),
                esc(j.remote_type),
                esc(j.seniority),
                esc(j.salary_min),
                esc(j.salary_max),
                esc(j.status),
                esc(j.application_url),
                esc(j.discovered_at),
              ].join(','));
            }
            return new Response(csvRows.join('\n'), {
              headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="jobradar_export_${Date.now()}.csv"`,
              },
            });
          }

          return jsonResponse({ success: true, data: exportData });
        }

        // --- POST /api/settings/reset-jobs ---
        if (url.pathname === '/api/settings/reset-jobs' && request.method === 'POST') {
          await repo.resetAllJobs();
          return jsonResponse({ success: true, data: { message: 'All job data reset successfully' } });
        }

        // --- GET /api/config/search ---
        if (url.pathname === '/api/config/search' && request.method === 'GET') {
          const config = await repo.getSearchConfig();
          return jsonResponse({ success: true, data: config });
        }

        // --- PUT /api/config/search ---
        if (url.pathname === '/api/config/search' && request.method === 'PUT') {
          const body = (await request.json()) as any;
          await repo.saveSearchConfig(body);
          return jsonResponse({ success: true, data: { message: 'Search configuration updated successfully' } });
        }

        // --- GET /api/config/matching ---
        if (url.pathname === '/api/config/matching' && request.method === 'GET') {
          const config = await repo.getMatchingConfig();
          return jsonResponse({ success: true, data: config });
        }

        // --- PUT /api/config/matching ---
        if (url.pathname === '/api/config/matching' && request.method === 'PUT') {
          const body = (await request.json()) as any;
          await repo.saveMatchingConfig(body);
          return jsonResponse({ success: true, data: { message: 'Matching weights updated successfully' } });
        }

        // --- GET /api/config/notifications ---
        if (url.pathname === '/api/config/notifications' && request.method === 'GET') {
          const config = await repo.getNotificationConfig();
          return jsonResponse({ success: true, data: config });
        }

        // --- PUT /api/config/notifications ---
        if (url.pathname === '/api/config/notifications' && request.method === 'PUT') {
          const body = (await request.json()) as any;
          await repo.saveNotificationConfig(body);
          return jsonResponse({ success: true, data: { message: 'Notification settings updated successfully' } });
        }

        // --- GET /api/secrets/status ---
        if (url.pathname === '/api/secrets/status' && request.method === 'GET') {
          return jsonResponse({
            success: true,
            data: {
              resendApiKeyConfigured: Boolean(env.RESEND_API_KEY && env.RESEND_API_KEY.trim().length > 0),
              resendApiKeyMasked: env.RESEND_API_KEY && env.RESEND_API_KEY.trim().length > 0 ? '●●●●●●●●●●●●' : null,
              authSecretConfigured: Boolean(env.AUTH_SECRET && env.AUTH_SECRET.trim().length > 0),
              authSecretMasked: env.AUTH_SECRET && env.AUTH_SECRET.trim().length > 0 ? '●●●●●●●●●●●●' : null,
            },
          });
        }

        return jsonResponse({ success: false, error: { code: 'NOT_FOUND', message: `Unknown endpoint: ${url.pathname}` } }, 404);
      } catch (err: unknown) {
        const error = err instanceof Error ? err.message : String(err);
        return jsonResponse({ success: false, error: { code: 'INTERNAL_ERROR', message: error } }, 500);
      }
    };

    const res = await handleRequest();
    // Attach security headers
    const newHeaders = new Headers(res.headers);
    newHeaders.set('X-Content-Type-Options', 'nosniff');
    newHeaders.set('X-Frame-Options', 'DENY');
    newHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    newHeaders.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: newHeaders,
    });
  },

  /**
   * Cloudflare Cron Trigger Handler
   * Runs at 8am, 10am, 1pm, 5pm, 9pm IST (configured as UTC in wrangler.jsonc)
   */
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log(`[JobRadar:Cron] Triggered cron schedule: ${event.cron} at ${new Date().toISOString()}`);

    const repo = new JobRadarRepository(env.DB);
    const profile = await repo.getProfile();
    if (!profile) {
      console.warn('[JobRadar:Cron] No profile found; aborting scheduled run.');
      return;
    }

    const isMock = env.MOCK_SOURCES === 'true';
    const engine = new JobSearchEngine(repo);

    try {
      const result = await engine.executeRun(profile, 'cron', {
        mockOnly: isMock,
        emailApiKey: env.RESEND_API_KEY,
      });

      console.log(`[JobRadar:Cron] Search completed: ${result.jobsNew} new jobs found.`);

      // Send email notification based on D1 notification settings
      const notifConfig = await repo.getNotificationConfig();
      const recipient = notifConfig.emailRecipient || profile.email;
      if (notifConfig.emailEnabled && env.RESEND_API_KEY && recipient && (result.jobsNew > 0 || notifConfig.notifyOnZeroJobs)) {
        // Fetch newly discovered jobs respecting minScoreForNotification and maxJobsPerEmail
        const filter: FilterState = {
          status: 'NEW',
          ageHorizon: '6h',
          minScore: notifConfig.minScoreForNotification,
          pageSize: notifConfig.maxJobsPerEmail || 15,
        };
        const { jobs } = await repo.getJobs(filter);

        if (jobs.length > 0 || notifConfig.notifyOnZeroJobs) {
          const emailRes = await emailService.sendNewJobsDigest({
            recipient,
            newJobs: jobs,
            totalDiscovered: result.jobsNew,
            apiKey: env.RESEND_API_KEY,
          });

          console.log(`[JobRadar:Cron] Email digest status: ${emailRes.success ? 'SENT' : 'FAILED'}`, emailRes.error || '');
        }
      }
    } catch (err) {
      console.error('[JobRadar:Cron] Scheduled run failed:', err);
    }
  },
};

function jsonResponse(data: unknown, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
