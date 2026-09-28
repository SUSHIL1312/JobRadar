// JobRadar Central Configuration

export const APP_CONFIG = {
  name: 'JobRadar',
  version: '1.0.0',
  description: 'Personal Automated Job-Discovery Assistant',

  // Scheduled search limits
  search: {
    maxRuntimeMs: 720000, // 12 minutes hard limit
    targetScanDurationMs: 660000, // 11 minutes (10–12 minutes target scan duration)
    hardDeadlineMs: 750000, // 12.5 minutes hard deadline
    maxExternalRequestsPerRun: 160, // Request budget for deep multi-query scanning
    maxPagesPerSource: 5,
    maxJobsPerSource: 100,
    maxRetries: 2,
    requestTimeoutMs: 15000,
    staggerDelayMs: 2500, // 2.5s polite pause between external requests (prevents 429 rate limits)
    cooldownMs: 60000, // 1 min manual run cooldown
    lockTtlMs: 900000, // 15 min lock lease
  },

  // Deterministic matching weight configuration (must sum to 100)
  matching: {
    weights: {
      title: 25,
      skills: 35,
      seniority: 15,
      experience: 15,
      location: 10,
    },
    // Boosts & penalties
    preferredCompanyBonus: 8,
    excludedCompanyPenalty: 100,
    remoteMatchBonus: 5,
  },

  // SSRF Protection: Strict domain allowlist for external fetch operations
  ssrfAllowlist: [
    'boards-api.greenhouse.io',
    'api.lever.co',
    'api.ashbyhq.com',
    'remotive.com',
    'remoteok.com',
    'api.resend.com',
  ],

  // UI Pagination defaults
  ui: {
    defaultPageSize: 25,
    maxPageSize: 100,
    defaultTimezone: 'Asia/Kolkata',
  },

  // Email notifications defaults
  notifications: {
    defaultFromEmail: 'JobRadar <notifications@resend.dev>',
    defaultSubjectPrefix: 'JobRadar Alert:',
  },
};
