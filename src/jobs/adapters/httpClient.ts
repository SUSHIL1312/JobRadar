// SSRF-Protected, Polite HTTP Client for Job Adapters

import { APP_CONFIG } from '../../config';
import { SearchContext } from '../../types';

export class SafeHttpClient {
  private allowlist: Set<string>;

  constructor() {
    this.allowlist = new Set(APP_CONFIG.ssrfAllowlist.map(h => h.toLowerCase()));
  }

  /**
   * Verifies that the URL hostname matches the strict allowlist
   */
  public isAllowedHost(urlString: string): boolean {
    try {
      const parsed = new URL(urlString);
      if (parsed.protocol !== 'https:') return false;
      const hostname = parsed.hostname.toLowerCase();
      return this.allowlist.has(hostname);
    } catch {
      return false;
    }
  }

  /**
   * Makes a polite request respecting budgets, timeouts, and rate limits
   */
  public async getJson<T = unknown>(
    url: string,
    context: SearchContext,
    headers: Record<string, string> = {}
  ): Promise<{ data: T; status: number; durationMs: number }> {
    // 1. SSRF Check
    if (!this.isAllowedHost(url)) {
      throw new Error(`SSRF blocked request to non-allowlisted host: ${url}`);
    }

    // 2. Budget checks
    if (Date.now() >= context.deadline) {
      throw new Error(`Search time budget exceeded before requesting ${url}`);
    }

    if (context.requestsUsed >= context.maxRequests) {
      throw new Error(`External request budget (${context.maxRequests}) exceeded`);
    }

    context.requestsUsed++;

    const startTime = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), APP_CONFIG.search.requestTimeoutMs);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'JobRadar/1.0 (Personal Job Discovery Assistant; non-commercial; contact: user@example.com)',
          ...headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);
      const durationMs = Date.now() - startTime;

      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        throw new Error(`Rate limited (429) by ${url}. Retry-After: ${retryAfter || 'unspecified'}`);
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText} from ${url}`);
      }

      const data = (await response.json()) as T;
      return { data, status: response.status, durationMs };
    } catch (err: unknown) {
      clearTimeout(timeout);
      const durationMs = Date.now() - startTime;
      const message = err instanceof Error ? err.message : String(err);
      context.logger('http_request_error', { url, error: message, durationMs });
      throw err;
    }
  }
}

export const safeHttpClient = new SafeHttpClient();
