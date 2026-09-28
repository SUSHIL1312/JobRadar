// Frontend Typed API Client

import {
  NormalizedJob,
  JobSearchProfile,
  JobStatus,
  FilterState,
  SearchRunResult,
  BackendSearchConfig,
  BackendMatchingConfig,
  BackendNotificationConfig,
  SecretStatus,
  ApplicationStatusHistory,
} from '../../types';

class ApiClient {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const json = await res.json();
    if (!res.ok || json.success === false) {
      throw new Error(json.error?.message || `API error (${res.status})`);
    }

    return json.data as T;
  }

  public async getHealth() {
    return this.request<{ status: string; version: string; mockMode: boolean }>('/api/health');
  }

  public async getProfile(): Promise<JobSearchProfile> {
    return this.request<JobSearchProfile>('/api/profile');
  }

  public async saveProfile(profile: JobSearchProfile): Promise<{ message: string }> {
    return this.request<{ message: string }>('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(profile),
    });
  }

  public async getJobs(filter: FilterState): Promise<{
    jobs: NormalizedJob[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const params = new URLSearchParams();
    if (filter.status && filter.status !== 'ALL') params.set('status', filter.status);
    if (filter.ageHorizon && filter.ageHorizon !== 'all') params.set('age', filter.ageHorizon);
    if (filter.remote && filter.remote !== 'ALL') params.set('remote', filter.remote);
    if (filter.seniority && filter.seniority !== 'ALL') params.set('seniority', filter.seniority);
    if (filter.company) params.set('company', filter.company);
    if (filter.source) params.set('source', filter.source);
    if (filter.minScore) params.set('minScore', String(filter.minScore));
    if (filter.searchQuery) params.set('q', filter.searchQuery);
    if (filter.sort) params.set('sort', filter.sort);
    if (filter.page) params.set('page', String(filter.page));
    if (filter.pageSize) params.set('pageSize', String(filter.pageSize));

    return this.request(`/api/jobs?${params.toString()}`);
  }

  public async getJobById(id: string): Promise<NormalizedJob> {
    return this.request<NormalizedJob>(`/api/jobs/${id}`);
  }

  public async getApplicationTimeline(jobId: string): Promise<ApplicationStatusHistory[]> {
    return this.request<ApplicationStatusHistory[]>(`/api/jobs/${jobId}/timeline`);
  }

  public async updateJobStatus(id: string, status: JobStatus, notes?: string): Promise<{ jobId: string; status: JobStatus }> {
    return this.request(`/api/jobs/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    });
  }

  public async updateJobNotes(id: string, notes: string): Promise<{ jobId: string; notes: string }> {
    return this.request(`/api/jobs/${id}/notes`, {
      method: 'PATCH',
      body: JSON.stringify({ notes }),
    });
  }

  public async updateJobInterview(id: string, interviewDate: string, round?: string) {
    return this.request(`/api/jobs/${id}/interview`, {
      method: 'PATCH',
      body: JSON.stringify({ interviewDate, round }),
    });
  }

  public async updateJobOffer(id: string, salary: number, currency: string = 'INR') {
    return this.request(`/api/jobs/${id}/offer`, {
      method: 'PATCH',
      body: JSON.stringify({ salary, currency }),
    });
  }

  public async bulkUpdateStatus(jobIds: string[], status: JobStatus) {
    return this.request<{ count: number; status: JobStatus }>('/api/jobs/bulk-status', {
      method: 'POST',
      body: JSON.stringify({ jobIds, status }),
    });
  }

  public async getAnalytics() {
    return this.request<any>('/api/analytics');
  }

  public async getSources() {
    return this.request<any[]>('/api/sources');
  }

  public async getSearchRuns() {
    return this.request<SearchRunResult[]>('/api/search-runs');
  }

  public async runSearchNow(options?: { mock?: boolean }) {
    return this.request<SearchRunResult>('/api/search/run', {
      method: 'POST',
      body: JSON.stringify(options || {}),
    });
  }

  public async resetJobs() {
    return this.request<{ message: string }>('/api/settings/reset-jobs', {
      method: 'POST',
    });
  }

  public async getSearchConfig(): Promise<BackendSearchConfig> {
    return this.request<BackendSearchConfig>('/api/config/search');
  }

  public async saveSearchConfig(config: BackendSearchConfig): Promise<{ message: string }> {
    return this.request<{ message: string }>('/api/config/search', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  public async getMatchingConfig(): Promise<BackendMatchingConfig> {
    return this.request<BackendMatchingConfig>('/api/config/matching');
  }

  public async saveMatchingConfig(config: BackendMatchingConfig): Promise<{ message: string }> {
    return this.request<{ message: string }>('/api/config/matching', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  public async getNotificationConfig(): Promise<BackendNotificationConfig> {
    return this.request<BackendNotificationConfig>('/api/config/notifications');
  }

  public async saveNotificationConfig(config: BackendNotificationConfig): Promise<{ message: string }> {
    return this.request<{ message: string }>('/api/config/notifications', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  public async getSecretsStatus(): Promise<SecretStatus> {
    return this.request<SecretStatus>('/api/secrets/status');
  }
}

export const api = new ApiClient();
