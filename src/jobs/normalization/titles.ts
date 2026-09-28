// Title and Seniority Normalization

import { Seniority } from '../../types';

export function normalizeTitle(rawTitle: string): string {
  let title = rawTitle.trim();

  // Strip common noise like "(m/f/d)", "(Remote)", "(US Only)", "(India)", job IDs
  title = title.replace(/\((?:m\/f\/d|remote|hybrid|onsite|f\/m\/d|[0-9]+)\)/gi, '');
  title = title.replace(/\[(?:remote|hybrid|onsite)\]/gi, '');
  title = title.replace(/-\s*(?:remote|hybrid|full-time|india|us|emea)\b/gi, '');

  // Normalize common title contractions
  title = title.replace(/\bSr\.?(?=\s|$)/gi, 'Senior');
  title = title.replace(/\bJr\.?(?=\s|$)/gi, 'Junior');
  title = title.replace(/\bMgr\.?(?=\s|$)/gi, 'Manager');
  title = title.replace(/\bDev\b/gi, 'Developer');
  title = title.replace(/\bEng\.?(?=\s|$)/gi, 'Engineer');
  title = title.replace(/\bSW\b/gi, 'Software');
  title = title.replace(/\bSWE\b/gi, 'Software Engineer');
  title = title.replace(/\bSDE\s*I\b/gi, 'Software Development Engineer I');
  title = title.replace(/\bSDE\s*II\b/gi, 'Software Development Engineer II');
  title = title.replace(/\bSDE\s*III\b/gi, 'Senior Software Development Engineer');

  return title.replace(/\s+/g, ' ').trim();
}

export function detectSeniority(title: string, description?: string): Seniority {
  const textToScan = `${title} ${description?.slice(0, 500) || ''}`.toLowerCase();

  if (/\b(principal|fellow|distinguished)\b/i.test(title)) {
    return 'principal';
  }
  if (/\b(staff)\b/i.test(title)) {
    return 'staff';
  }
  if (/\b(lead|tech lead|team lead|architect)\b/i.test(title)) {
    return 'lead';
  }
  if (/\b(senior|sr\.?|sde\s*3|sde\s*iii|level\s*5|l5|l6)\b/i.test(title)) {
    return 'senior';
  }
  if (/\b(junior|jr\.?|associate|entry|intern|graduate|sde\s*1|sde\s*i)\b/i.test(title)) {
    return 'junior';
  }
  if (/\b(mid|intermediate|sde\s*2|sde\s*ii|level\s*4|l4)\b/i.test(title)) {
    return 'mid';
  }

  // Fallback to description inspection if title has no clear marker
  if (/\b(5\+|6\+|7\+|8\+|10\+)\s*(?:years|yrs)\b/i.test(textToScan)) {
    return 'senior';
  }
  if (/\b(3\+|4\+|2-5|3-5)\s*(?:years|yrs)\b/i.test(textToScan)) {
    return 'mid';
  }
  if (/\b(0-2|1-2|entry level|fresh graduate)\b/i.test(textToScan)) {
    return 'junior';
  }

  return 'unknown';
}
