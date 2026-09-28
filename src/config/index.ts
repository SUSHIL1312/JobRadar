// JobRadar Central Configuration

export const APP_CONFIG = {
  name: 'JobRadar',
  version: '1.0.0',
  description: 'Personal Automated Job-Discovery Assistant',

  // Scheduled search limits
  search: {
    maxRuntimeMs: 300000, // 5 minutes target
    hardDeadlineMs: 600000, // 10 minutes hard limit
    maxExternalRequestsPerRun: 40,
    maxPagesPerSource: 3,
    maxJobsPerSource: 50,
    maxRetries: 2,
    requestTimeoutMs: 15000,
    staggerDelayMs: 600, // polite pause between source requests
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
