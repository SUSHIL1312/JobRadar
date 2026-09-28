import { describe, it, expect } from 'vitest';
import { calculateMatchScore } from '../src/jobs/matching/engine';
import { NormalizedJob, JobSearchProfile } from '../src/types';

describe('Deterministic Matching Engine', () => {
  const mockProfile: JobSearchProfile = {
    id: 'default_profile',
    fullName: 'Sushil',
    email: 'user@example.com',
    title: 'Senior Software Engineer (C++ / AI)',
    yearsOfExperience: 4.5,
    skills: ['C++', 'Python', 'PyTorch', 'Computer Vision', 'Linux', 'OpenGL', 'Android'],
    jobTitles: ['Software Engineer', 'C++ Software Engineer', 'Machine Learning Engineer', 'Computer Vision Engineer'],
    seniorityLevels: ['mid', 'senior', 'lead', 'staff'],
    locations: ['India', 'Remote', 'Worldwide'],
    remotePreference: 'remote_preferred',
    employmentTypes: ['full_time'],
    preferredCompanies: ['NVIDIA', 'Adobe', 'Qualcomm', 'Google'],
    excludedCompanies: ['BadCompany'],
    keywords: [],
    excludedKeywords: ['sales', 'unpaid', 'intern'],
    enabledSources: ['mock', 'greenhouse'],
  };

  const perfectJob: NormalizedJob = {
    id: 'job_high_match',
    source: 'greenhouse',
    company: 'NVIDIA',
    title: 'Senior C++ Software Engineer',
    description: 'We are seeking a Senior C++ Engineer with experience in Python, PyTorch, Computer Vision, and Linux for our AI team. Requires 4+ years experience.',
    location: ['Bengaluru, India', 'Remote'],
    remoteType: 'remote',
    employmentType: 'full_time',
    seniority: 'senior',
    applicationUrl: 'https://nvidia.com/careers/123',
    sourceUrl: 'https://nvidia.com/careers/123',
    discoveredAt: new Date().toISOString(),
    firstSeenAt: new Date().toISOString(),
    lastSeenAt: new Date().toISOString(),
    fingerprint: 'fp_high',
    status: 'NEW',
  };

  it('calculates a high match score for aligned job', () => {
    const result = calculateMatchScore(perfectJob, mockProfile);
    expect(result.overallScore).toBeGreaterThanOrEqual(85);
    expect(result.matchingSkills).toContain('C++');
    expect(result.matchingSkills).toContain('Python');
    expect(result.matchingSkills).toContain('PyTorch');
    expect(result.explanation.companyStatus).toBe('preferred');
    expect(result.explanation.seniorityMatch).toBe(true);
  });

  it('disqualifies excluded company completely', () => {
    const badCompanyJob: NormalizedJob = {
      ...perfectJob,
      company: 'BadCompany Inc',
      fingerprint: 'fp_bad',
    };
    const result = calculateMatchScore(badCompanyJob, mockProfile);
    expect(result.overallScore).toBe(0);
    expect(result.explanation.summary).toContain('Excluded company');
  });

  it('disqualifies excluded keywords like intern or sales', () => {
    const internJob: NormalizedJob = {
      ...perfectJob,
      title: 'C++ Intern Engineer',
      fingerprint: 'fp_intern',
    };
    const result = calculateMatchScore(internJob, mockProfile);
    expect(result.overallScore).toBe(0);
    expect(result.explanation.summary).toContain('Excluded keyword');
  });

  it('provides explainable transparency breakdown', () => {
    const result = calculateMatchScore(perfectJob, mockProfile);
    expect(result.titleScore).toBeGreaterThan(0);
    expect(result.skillScore).toBeGreaterThan(0);
    expect(result.seniorityScore).toBe(100);
    expect(result.experienceScore).toBe(100);
    expect(result.locationScore).toBe(100);
    expect(result.explanation.summary).toBeDefined();
  });

  describe('Experience Compatibility (4.5 YOE Samsung Profile)', () => {
    it('evaluates jobs requiring <= 5 years as Compatible', () => {
      const compatibleJob: NormalizedJob = {
        ...perfectJob,
        minExperienceYears: 3,
        maxExperienceYears: 5,
      };
      const result = calculateMatchScore(compatibleJob, mockProfile);
      expect(result.experienceCompatibility).toBeDefined();
      expect(result.experienceCompatibility?.status).toBe('compatible');
      expect(result.experienceCompatibility?.label).toContain('Compatible');
      expect(result.experienceCompatibility?.minYears).toBe(3);
      expect(result.experienceCompatibility?.maxYears).toBe(5);
    });

    it('evaluates jobs requiring 6+ years as Reach without disqualifying or hiding them', () => {
      const reachJob: NormalizedJob = {
        ...perfectJob,
        description: 'Requires extensive engineering experience and leadership.',
        minExperienceYears: 7,
        maxExperienceYears: 10,
      };
      const result = calculateMatchScore(reachJob, mockProfile);
      expect(result.experienceCompatibility).toBeDefined();
      expect(result.experienceCompatibility?.status).toBe('reach');
      expect(result.experienceCompatibility?.label).toContain('Reach');
      // Must NOT disqualify the job!
      expect(result.overallScore).toBeGreaterThan(0);
      expect(result.explanation.summary).not.toContain('Excluded');
    });

    it('evaluates jobs with unspecified experience as Not Specified', () => {
      const unspecifiedJob: NormalizedJob = {
        ...perfectJob,
        description: 'We are seeking a C++ Engineer for our AI team.',
        minExperienceYears: undefined,
        maxExperienceYears: undefined,
      };
      const result = calculateMatchScore(unspecifiedJob, mockProfile);
      expect(result.experienceCompatibility).toBeDefined();
      expect(result.experienceCompatibility?.status).toBe('unspecified');
      expect(result.experienceCompatibility?.label).toContain('Not specified');
    });
  });

  describe('Target Company Universe & Tier Scoring', () => {
    it('awards +15 points bonus to Tier 1 companies (NVIDIA, Google, Atlassian, etc.)', () => {
      const tier1Job: NormalizedJob = {
        ...perfectJob,
        company: 'Atlassian',
      };
      const result = calculateMatchScore(tier1Job, mockProfile);
      expect(result.overallScore).toBeGreaterThanOrEqual(70);
      expect(result.explanation.summary).toContain('Tier 1 (Must-Check) target company');
    });

    it('awards +8 points bonus to Tier 2 companies (Stripe, Rippling, Coinbase, etc.)', () => {
      const tier2Job: NormalizedJob = {
        ...perfectJob,
        company: 'Stripe',
      };
      const result = calculateMatchScore(tier2Job, mockProfile);
      expect(result.explanation.summary).toContain('Tier 2 (High-Value) target company');
    });
  });

  describe('Remote Priority Dimension & Compensation Protection', () => {
    it('applies boost for remote jobs when remote priority is highest', () => {
      const highRemoteProfile: JobSearchProfile = {
        ...mockProfile,
        remotePriority: 'highest',
      };
      const remoteJob: NormalizedJob = {
        ...perfectJob,
        remoteType: 'remote',
      };
      const result = calculateMatchScore(remoteJob, highRemoteProfile);
      expect(result.locationScore).toBe(100);
      expect(result.overallScore).toBeGreaterThanOrEqual(80);
    });

    it('protects jobs with undisclosed compensation (never penalizes to 0)', () => {
      const undisclosedSalaryJob: NormalizedJob = {
        ...perfectJob,
        salary: undefined,
      };
      const result = calculateMatchScore(undisclosedSalaryJob, mockProfile);
      expect(result.overallScore).toBeGreaterThanOrEqual(80);
      expect(result.explanation.summary).not.toContain('Excluded');
    });
  });
});

