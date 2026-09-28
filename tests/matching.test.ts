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
});
