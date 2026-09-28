// Lever Official Public Postings API Adapter

import { JobSource, RawJob, JobSearchProfile, SearchContext, SourceHealth, SourceCapabilities } from '../../types';
import { safeHttpClient } from './httpClient';

interface LeverPosting {
  id: string;
  text: string;
  createdAt: number;
  hostedUrl: string;
  applyUrl: string;
  categories?: {
    location?: string;
    commitment?: string;
    team?: string;
    allLocations?: string[];
  };
  descriptionPlain?: string;
  description?: string;
  workplaceType?: string; // 'remote', 'onsite', 'hybrid'
  salaryDescription?: string;
}

export class LeverAdapter implements JobSource {
  public id = 'lever';
  public name = 'Lever Public Postings API';
  public type = 'ats' as const;
  public enabled = true;
  public priority = 'high' as const;

  // Example reputable tech companies utilizing Lever public boards
  private defaultCompanies = ['palantir', 'atlassian', 'netflix'];

  public async search(_profile: JobSearchProfile, context: SearchContext): Promise<RawJob[]> {
    const rawJobs: RawJob[] = [];

    for (const company of this.defaultCompanies) {
      if (Date.now() >= context.deadline || context.requestsUsed >= context.maxRequests) {
        break;
      }

      const url = `https://api.lever.co/v0/postings/${encodeURIComponent(company)}?mode=json`;

      try {
        const { data } = await safeHttpClient.getJson<LeverPosting[]>(url, context);

        if (Array.isArray(data)) {
          for (const item of data) {
            const locs = item.categories?.allLocations || (item.categories?.location ? [item.categories.location] : []);
            const isRemote = item.workplaceType === 'remote' || item.text.toLowerCase().includes('remote');
            const companyName = company.charAt(0).toUpperCase() + company.slice(1);

            rawJobs.push({
              source: this.id,
              sourceJobId: item.id,
              company: companyName,
              companyDomain: `${company}.com`,
              title: item.text,
              descriptionText: item.descriptionPlain || item.description,
              location: locs,
              isRemote,
              employmentType: item.categories?.commitment,
              datePosted: item.createdAt,
              applicationUrl: item.applyUrl || item.hostedUrl,
              canonicalUrl: item.hostedUrl,
              sourceUrl: item.hostedUrl,
            });
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        context.logger('lever_postings_error', { company, error: message });
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
      avgLatencyMs: 300,
      rateLimitHits: 0,
      consecutiveFailures: 0,
    };
  }

  public getCapabilities(): SourceCapabilities {
    return {
      supportsPagination: false,
      supportsDateFilter: false,
      providesExactSalary: false,
      providesFullDescription: true,
      rateLimitPerMinute: 60,
    };
  }
}
