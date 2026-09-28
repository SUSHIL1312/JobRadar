// Core JobRadar Domain Types

export type JobStatus =
  | 'NEW'
  | 'SAVED'
  | 'SELECTED'
  | 'APPLIED'
  | 'REJECTED'
  | 'INTERVIEW'
  | 'OFFER'
  | 'IGNORED';

export type RemoteType = 'remote' | 'hybrid' | 'onsite' | 'unknown';

export type EmploymentType =
  | 'full_time'
  | 'part_time'
  | 'contract'
  | 'internship'
  | 'unknown';

export type Seniority =
  | 'fresher'
  | 'entry'
  | 'junior'
  | 'mid'
  | 'senior'
  | 'lead'
  | 'staff'
  | 'principal'
  | 'unknown';

export type RemotePreference =
  | 'remote_only'
  | 'remote_preferred'
  | 'hybrid_ok'
  | 'any';

export type SourceType =
  | 'ats'
  | 'company_career'
  | 'remote_job_board'
  | 'job_board'
  | 'api'
  | 'rss'
  | 'feed'
  | 'mock'
  | 'discovery';

export interface JobSearchProfile {
  id: string;
  fullName: string;
  email: string;
  title: string;
  yearsOfExperience: number;
  currentRole?: string;
  currentCompany?: string;
  education?: string;
  currentCompensationBase?: number;
  currentCompensationBonus?: number;
  targetBase?: number;
  targetTc?: number;
  remotePriority?: 'highest' | 'high' | 'normal' | 'low';
  skills: string[];
  jobTitles: string[];
  seniorityLevels: Seniority[];
  locations: string[];
  remotePreference: RemotePreference;
  employmentTypes: EmploymentType[];
  minimumSalary?: number;
  salaryCurrency?: string;
  preferredCompanies: string[];
  excludedCompanies: string[];
  keywords: string[];
  excludedKeywords: string[];
  enabledSources: string[];
}

export interface RawJob {
  source: string;
  sourceJobId?: string;
  company: string;
  companyDomain?: string;
  title: string;
  descriptionHtml?: string;
  descriptionText?: string;
  location?: string | string[];
  isRemote?: boolean;
  employmentType?: string;
  seniority?: string;
  datePosted?: string | number | Date;
  dateUpdated?: string | number | Date;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  salaryPeriod?: 'year' | 'month' | 'hour' | 'unknown';
  applicationUrl: string;
  canonicalUrl?: string;
  sourceUrl?: string;
  discoveredVia?: string;
  canonicalSource?: string;
  rawPayload?: Record<string, unknown>;
}

export type JobAvailability = 'ACTIVE' | 'UNVERIFIED' | 'EXPIRED' | 'REMOVED' | 'INVALID';

export interface ValidationCheckResult {
  passed: boolean;
  availability: JobAvailability;
  verifiedAt: string;
  httpStatus?: number;
  reason?: string;
  checks: {
    titlePresent: boolean;
    companyPresent: boolean;
    urlValid: boolean;
    domainAllowed: boolean;
    httpReachable?: boolean;
    closureDetected?: boolean;
    contentMatch?: boolean;
  };
}

export interface NormalizedJob {
  id: string; // Database primary key (UUID-like)
  jobId: string; // Stable human-readable JobRadar ID (e.g. JR-2026-000184)
  source: string;
  sourceJobId?: string; // ID from Greenhouse/Lever/etc.
  company: string;
  companyDomain?: string;
  title: string;
  description?: string;
  location: string[];
  remoteType: RemoteType;
  employmentType: EmploymentType;
  seniority: Seniority;

  // Experience requirements
  minExperienceYears?: number;
  maxExperienceYears?: number;
  experienceText?: string;

  // Compensation
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  salaryPeriod?: 'year' | 'month' | 'hour' | 'unknown';
  compensationStatus?: 'disclosed_base' | 'disclosed_tc' | 'undisclosed';
  bonusEstimated?: number;
  equityEstimated?: number;
  totalCompEstimated?: number;

  // Important dates
  datePosted?: string; // ISO 8601 UTC
  dateUpdated?: string;
  firstSeenAt: string;
  lastSeenAt: string;

  // URLs & Provenance
  applicationUrl: string;
  canonicalUrl?: string;
  sourceUrl: string;
  discoveredVia?: string;
  canonicalSource?: string;
  discoveredAt: string; // ISO 8601 UTC

  // Verification & Availability
  availabilityStatus: JobAvailability;
  lastVerifiedAt?: string;
  verificationReason?: string;

  fingerprint: string;
  status: JobStatus;
  appliedAt?: string;
  rejectedAt?: string;
  notes?: string;
  interviewDate?: string;
  interviewRound?: string;
  offerSalary?: number;
  offerCurrency?: string;
  viewedAt?: string;
  matchScore?: MatchResult;
  experienceCompatibility?: ExperienceCompatibility;
}

export interface ExperienceCompatibility {
  status: 'compatible' | 'reach' | 'entry' | 'unspecified';
  label: string; // e.g. "✓ Compatible (3–6 yrs)", "⚠ Reach (7–10 yrs)", "ℹ Exp: Not specified"
  requiredText: string;
  minYears?: number;
  maxYears?: number;
}

export interface JobApplication {
  applicationId: string;
  jobId: string; // References internal job ID
  humanJobId: string; // e.g. JR-2026-000184
  status: 'selected' | 'applied' | 'interview' | 'offer' | 'rejected' | 'withdrawn';
  appliedAt?: string;
  applicationUrl: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationStatusHistory {
  id: string;
  applicationId?: string;
  jobId: string;
  humanJobId?: string;
  oldStatus?: string;
  newStatus: string;
  changedAt: string;
  notes?: string;
}

export interface MatchResult {
  overallScore: number; // 0 - 100
  titleScore: number;
  skillScore: number;
  seniorityScore: number;
  experienceScore: number;
  locationScore: number;
  matchingSkills: string[];
  missingSkills: string[];
  experienceCompatibility?: ExperienceCompatibility;
  explanation: {
    titleMatch: 'strong' | 'good' | 'moderate' | 'weak';
    skillsCoverage: number; // percentage
    seniorityMatch: boolean;
    experienceMatch: boolean;
    locationMatch: 'exact' | 'remote_aligned' | 'acceptable' | 'unaligned';
    companyStatus: 'preferred' | 'neutral' | 'excluded';
    summary: string;
  };
  calculatedAt: string;
}

export interface SearchContext {
  runId: string;
  startedAt: number;
  deadline: number;
  maxRequests: number;
  requestsUsed: number;
  isMockOnly: boolean;
  logger: (event: string, meta?: Record<string, unknown>) => void;
}

export interface SourceHealth {
  sourceId: string;
  name: string;
  status: 'healthy' | 'warning' | 'error' | 'disabled';
  lastRunAt?: string;
  lastRunStatus?: string;
  jobsFoundTotal: number;
  avgLatencyMs: number;
  rateLimitHits: number;
  consecutiveFailures: number;
  errorMessage?: string;
}

export interface SourceCapabilities {
  supportsPagination: boolean;
  supportsDateFilter: boolean;
  providesExactSalary: boolean;
  providesFullDescription: boolean;
  rateLimitPerMinute: number;
}

export interface JobSource {
  id: string;
  name: string;
  type: SourceType;
  enabled: boolean;
  priority: 'high' | 'medium' | 'low';

  search(
    profile: JobSearchProfile,
    context: SearchContext
  ): Promise<RawJob[]>;

  healthCheck?(): Promise<SourceHealth>;

  getCapabilities(): SourceCapabilities;
}

export interface SearchRunResult {
  runId: string;
  triggerType: 'cron' | 'manual';
  status: 'RUNNING' | 'COMPLETED' | 'PARTIAL' | 'FAILED';
  startedAt: string;
  finishedAt?: string;
  durationMs?: number;
  sourcesAttempted: number;
  sourcesSucceeded: number;
  sourcesFailed: number;
  jobsFetched: number;
  jobsNormalized: number;
  jobsDuplicates: number;
  jobsNew: number;
  jobsMatching: number;
  errorSummary?: string;
  sources: Array<{
    sourceId: string;
    status: 'SUCCESS' | 'RATE_LIMITED' | 'TIMEOUT' | 'FAILED';
    jobsFound: number;
    newJobs: number;
    durationMs: number;
    error?: string;
  }>;
}

export interface BackendSearchConfig {
  maxRuntimeMs: number;
  targetScanDurationMs?: number;
  maxExternalRequestsPerRun: number;
  maxPagesPerSource: number;
  freshnessHorizon: string;
  staggerDelayMs: number;
  cooldownMs: number;
}

export interface BackendMatchingConfig {
  weights: {
    title: number;
    skills: number;
    seniority: number;
    experience: number;
    location: number;
  };
  preferredCompanyBonus: number;
  minScoreThreshold: number;
}

export interface BackendNotificationConfig {
  emailEnabled: boolean;
  emailRecipient: string;
  minScoreForNotification: number;
  maxJobsPerEmail: number;
  notifyOnZeroJobs: boolean;
}

export interface SecretStatus {
  resendApiKeyConfigured: boolean;
  resendApiKeyMasked?: string | null;
  authSecretConfigured: boolean;
  authSecretMasked?: string | null;
}

export interface Company {
  id: string;
  name: string;
  domain?: string;
  careerUrl?: string;
  atsType?: string;
  atsIdentifier?: string;
  priority: 'preferred' | 'neutral' | 'excluded';
  tier: 'tier_1' | 'tier_2' | 'tier_3';
  targetRoles?: string;
  remoteEligible?: boolean;
  enabled: boolean;
}

export interface FilterState {
  status?: JobStatus | 'ALL';
  availability?: JobAvailability | 'ALL';
  ageHorizon?: string; // '6h', '12h', '24h', '2d', '3d', '7d', '14d', '30d', 'all'
  remote?: RemoteType | 'ALL';
  seniority?: Seniority | 'ALL';
  company?: string;
  source?: string;
  minScore?: number;
  searchQuery?: string; // supports "JR-2026-000184", source IDs, companies, titles, skills
  location?: string;
  experienceRange?: string; // 'all', '1-3', '3-6', '5-8', '8+'
  minBaseSalary?: number;
  minTotalComp?: number;
  includeUndisclosedSalary?: boolean;
  sort?:
    | 'fresh_match'
    | 'newest'
    | 'oldest'
    | 'match_desc'
    | 'salary_desc'
    | 'salary_asc'
    | 'company';
  page?: number;
  pageSize?: number;
}
