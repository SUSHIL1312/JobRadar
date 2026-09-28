// Location and Remote Status Normalization

import { RemoteType } from '../../types';

export const LOCATION_SYNONYMS: Record<string, string> = {
  'bangalore': 'Bengaluru, India',
  'bengaluru': 'Bengaluru, India',
  'hyderabad': 'Hyderabad, India',
  'pune': 'Pune, India',
  'gurgaon': 'Gurugram, India',
  'gurugram': 'Gurugram, India',
  'noida': 'Noida, India',
  'delhi': 'New Delhi, India',
  'new delhi': 'New Delhi, India',
  'mumbai': 'Mumbai, India',
  'bombay': 'Mumbai, India',
  'chennai': 'Chennai, India',
  'madras': 'Chennai, India',
  'india': 'India',
  'sf': 'San Francisco, CA',
  'san francisco': 'San Francisco, CA',
  'new york': 'New York, NY',
  'nyc': 'New York, NY',
  'seattle': 'Seattle, WA',
  'austin': 'Austin, TX',
  'london': 'London, UK',
};

export function normalizeLocation(raw?: string | string[]): string[] {
  if (!raw) return [];

  const rawList = Array.isArray(raw) ? raw : [raw];
  const normalizedSet = new Set<string>();

  for (const item of rawList) {
    if (!item || typeof item !== 'string') continue;

    // Split on semicolons or slashes if multiple locations packed in one string
    const parts = item.split(/[;/]/).map(p => p.trim()).filter(Boolean);

    for (const part of parts) {
      const lower = part.toLowerCase();
      let matched = false;

      for (const [key, canonical] of Object.entries(LOCATION_SYNONYMS)) {
        if (lower === key || lower.includes(` ${key} `) || lower.startsWith(`${key},`)) {
          normalizedSet.add(canonical);
          matched = true;
          break;
        }
      }

      if (!matched && part.length > 1) {
        // Capitalize words nicely
        const clean = part
          .replace(/\s+/g, ' ')
          .replace(/\b\w/g, c => c.toUpperCase());
        normalizedSet.add(clean);
      }
    }
  }

  return Array.from(normalizedSet);
}

export function detectRemoteType(
  locations: string[],
  title: string,
  description?: string,
  rawIsRemote?: boolean
): RemoteType {
  // If explicitly flagged as remote by the source API
  if (rawIsRemote === true) {
    return 'remote';
  }

  const combined = `${title} ${locations.join(' ')} ${description?.slice(0, 1000) || ''}`.toLowerCase();

  // Check explicit remote indicators
  if (
    /\b(remote|work from anywhere|wfh|fully remote|100% remote|remote worldwide|remote - india)\b/i.test(title) ||
    locations.some(l => /\bremote\b/i.test(l))
  ) {
    return 'remote';
  }

  // Check hybrid indicators
  if (/\b(hybrid|flexible work|partially remote|2-3 days in office|hybrid work)\b/i.test(combined)) {
    return 'hybrid';
  }

  // Check remote anywhere in first 1000 chars of description
  if (/\b(this is a fully remote|position is remote|anywhere in the world|work remotely)\b/i.test(combined)) {
    return 'remote';
  }

  // Check onsite indicators
  if (/\b(on-site|onsite|in-office|office based|relocation required)\b/i.test(combined)) {
    return 'onsite';
  }

  // If locations specified and no remote keywords found, default to onsite if physical city specified
  if (locations.length > 0 && !locations.some(l => /remote/i.test(l))) {
    return 'onsite';
  }

  return 'unknown';
}
