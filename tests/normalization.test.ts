import { describe, it, expect } from 'vitest';
import { cleanHtmlToText } from '../src/jobs/normalization/text';
import { normalizeTitle, detectSeniority } from '../src/jobs/normalization/titles';
import { extractSkills, canonicalizeSkill } from '../src/jobs/normalization/skills';
import { normalizeLocation, detectRemoteType } from '../src/jobs/normalization/locations';
import { parseDateToIso, formatRelativeAge } from '../src/jobs/normalization/dates';
import { generateFingerprintString, deduplicateJobs } from '../src/jobs/deduplication/fingerprint';
import { NormalizedJob } from '../src/types';

describe('Job Normalization Engine', () => {
  it('cleans HTML to plain text without tags or scripts', () => {
    const html = '<div><h3>Job Title</h3><p>We need a <strong>C++</strong> engineer.<script>alert("xss")</script></p></div>';
    const cleaned = cleanHtmlToText(html);
    expect(cleaned).not.toContain('<');
    expect(cleaned).not.toContain('script');
    expect(cleaned).toContain('Job Title');
    expect(cleaned).toContain('C++ engineer.');
  });

  it('normalizes titles and extracts seniority', () => {
    expect(normalizeTitle('Sr. C++ Software Dev (Remote)')).toBe('Senior C++ Software Developer');
    expect(normalizeTitle('SWE III - Machine Learning')).toBe('Software Engineer III - Machine Learning');

    expect(detectSeniority('Senior C++ Developer')).toBe('senior');
    expect(detectSeniority('Staff Engineer, AI')).toBe('staff');
    expect(detectSeniority('Lead Android Developer')).toBe('lead');
    expect(detectSeniority('Junior Software Engineer')).toBe('junior');
  });

  it('extracts canonical skills with synonyms', () => {
    expect(canonicalizeSkill('cpp')).toBe('C++');
    expect(canonicalizeSkill('csharp')).toBe('C#');
    expect(canonicalizeSkill('cv')).toBe('Computer Vision');

    const jobText = 'Looking for an engineer skilled in C++, Python, PyTorch, OpenGL and Linux for real-time graphics.';
    const skills = extractSkills(jobText);
    expect(skills).toContain('C++');
    expect(skills).toContain('Python');
    expect(skills).toContain('PyTorch');
    expect(skills).toContain('OpenGL');
    expect(skills).toContain('Linux');
  });

  it('normalizes locations and detects remote type accurately', () => {
    const locs = normalizeLocation(['Bangalore; Hyderabad', 'Remote']);
    expect(locs).toContain('Bengaluru, India');
    expect(locs).toContain('Hyderabad, India');

    expect(detectRemoteType(locs, 'Senior C++ Engineer - Remote')).toBe('remote');
    expect(detectRemoteType(['Bengaluru, India'], 'Software Engineer')).toBe('onsite');
    expect(detectRemoteType(['Bengaluru, India'], 'Software Engineer (Hybrid) - 2 days office')).toBe('hybrid');
  });

  it('parses relative and ISO dates safely', () => {
    const iso = parseDateToIso('2026-09-28T10:00:00.000Z');
    expect(iso).toBe('2026-09-28T10:00:00.000Z');

    const relative = parseDateToIso('2 hours ago');
    expect(relative).toBeDefined();

    expect(formatRelativeAge(new Date(Date.now() - 3600 * 1000).toISOString())).toBe('1h ago');
  });
});

describe('Deduplication Engine', () => {
  it('generates consistent fingerprints for same company and title', () => {
    const fp1 = generateFingerprintString({
      company: 'NVIDIA Inc.',
      title: 'Senior Software Engineer',
      location: ['Bengaluru, India'],
    });
    const fp2 = generateFingerprintString({
      company: 'Nvidia',
      title: 'Senior Software Engineer',
      location: ['Bengaluru, India'],
    });
    expect(fp1).toBe(fp2);
  });

  it('deduplicates duplicate jobs while prioritizing direct ATS sources', () => {
    const jobA: NormalizedJob = {
      id: 'job_1',
      source: 'mock',
      company: 'NVIDIA',
      title: 'Senior C++ Engineer',
      location: ['Remote'],
      remoteType: 'remote',
      employmentType: 'full_time',
      seniority: 'senior',
      applicationUrl: 'https://nvidia.com/jobs/1',
      sourceUrl: 'https://board.com/nvidia/1',
      discoveredAt: '2026-09-28T10:00:00Z',
      firstSeenAt: '2026-09-28T10:00:00Z',
      lastSeenAt: '2026-09-28T10:00:00Z',
      fingerprint: 'fp_123',
      status: 'NEW',
    };

    const jobB: NormalizedJob = {
      ...jobA,
      id: 'job_2',
      source: 'greenhouse',
      applicationUrl: 'https://boards.greenhouse.io/nvidia/jobs/1',
      firstSeenAt: '2026-09-28T10:05:00Z',
    };

    const merged = deduplicateJobs([jobA, jobB]);
    expect(merged.length).toBe(1);
    expect(merged[0].source).toBe('greenhouse');
    expect(merged[0].applicationUrl).toBe('https://boards.greenhouse.io/nvidia/jobs/1');
  });
});
