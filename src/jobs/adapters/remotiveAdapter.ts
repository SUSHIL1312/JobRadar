// Remotive Remote Jobs API Adapter

import { JobSource, RawJob, JobSearchProfile, SearchContext, SourceHealth, SourceCapabilities } from '../../types';
import { safeHttpClient } from './httpClient';

interface RemotiveJobItem {
  id: number;
  url: string;
  title: string;
  company_name: string;
  company_logo?: string;
  category: string;
  job_type: string;
  publication_date: string;
  candidate_required_location: string;
  salary: string;
  description: string;
}

interface RemotiveApiResponse {
  'job-count': number;
  jobs: RemotiveJobItem[];
}

export class RemotiveAdapter implements JobSource {
  public id = 'remotive';
  public name = 'Remotive Remote API';
  public type = 'remote_job_board' as const;
  public enabled = true;
  public priority = 'medium' as const;

  public async search(_profile: JobSearchProfile, context: SearchContext): Promise<RawJob[]> {
    const rawJobs: RawJob[] = [];
    const url = 'https://remotive.com/api/remote-jobs?category=software-dev&limit=30';

    try {
      const { data } = await safeHttpClient.getJson<RemotiveApiResponse>(url, context);

      if (data && Array.isArray(data.jobs)) {
        for (const item of data.jobs) {
          let salaryMin: number | undefined;
          let salaryMax: number | undefined;

          // Parse salary string like "$120k - $160k" if available
          if (item.salary) {
            const match = item.salary.match(/\$?(\d+)[kK]?\s*-\s*\$?(\d+)[kK]?/);
            if (match) {
              const parseNum = (val: string) => {
                const n = parseInt(val, 10);
                return n < 1000 ? n * 1000 : n;
              };
              salaryMin = parseNum(match[1]);
              salaryMax = parseNum(match[2]);
            }
          }

          rawJobs.push({
            source: this.id,
            sourceJobId: String(item.id),
            company: item.company_name,
            title: item.title,
            descriptionHtml: item.description,
            location: item.candidate_required_location ? [item.candidate_required_location] : ['Worldwide'],
            isRemote: true,
            employmentType: item.job_type,
            datePosted: item.publication_date,
            salaryMin,
            salaryMax,
            salaryCurrency: salaryMin ? 'USD' : undefined,
            applicationUrl: item.url,
            canonicalUrl: item.url,
            sourceUrl: item.url,
          });
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      context.logger('remotive_error', { error: message });
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
      avgLatencyMs: 400,
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
