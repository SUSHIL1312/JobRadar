// Safe date parsing and relative age formatting

export function parseDateToIso(input?: string | number | Date): string | undefined {
  if (!input) return undefined;

  try {
    // If input is a Date object
    if (input instanceof Date) {
      return isNaN(input.getTime()) ? undefined : input.toISOString();
    }

    // If input is a numeric timestamp (milliseconds or seconds)
    if (typeof input === 'number') {
      const ms = input > 10000000000 ? input : input * 1000;
      const d = new Date(ms);
      return isNaN(d.getTime()) ? undefined : d.toISOString();
    }

    const str = String(input).trim();
    if (!str) return undefined;

    // Check for relative strings like "2 hours ago", "3 days ago", "just now"
    const relativeMatch = str.match(/(\d+)\s*(minute|min|hour|hr|day|week|month)s?\s*ago/i);
    if (relativeMatch) {
      const amount = parseInt(relativeMatch[1], 10);
      const unit = relativeMatch[2].toLowerCase();
      const now = Date.now();
      let diffMs = 0;

      if (unit.startsWith('min')) diffMs = amount * 60 * 1000;
      else if (unit.startsWith('h')) diffMs = amount * 60 * 60 * 1000;
      else if (unit.startsWith('day')) diffMs = amount * 24 * 60 * 60 * 1000;
      else if (unit.startsWith('week')) diffMs = amount * 7 * 24 * 60 * 60 * 1000;
      else if (unit.startsWith('month')) diffMs = amount * 30 * 24 * 60 * 60 * 1000;

      return new Date(now - diffMs).toISOString();
    }

    if (/^yesterday$/i.test(str)) {
      return new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    }

    // Try standard ISO / RFC parsing
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  } catch {
    return undefined;
  }

  return undefined;
}

export function formatRelativeAge(isoDate?: string): string {
  if (!isoDate) return 'Date unavailable';

  const date = new Date(isoDate);
  if (isNaN(date.getTime())) return 'Date unavailable';

  const diffMs = Date.now() - date.getTime();
  if (diffMs < 0) return 'Just now';

  const diffMinutes = Math.floor(diffMs / (60 * 1000));
  const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours === 1) return '1h ago';
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function calculateDiscoveryDelay(datePosted?: string, firstSeenAt?: string): string | undefined {
  if (!datePosted || !firstSeenAt) return undefined;
  const posted = new Date(datePosted).getTime();
  const seen = new Date(firstSeenAt).getTime();
  if (isNaN(posted) || isNaN(seen) || seen < posted) return undefined;

  const diffMs = seen - posted;
  const diffMinutes = Math.floor(diffMs / (60 * 1000));
  if (diffMinutes < 60) return `${diffMinutes} minutes`;
  const diffHours = Math.floor(diffMinutes / 60);
  return `${diffHours} hours`;
}
