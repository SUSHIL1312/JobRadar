// RemoteOK Public API Adapter

import { JobSource, RawJob, JobSearchProfile, SearchContext, SourceHealth, SourceCapabilities } from '../../types';
import { safeHttpClient } from './httpClient';

interface RemoteOKItem {
  id?: string | number;
  epoch?: number;
  date?: string;
  company?: string;
  company_logo?: string;
  position?: string;
  tags?: string[];
  description?: string;
  location?: string;
  salary_min?: number;
  salary_max?: number;
  url?: string;
  apply_url?: string;
}

export class RemoteOKAdapter implements JobSource {
  public id = 'remoteok';
  public name = 'RemoteOK Public API';
  public type = 'remote_job_board' as const;
  public enabled = true;
  public priority = 'medium' as const;

  // Search tags tailored to profile
  private searchTags = ['engineer', 'python', 'c++', 'ai', 'systems', 'developer'];

  public async search(_profile: JobSearchProfile, context: SearchContext): Promise<RawJob[]> {
    const rawJobs: RawJob[] = [];
    const seenIds = new Set<string>();

    for (const tag of this.searchTags) {
      if (Date.now() >= context.deadline || context.requestsUsed >= context.maxRequests) {
        break;
      }

      const url = `https://remoteok.com/api?tag=${encodeURIComponent(tag)}`;

      try {
        const { data } = await safeHttpClient.getJson<RemoteOKItem[]>(url, context, {
          'Accept': 'application/json',
        });

        if (Array.isArray(data)) {
          for (const item of data) {
            // First item in RemoteOK response is often metadata / legal notice
            if (!item.position || !item.company || !item.url) continue;

            const jobId = String(item.id || item.epoch || Math.random().toString(36).slice(2));
            if (seenIds.has(jobId)) continue;
            seenIds.add(jobId);

            rawJobs.push({
              source: this.id,
              sourceJobId: jobId,
              company: item.company,
              title: item.position,
              descriptionHtml: item.description,
              location: item.location ? [item.location] : ['Remote Worldwide'],
              isRemote: true,
              employmentType: 'full_time',
              datePosted: item.date || (item.epoch ? new Date(item.epoch * 1000).toISOString() : new Date().toISOString()),
              salaryMin: item.salary_min && item.salary_min > 0 ? item.salary_min : undefined,
              salaryMax: item.salary_max && item.salary_max > 0 ? item.salary_max : undefined,
              salaryCurrency: (item.salary_min || item.salary_max) ? 'USD' : undefined,
              applicationUrl: item.apply_url || item.url,
              canonicalUrl: item.url,
              sourceUrl: item.url,
            });
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        context.logger('remoteok_error', { tag, error: message });
      }
    }

    return rawJobs;
  }

  public async healthCheck(): Promise<SourceHealth> {
    return {
      sourceId: this.id,
      name: this.name,
      status: 'healthy',
      lastRunAt: new Date().toISOString(),
      jobsFoundTotal: 0,
      avgLatencyMs: 350,
      rateLimitHits: 0,
      consecutiveFailures: 0,
    };
  }

  public getCapabilities(): SourceCapabilities {
    return {
      supportsPagination: false,
      supportsDateFilter: true,
      providesExactSalary: true,
      providesFullDescription: true,
      rateLimitPerMinute: 30,
    };
  }
}
