// Greenhouse Official Public Boards API Adapter

import { JobSource, RawJob, JobSearchProfile, SearchContext, SourceHealth, SourceCapabilities } from '../../types';
import { safeHttpClient } from './httpClient';

interface GreenhouseJobResponse {
  jobs: Array<{
    id: number;
    title: string;
    updated_at: string;
    absolute_url: string;
    location?: {
      name?: string;
    };
    content?: string;
    departments?: Array<{ name: string }>;
  }>;
}

export class GreenhouseAdapter implements JobSource {
  public id = 'greenhouse';
  public name = 'Greenhouse Public Board API';
  public type = 'ats' as const;
  public enabled = true;
  public priority = 'high' as const;

  // Target universe companies utilizing Greenhouse public job boards
  private defaultBoards = [
    'cloudflare',
    'stripe',
    'rubrik',
    'databricks',
    'confluent',
    'rippling',
    'snowflake',
    'coinbase',
    'airbnb',
    'figma',
  ];

  public async search(profile: JobSearchProfile, context: SearchContext): Promise<RawJob[]> {
    const rawJobs: RawJob[] = [];
    const boards = this.defaultBoards;

    for (const board of boards) {
      if (Date.now() >= context.deadline || context.requestsUsed >= context.maxRequests) {
        break;
      }

      const url = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(board)}/jobs?content=true`;

      try {
        const { data } = await safeHttpClient.getJson<GreenhouseJobResponse>(url, context);

        if (data && Array.isArray(data.jobs)) {
          for (const item of data.jobs) {
            const locationStr = item.location?.name || '';
            const companyDisplayName = board.charAt(0).toUpperCase() + board.slice(1);

            rawJobs.push({
              source: this.id,
              sourceJobId: String(item.id),
              company: companyDisplayName,
              companyDomain: `${board}.com`,
              title: item.title,
              descriptionHtml: item.content,
              location: locationStr ? [locationStr] : undefined,
              datePosted: item.updated_at,
              dateUpdated: item.updated_at,
              applicationUrl: item.absolute_url,
              canonicalUrl: item.absolute_url,
              sourceUrl: item.absolute_url,
            });
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        context.logger('greenhouse_board_error', { board, error: message });
        // Individual board failure does not break the entire run
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
      avgLatencyMs: 250,
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
