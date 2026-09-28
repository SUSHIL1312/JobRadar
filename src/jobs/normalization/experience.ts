// Experience Requirement Parser

export interface ParsedExperience {
  minYears?: number;
  maxYears?: number;
  experienceText?: string;
}

export function parseExperienceRequirements(text?: string): ParsedExperience {
  if (!text) return {};

  const cleanText = text.replace(/[\n\r]+/g, ' ');

  // Pattern 1: Range like "4-7 years", "4 to 7 yrs", "3 - 5 years"
  const rangeMatch = cleanText.match(/\b(\d+)\s*(?:-|to)\s*(\d+)\+?\s*(?:years|yrs)\b/i);
  if (rangeMatch) {
    const minYears = parseInt(rangeMatch[1], 10);
    const maxYears = parseInt(rangeMatch[2], 10);
    return {
      minYears,
      maxYears,
      experienceText: `Requires ${minYears}–${maxYears} years`,
    };
  }

  // Pattern 2: "5+ years", "at least 4 years", "minimum of 3 years"
  const plusMatch = cleanText.match(/(?:at least|minimum of)?\s*(\d+)\+?\s*(?:years|yrs)\b/i);
  if (plusMatch) {
    const minYears = parseInt(plusMatch[1], 10);
    return {
      minYears,
      experienceText: `Requires ${minYears}+ years`,
    };
  }

  // Pattern 3: Freshers / Entry-level
  if (/\b(fresher|freshers|entry level|0-1 years|0-2 years|no prior experience)\b/i.test(cleanText)) {
    return {
      minYears: 0,
      maxYears: 1,
      experienceText: 'Entry level / Freshers',
    };
  }

  return {};
}
