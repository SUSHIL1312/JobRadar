// Multi-signal fingerprinting and deduplication

import { RawJob, NormalizedJob } from '../../types';

export function normalizeCompanyName(company: string): string {
  return company
    .toLowerCase()
    .replace(/\b(inc|incorporated|llc|ltd|limited|pvt|private|corp|corporation|gmbh|co)\b/gi, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

export function generateFingerprintString(job: {
  company: string;
  title: string;
  source?: string;
  sourceJobId?: string;
  canonicalUrl?: string;
  applicationUrl?: string;
  location?: string[];
}): string {
  // If specific ATS source and ID exists, use it as primary key signal
  if (job.source && job.sourceJobId && job.source !== 'mock') {
    return `${job.source.toLowerCase()}:${job.sourceJobId.trim().toLowerCase()}`;
  }

  // Canonical company and title
  const comp = normalizeCompanyName(job.company);
  const title = job.title.toLowerCase().replace(/[^a-z0-9]/g, '');

  // Normalized location summary
  const loc = (job.location || []).map(l => l.toLowerCase().replace(/[^a-z0-9]/g, '')).sort().join('_');

  return `sig:${comp}:${title}:${loc}`;
}

export async function hashString(str: string): Promise<string> {
  // Use Web Crypto API available in Cloudflare Workers and modern Node
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const msgUint8 = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
  }

  // Fallback simple deterministic hash if Web Crypto isn't loaded
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(16, '0');
}

export function deduplicateJobs(jobs: NormalizedJob[]): NormalizedJob[] {
  const map = new Map<string, NormalizedJob>();

  for (const job of jobs) {
    const existing = map.get(job.fingerprint);
    if (!existing) {
      map.set(job.fingerprint, job);
      continue;
    }

    // Merge strategy: prefer official ATS / direct company source over generic board
    const priority = ['greenhouse', 'lever', 'ashby', 'company_career', 'remotive', 'mock'];
    const existingIdx = priority.indexOf(existing.source);
    const newIdx = priority.indexOf(job.source);

    // If new job comes from a higher priority source (lower index), update canonical
    if (newIdx !== -1 && (existingIdx === -1 || newIdx < existingIdx)) {
      map.set(job.fingerprint, {
        ...job,
        firstSeenAt: existing.firstSeenAt < job.firstSeenAt ? existing.firstSeenAt : job.firstSeenAt,
        notes: existing.notes || job.notes,
        status: existing.status !== 'NEW' ? existing.status : job.status,
      });
    }
  }

  return Array.from(map.values());
}
