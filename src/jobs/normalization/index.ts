// Main Job Normalization Pipeline

import { RawJob, NormalizedJob, EmploymentType } from '../../types';
import { cleanHtmlToText } from './text';
import { normalizeTitle, detectSeniority } from './titles';
import { normalizeLocation, detectRemoteType } from './locations';
import { extractSkills } from './skills';
import { parseDateToIso } from './dates';
import { generateFingerprintString, hashString } from '../deduplication/fingerprint';

export async function normalizeJob(raw: RawJob, targetSkills?: string[]): Promise<NormalizedJob> {
  const title = normalizeTitle(raw.title);
  const description = cleanHtmlToText(raw.descriptionHtml || raw.descriptionText || '');
  const location = normalizeLocation(raw.location);
  const remoteType = detectRemoteType(location, title, description, raw.isRemote);
  const seniority = detectSeniority(title, description);

  // Normalize employment type
  let employmentType: EmploymentType = 'unknown';
  const rawEmp = (raw.employmentType || '').toLowerCase();
  if (/full[-_\s]?time/i.test(rawEmp)) employmentType = 'full_time';
  else if (/part[-_\s]?time/i.test(rawEmp)) employmentType = 'part_time';
  else if (/contract|temporary/i.test(rawEmp)) employmentType = 'contract';
  else if (/intern/i.test(rawEmp)) employmentType = 'internship';
  else if (/\bfull[-_\s]?time\b/i.test(description)) employmentType = 'full_time';

  const datePosted = parseDateToIso(raw.datePosted);
  const dateUpdated = parseDateToIso(raw.dateUpdated);
  const nowIso = new Date().toISOString();

  // Generate fingerprint
  const fingerprintRaw = generateFingerprintString({
    company: raw.company,
    title,
    source: raw.source,
    sourceJobId: raw.sourceJobId,
    canonicalUrl: raw.canonicalUrl,
    applicationUrl: raw.applicationUrl,
    location,
  });
  const fingerprintHash = await hashString(fingerprintRaw);
  const id = `job_${fingerprintHash.slice(0, 16)}`;

  return {
    id,
    source: raw.source,
    sourceJobId: raw.sourceJobId,
    company: raw.company.trim(),
    companyDomain: raw.companyDomain?.trim().toLowerCase(),
    title,
    description,
    location,
    remoteType,
    employmentType,
    seniority,
    datePosted,
    dateUpdated,
    salaryMin: raw.salaryMin && raw.salaryMin > 0 ? raw.salaryMin : undefined,
    salaryMax: raw.salaryMax && raw.salaryMax > 0 ? raw.salaryMax : undefined,
    salaryCurrency: raw.salaryCurrency || (raw.salaryMin ? 'USD' : undefined),
    applicationUrl: raw.applicationUrl.trim(),
    canonicalUrl: raw.canonicalUrl?.trim() || raw.applicationUrl.trim(),
    sourceUrl: raw.sourceUrl?.trim() || raw.applicationUrl.trim(),
    discoveredAt: nowIso,
    firstSeenAt: nowIso,
    lastSeenAt: nowIso,
    fingerprint: fingerprintHash,
    status: 'NEW',
  };
}
